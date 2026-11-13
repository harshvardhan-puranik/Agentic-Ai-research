import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import {
  getDomainClassifier,
  getSentenceRoleClassifier,
  getTrainedModelsSummary
} from './src/ml/index.js';
import {
  validateOutput1Payload,
  analyzePaperRecord,
  generateCrossPaperSynthesis,
  buildModule3Output,
  validateModule3Schema,
  identifySectionHeadings,
  chunkDocumentWithPages,
  retrieveRelevantChunks,
  findActualPageForExcerpt,
  NOT_REPORTED,
  SAMPLE_OUTPUT_1
} from './src/utils/paperAnalysisEngine.js';
import {
  validateOutput2Payload,
  normalizeObservations,
  clusterObservations,
  detectContradictionsAndTensions,
  formulateCandidateGaps,
  gradeEvidenceStrength,
  assessEvidenceSufficiency,
  isReportedValue,
  buildFinalGapReport,
  generateMarkdownReport,
  SAMPLE_OUTPUT_2
} from './src/utils/researchGapEngine.js';
import {
  normalizeTitle,
  normalizeDoi,
  normalizeAuthors,
  deduplicatePapers,
  filterPapers,
  computeSearchCorpusStats,
  calculateRelevanceScore,
  generateRelevanceExplanation,
  expandSearchTerms,
  buildModule2Output
} from './src/utils/academicSearchEngine.js';
import {
  reconstructOpenAlexAbstract
} from './src/services/academicApi.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('[ResearchScholar AI] Initialized in-house ML/IR engine (zero external generative AI API dependencies).');

// ============================================================================
// Server-Side Federated Academic Search Engines (No CORS, Polite Headers)
// ============================================================================

async function searchOpenAlexServer(query, limit = 15) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}&mailto=scholar@researchscholar.ai`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ResearchScholarAI/2.0 (academic search engine; mailto:scholar@researchscholar.ai)' },
    signal: AbortSignal.timeout(6500)
  });
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = await res.json();
  const papers = (data.results || []).map((item, idx) => {
    const doi = item.doi ? item.doi.replace(/^https?:\/\/doi\.org\//i, '') : null;
    const abstract = reconstructOpenAlexAbstract(item.abstract_inverted_index) ||
      (item.title ? `Scholarly work published in ${item.primary_location?.source?.display_name || 'peer-reviewed venue'}.` : '');
    const isOpenAccess = item.open_access?.is_oa || false;
    const oaStatus = item.open_access?.oa_status || (isOpenAccess ? 'gold' : 'closed');
    const pdfUrl = item.primary_location?.pdf_url || item.open_access?.oa_url || null;
    const verifiedUrl = item.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : item.id);

    return {
      paper_id: `openalex-${item.id ? item.id.split('/').pop() : idx + 1}`,
      title: item.display_name || item.title || 'Untitled Research',
      authors: normalizeAuthors(item.authorships),
      year: item.publication_year || 2024,
      doi: doi,
      abstract: abstract,
      source: 'OpenAlex',
      source_database: 'OpenAlex',
      verified_source_url: verifiedUrl,
      open_access_status: oaStatus,
      full_text_status: pdfUrl ? 'available' : (isOpenAccess ? 'open_landing' : 'restricted'),
      pdf_url: pdfUrl,
      citation_count: item.cited_by_count || 0,
      venue: item.primary_location?.source?.display_name || 'Academic Venue',
      keywords: (item.concepts || []).slice(0, 5).map(c => c.display_name)
    };
  });
  return papers;
}

async function searchArxivServer(query, limit = 15) {
  const cleanQ = query.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).slice(0, 5).join(' AND ');
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(cleanQ || query)}&start=0&max_results=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ResearchScholarAI/2.0 (academic search engine; mailto:scholar@researchscholar.ai)' },
    signal: AbortSignal.timeout(6500)
  });
  if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
  const xml = await res.text();
  const papers = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const doiMatch = entry.match(/<arxiv:doi[^>]*>(.*?)<\/arxiv:doi>/i);

    const authors = [];
    const authRegex = /<author>\s*<name>(.*?)<\/name>\s*<\/author>/gi;
    let aMatch;
    while ((aMatch = authRegex.exec(entry)) !== null) {
      authors.push(aMatch[1].trim());
    }

    const pdfMatch = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/i) ||
                     entry.match(/<link[^>]*href="([^"]+)"[^>]*type="application\/pdf"/i);

    const arxivUrl = idMatch ? idMatch[1].trim() : '';
    const arxivId = arxivUrl.split('/abs/').pop() || `arxiv-${papers.length + 1}`;
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'arXiv Research Paper';
    const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
    const year = publishedMatch ? parseInt(publishedMatch[1].substring(0, 4), 10) : 2024;
    const pdfUrl = pdfMatch ? pdfMatch[1] : (arxivUrl ? arxivUrl.replace('/abs/', '/pdf/') + '.pdf' : null);

    papers.push({
      paper_id: `arxiv-${arxivId.replace(/[^\w.-]/g, '_')}`,
      title: title,
      authors: authors.length > 0 ? authors : ['arXiv Contributor'],
      year: isNaN(year) ? 2024 : year,
      doi: doiMatch ? doiMatch[1].trim() : null,
      abstract: abstract,
      source: 'arXiv',
      source_database: 'arXiv',
      verified_source_url: arxivUrl || `https://arxiv.org/abs/${arxivId}`,
      open_access_status: 'green',
      full_text_status: 'available',
      pdf_url: pdfUrl,
      citation_count: 0,
      venue: 'arXiv Preprint Server (Open Access)',
      keywords: ['Preprint', 'Open Science']
    });
  }
  return papers;
}

async function searchCrossrefServer(query, limit = 15) {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&mailto=scholar@researchscholar.ai`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ResearchScholarAI/2.0 (mailto:scholar@researchscholar.ai)' },
    signal: AbortSignal.timeout(6500)
  });
  if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
  const data = await res.json();
  const items = data.message?.items || [];
  const papers = items.map((item, idx) => {
    const title = Array.isArray(item.title) ? item.title[0] : (item.title || 'Crossref Publication');
    const authors = normalizeAuthors(item.author);
    const year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || 2024;
    const doi = item.DOI || null;
    const venue = Array.isArray(item['container-title']) ? item['container-title'][0] : (item['container-title'] || 'Peer Reviewed Publication');
    const abstract = (item.abstract || '').replace(/<[^>]+>/g, '').trim();

    return {
      paper_id: `cr-${doi ? doi.replace(/[^\w.-]/g, '_') : idx + 1}`,
      title: title,
      authors: authors,
      year: typeof year === 'number' ? year : 2024,
      doi: doi,
      abstract: abstract || `Indexed publication via Crossref registry, published in ${venue}.`,
      source: 'Crossref',
      source_database: 'Crossref',
      verified_source_url: item.URL || (doi ? `https://doi.org/${doi}` : 'https://crossref.org'),
      open_access_status: 'hybrid',
      full_text_status: 'restricted',
      pdf_url: null,
      citation_count: item['is-referenced-by-count'] || 0,
      venue: venue,
      keywords: item.subject || []
    };
  });
  return papers;
}

async function searchSemanticScholarServer(query, limit = 15) {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=paperId,title,abstract,authors,year,citationCount,openAccessPdf,externalIds,url,venue`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ResearchScholarAI/2.0 (academic search engine)' },
    signal: AbortSignal.timeout(6000)
  });
  if (res.status === 429) {
    const err = new Error('Semantic Scholar API rate limit reached (HTTP 429)');
    err.code = 'RATE_LIMITED';
    throw err;
  }
  if (!res.ok) throw new Error(`Semantic Scholar HTTP ${res.status}`);
  const data = await res.json();
  const papers = (data.data || []).map((item, idx) => {
    const doi = item.externalIds?.DOI || null;
    const pdfUrl = item.openAccessPdf?.url || null;
    const authors = normalizeAuthors(item.authors);

    return {
      paper_id: `s2-${item.paperId ? item.paperId.substring(0, 12) : idx + 1}`,
      title: item.title || 'Untitled Scholar Paper',
      authors: authors,
      year: item.year || 2024,
      doi: doi,
      abstract: item.abstract || 'Abstract indexed in Semantic Scholar database.',
      source: 'Semantic Scholar',
      source_database: 'Semantic Scholar',
      verified_source_url: item.url || (doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${item.paperId}`),
      open_access_status: pdfUrl ? 'gold' : 'hybrid',
      full_text_status: pdfUrl ? 'available' : 'restricted',
      pdf_url: pdfUrl,
      citation_count: item.citationCount || 0,
      venue: item.venue || 'Academic Venue',
      keywords: []
    };
  });
  return papers;
}

async function searchIeeeServer(query, limit = 15, apiKey = null) {
  if (!apiKey) {
    const err = new Error('IEEE Xplore requires institutional API key authorization.');
    err.code = 'AUTHORIZED_ACCESS_REQUIRED';
    throw err;
  }
  const url = `https://ieeexploreapi.ieee.org/api/v1/search/articles?querytext=${encodeURIComponent(query)}&max_records=${limit}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`IEEE Xplore HTTP ${res.status}`);
  const data = await res.json();
  const papers = (data.articles || []).map((art, idx) => ({
    paper_id: `ieee-${art.article_number || idx + 1}`,
    title: art.title || 'IEEE Conference/Journal Article',
    authors: (art.authors?.authors || []).map(a => a.full_name || 'IEEE Author'),
    year: parseInt(art.publication_year, 10) || 2024,
    doi: art.doi || null,
    abstract: art.abstract || 'IEEE indexed research paper.',
    source: 'IEEE Xplore',
    source_database: 'IEEE Xplore',
    verified_source_url: art.html_url || (art.doi ? `https://doi.org/${art.doi}` : 'https://ieeexplore.ieee.org'),
    open_access_status: art.access_type === 'OPEN_ACCESS' ? 'gold' : 'closed',
    full_text_status: art.access_type === 'OPEN_ACCESS' ? 'available' : 'restricted',
    pdf_url: art.pdf_url || null,
    citation_count: art.citing_paper_count || 0,
    venue: art.publication_title || 'IEEE Transactions',
    keywords: art.index_terms?.ieee_terms?.terms || []
  }));
  return papers;
}

/**
 * Federated Academic Search Endpoint (CORS-Free, Live Scholarly Registries)
 */
app.post('/api/academic/search', async (req, res) => {
  try {
    const {
      topic,
      question = '',
      domain = '',
      keywords = [],
      yearRange = [2015, 2026],
      preferredSources = ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref'],
      papersRequired = 15,
      inclusionTerms = [],
      exclusionTerms = [],
      ieeeApiKey = null
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Search topic is required' });
    }

    const startTime = Date.now();
    const searchTimestamp = new Date().toISOString();

    // 1. Query Expansion
    const expansion = expandSearchTerms(topic, question, domain, keywords);

    // 2. Query Academic Sources Concurrently
    const sourcePromises = [];
    const sourceOrder = [];

    if (preferredSources.includes('OpenAlex')) {
      sourceOrder.push('OpenAlex');
      sourcePromises.push(
        searchOpenAlexServer(topic, Math.max(15, Math.ceil(papersRequired * 1.5)))
          .then(papers => ({ source: 'OpenAlex', status: 'success', papers }))
          .catch(err => ({ source: 'OpenAlex', status: 'error', error: err.message, papers: [] }))
      );
    }

    if (preferredSources.includes('arXiv')) {
      sourceOrder.push('arXiv');
      sourcePromises.push(
        searchArxivServer(topic, Math.max(15, Math.ceil(papersRequired * 1.5)))
          .then(papers => ({ source: 'arXiv', status: 'success', papers }))
          .catch(err => ({ source: 'arXiv', status: 'error', error: err.message, papers: [] }))
      );
    }

    if (preferredSources.includes('Crossref')) {
      sourceOrder.push('Crossref');
      sourcePromises.push(
        searchCrossrefServer(topic, Math.max(15, Math.ceil(papersRequired * 1.5)))
          .then(papers => ({ source: 'Crossref', status: 'success', papers }))
          .catch(err => ({ source: 'Crossref', status: 'error', error: err.message, papers: [] }))
      );
    }

    if (preferredSources.includes('Semantic Scholar')) {
      sourceOrder.push('Semantic Scholar');
      sourcePromises.push(
        searchSemanticScholarServer(topic, Math.max(15, Math.ceil(papersRequired * 1.5)))
          .then(papers => ({ source: 'Semantic Scholar', status: 'success', papers }))
          .catch(err => ({
            source: 'Semantic Scholar',
            status: err.code === 'RATE_LIMITED' ? 'rate_limited' : 'error',
            message: err.message,
            papers: []
          }))
      );
    }

    if (preferredSources.includes('IEEE Xplore')) {
      sourceOrder.push('IEEE Xplore');
      sourcePromises.push(
        searchIeeeServer(topic, papersRequired, ieeeApiKey)
          .then(papers => ({ source: 'IEEE Xplore', status: 'success', papers }))
          .catch(err => ({
            source: 'IEEE Xplore',
            status: err.code === 'AUTHORIZED_ACCESS_REQUIRED' ? 'authorized_access_required' : 'error',
            message: err.message,
            papers: []
          }))
      );
    }

    const settled = await Promise.allSettled(sourcePromises);
    const rawPapers = [];
    const sourceAttribution = {};
    const sourcesSucceeded = [];

    settled.forEach(item => {
      if (item.status === 'fulfilled' && item.value) {
        const { source, status, papers = [], error, message } = item.value;
        sourceAttribution[source] = {
          status,
          count: papers.length,
          message: message || error || null
        };
        if (status === 'success') {
          sourcesSucceeded.push(source);
          rawPapers.push(...papers);
        }
      }
    });

    const totalRetrieved = rawPapers.length;

    // 3. Deduplicate Genuine Papers
    const deduplicated = deduplicatePapers(rawPapers);
    const deduplicatedCount = deduplicated.length;

    // 4. Apply Filters (Year, Inclusion, Exclusion)
    const filtered = filterPapers(deduplicated, {
      yearRange,
      inclusionTerms,
      exclusionTerms
    });

    // 5. Semantic BM25 + Trained Pairwise LTR Scoring & Relevance Explanation
    const corpusStats = computeSearchCorpusStats(filtered);
    const scoredPapers = filtered.map(paper => {
      const score = calculateRelevanceScore(paper, {
        topic,
        question,
        keywords: expansion.generatedKeywords
      }, corpusStats);
      const explanation = generateRelevanceExplanation({ ...paper, relevance_score: score }, {
        topic,
        question
      });
      return {
        ...paper,
        relevance_score: score,
        relevance_explanation: explanation
      };
    });

    // 6. Rank by Relevance descending
    scoredPapers.sort((a, b) => b.relevance_score - a.relevance_score);

    // 7. Select top N papers and assign clean stable IDs
    const topPapers = scoredPapers.slice(0, papersRequired);
    const finalizedPapers = topPapers.map((p, idx) => ({
      ...p,
      url: p.url || p.verified_source_url || (p.doi ? `https://doi.org/${p.doi}` : null),
      verified_source_url: p.verified_source_url || p.url || (p.doi ? `https://doi.org/${p.doi}` : 'https://openalex.org'),
      paper_id: `rs-paper-${String(idx + 1).padStart(3, '0')}`
    }));

    const searchDurationMs = Date.now() - startTime;

    // 8. Construct validated Output 1 structure
    const output1 = buildModule2Output({
      topic,
      question,
      domain: domain || expansion.classifiedDomain,
      papers: finalizedPapers,
      queryExpansion: expansion,
      sourcesQueried: sourceOrder,
      filtersApplied: {
        year_range: yearRange,
        preferred_sources: preferredSources,
        inclusion_terms: inclusionTerms,
        exclusion_terms: exclusionTerms,
        papers_requested: papersRequired
      }
    });

    // Augment Output 1 metadata with verified source attribution
    output1.search_metadata.sources_succeeded = sourcesSucceeded;
    output1.search_metadata.source_attribution = sourceAttribution;
    output1.search_metadata.execution_time_ms = searchDurationMs;
    output1.search_metadata.retrieval_status = finalizedPapers.length > 0
      ? 'success'
      : (sourcesSucceeded.length > 0 ? 'empty_matches' : 'all_sources_failed');

    res.json({
      success: true,
      output1,
      papers: finalizedPapers,
      expansion,
      stats: {
        totalRetrieved,
        deduplicatedCount,
        filteredCount: finalizedPapers.length,
        searchDurationMs,
        searchTimestamp,
        sourceAttribution,
        sourcesSucceeded,
        usedVerifiedFallback: false
      }
    });

  } catch (err) {
    console.error('Academic search server error:', err);
    res.status(500).json({ error: 'Academic search failed', details: err.message });
  }
});

/**
 * Health check & In-House Research Intelligence service status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ResearchScholar AI – In-House Scholarly Intelligence Engine',
    module: 'Discovery, Analysis & Gap Identification API',
    version: '3.1.0',
    capabilities: {
      in_house_ml_engine: 'active',
      external_generative_ai: 'none',
      pdf_parser: 'active',
      section_extractor: 'active',
      evidence_grounding: 'active',
      output1_builder: 'v1.0.0',
      output2_builder: 'v2.0.0',
      output3_builder: 'v3.0.0'
    }
  });
});

/**
 * In-House Trained Models Status & Evaluation Summary
 */
app.get('/api/models/status', (req, res) => {
  try {
    res.json({
      success: true,
      ...getTrainedModelsSummary()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * In-House NLP Classification Endpoint (Domain Classification + Sentence Role Inference)
 */
app.post('/api/models/classify', (req, res) => {
  try {
    const { text = '', sentences = [] } = req.body || {};
    const domainPrediction = text ? getDomainClassifier().predict(text) : null;
    const roleClassifier = getSentenceRoleClassifier();
    const sentencePredictions = Array.isArray(sentences)
      ? sentences.map(s => ({ text: s, ...roleClassifier.predict(s) }))
      : [];

    res.json({
      success: true,
      engine: 'In-House Statistical NLP (TF-IDF Softmax)',
      domainPrediction,
      sentencePredictions
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Sample Output 1 Endpoint (for 1-click test without copying from Module 1)
 */
app.get('/api/analysis/sample-output1', (req, res) => {
  res.json(SAMPLE_OUTPUT_1);
});

/**
 * Validate imported Output 1 payload
 */
app.post('/api/analysis/validate-output1', (req, res) => {
  try {
    const payload = req.body;
    const validation = validateOutput1Payload(payload);
    res.json(validation);
  } catch (err) {
    res.status(400).json({ valid: false, errors: [err.message] });
  }
});

/**
 * Extracts real per-page text from a PDF buffer using pdf-parse v2 PDFParse.
 * Detects scanned/image-only PDFs and malformed/encrypted streams honestly.
 */
async function extractPdfFromBuffer(buffer, filename = 'paper.pdf') {
  if (!buffer || buffer.length < 5) {
    return {
      success: false,
      extractionStatus: 'extraction_failed',
      isScanned: false,
      error: 'Empty or corrupted file buffer.',
      pageCount: 0,
      pages: [],
      fullText: '',
      sections: []
    };
  }

  const header = buffer.subarray(0, 5).toString('ascii');
  if (!header.startsWith('%PDF-')) {
    return {
      success: false,
      extractionStatus: 'extraction_failed',
      isScanned: false,
      error: 'Invalid file signature: Does not match standard PDF magic header (%PDF-).',
      pageCount: 0,
      pages: [],
      fullText: '',
      sections: []
    };
  }

  let parser = null;
  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const rawPages = Array.isArray(textResult?.pages) ? textResult.pages : [];
    const pages = rawPages
      .map((p, idx) => ({
        pageNumber: typeof p.num === 'number' ? p.num : idx + 1,
        text: String(p.text || '').replace(/\u0000/g, '').trim()
      }));

    const fullText = (textResult?.text || pages.map(p => p.text).join('\n\n')).replace(/\u0000/g, '').trim();
    const pageCount = textResult?.total || pages.length || 1;

    const alnumCount = fullText.replace(/[^a-zA-Z0-9]/g, '').length;
    const avgCharsPerPage = pageCount > 0 ? alnumCount / pageCount : alnumCount;

    // Scanned / image-only PDF check (no embedded selectable text layer)
    if (alnumCount < 80 || (pageCount >= 2 && avgCharsPerPage < 25)) {
      return {
        success: true,
        extractionStatus: 'scanned_pdf',
        isScanned: true,
        warning: `Scanned or image-only PDF detected (${pageCount} pages, ${alnumCount} readable characters). No embedded text layer is available; OCR is required for full-text analysis.`,
        pageCount,
        pages: [],
        fullText: '',
        sections: []
      };
    }

    const nonEmptyPages = pages.filter(p => p.text.length > 0);
    const sections = identifySectionHeadings(nonEmptyPages.length > 0 ? nonEmptyPages : fullText);

    return {
      success: true,
      extractionStatus: 'full_text',
      isScanned: false,
      warning: null,
      pageCount,
      pages: nonEmptyPages.length > 0 ? nonEmptyPages : [{ pageNumber: 1, text: fullText }],
      fullText,
      sections
    };
  } catch (parseErr) {
    return {
      success: false,
      extractionStatus: 'extraction_failed',
      isScanned: false,
      error: `PDF extraction failed for ${filename}: ${parseErr.message || 'Corrupted or encrypted PDF stream.'}`,
      pageCount: 0,
      pages: [],
      fullText: '',
      sections: []
    };
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      await parser.destroy().catch(() => {});
    }
  }
}

/**
 * Resolves and fetches legally accessible open-access PDFs (e.g., arXiv, OpenAlex OA URLs).
 * Verifies %PDF- header before parsing; never bypasses paywalls.
 */
async function fetchOpenAccessPdf(paper) {
  let candidateUrl = paper.pdf_url || null;
  const fallbackUrl = paper.verified_source_url || paper.source_url || paper.url || '';

  if (!candidateUrl && /arxiv\.org\/abs\//i.test(fallbackUrl)) {
    candidateUrl = fallbackUrl.replace(/\/abs\//i, '/pdf/') + '.pdf';
  } else if (candidateUrl && /arxiv\.org\/abs\//i.test(candidateUrl)) {
    candidateUrl = candidateUrl.replace(/\/abs\//i, '/pdf/') + '.pdf';
  }

  if (!candidateUrl || !/^https?:\/\//i.test(candidateUrl)) {
    return { retrieved: false, reason: 'No open-access PDF URL provided in metadata.' };
  }

  try {
    const res = await fetch(candidateUrl, {
      headers: {
        'User-Agent': 'ResearchScholarAI/2.0 (Academic Research Assistant; mailto:scholar@researchscholar.ai)',
        'Accept': 'application/pdf,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000)
    });

    if (!res.ok) {
      return { retrieved: false, reason: `Open-access PDF endpoint returned HTTP ${res.status}.` };
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > 25 * 1024 * 1024) {
      return { retrieved: false, reason: 'Open-access PDF exceeds 25MB automatic download limit.' };
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (!buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      return { retrieved: false, reason: 'Remote URL returned a publisher landing page/HTML instead of a raw PDF binary.' };
    }

    const parsed = await extractPdfFromBuffer(buffer, `${paper.paper_id || 'paper'}.pdf`);
    if (!parsed.success) {
      return { retrieved: false, extractionStatus: parsed.extractionStatus, reason: parsed.error };
    }
    if (parsed.isScanned) {
      return { retrieved: false, extractionStatus: 'scanned_pdf', reason: parsed.warning };
    }

    return {
      retrieved: true,
      extractionStatus: 'full_text',
      pageCount: parsed.pageCount,
      pages: parsed.pages,
      fullText: parsed.fullText,
      sections: parsed.sections,
      sourceUrl: candidateUrl
    };
  } catch (err) {
    return { retrieved: false, reason: `Automatic open-access PDF retrieval unavailable (${err.message}).` };
  }
}

/**
 * PDF Parse Endpoint: Validates %PDF- signature and extracts real page-by-page text & sections
 */
app.post('/api/pdf/parse', async (req, res) => {
  try {
    const { base64Data, filename = 'paper.pdf' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const parsed = await extractPdfFromBuffer(buffer, filename);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        extractionStatus: parsed.extractionStatus,
        error: parsed.error
      });
    }

    res.json({
      success: true,
      filename,
      filesize: buffer.length,
      extractionStatus: parsed.extractionStatus,
      isScanned: parsed.isScanned,
      warning: parsed.warning,
      pageCount: parsed.pageCount,
      sectionCount: parsed.sections.length,
      sections: parsed.sections,
      pages: parsed.pages,
      text: parsed.fullText,
      textSnippet: parsed.fullText.substring(0, 500)
    });
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Process Imported Papers (Grounded Full-Text + In-House SentenceRoleSoftmax NLP Pipeline)
 */
app.post('/api/analysis/process-papers', async (req, res) => {
  try {
    const { output1Payload, customInstructions = '', pdfUploads = {} } = req.body;

    const validation = validateOutput1Payload(output1Payload);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid Output 1 input', details: validation.errors });
    }

    const papers = validation.data.papers;
    const researchTopic = validation.data.research_topic;

    const analyses = await Promise.all(
      papers.map(async (rawPaper) => {
        const paper = { ...rawPaper };

        // 1. Apply user-uploaded PDF if present
        const uploadedPdf = pdfUploads[paper.paper_id];
        if (uploadedPdf) {
          if (uploadedPdf.extractionStatus === 'scanned_pdf' || uploadedPdf.isScanned) {
            paper.extraction_status = 'scanned_pdf';
            paper.retrieval_note = uploadedPdf.warning || 'Uploaded PDF appears scanned with no embedded text layer.';
          } else if (uploadedPdf.extractionStatus === 'extraction_failed') {
            paper.extraction_status = 'extraction_failed';
            paper.extraction_error = uploadedPdf.error || 'Uploaded PDF could not be parsed.';
          } else if (Array.isArray(uploadedPdf.pages) && uploadedPdf.pages.length > 0) {
            paper.pages = uploadedPdf.pages;
            paper.fullText = uploadedPdf.text || uploadedPdf.pages.map(p => p.text).join('\n\n');
            paper.document_status = 'full_text';
          } else if (uploadedPdf.text && uploadedPdf.text.length >= 300) {
            paper.fullText = uploadedPdf.text;
            paper.pages = [{ pageNumber: 1, text: uploadedPdf.text }];
            paper.document_status = 'full_text';
          }
        } else if (paper.pdf_url || /arxiv\.org/i.test(paper.verified_source_url || paper.url || '')) {
          // 2. Retrieve legally accessible open-access full-text PDF when available
          const oaPdf = await fetchOpenAccessPdf(paper);
          if (oaPdf.retrieved) {
            paper.pages = oaPdf.pages;
            paper.fullText = oaPdf.fullText;
            paper.document_status = 'full_text';
          } else {
            if (oaPdf.extractionStatus === 'scanned_pdf') {
              paper.extraction_status = 'scanned_pdf';
            }
            paper.retrieval_note = oaPdf.reason;
          }
        }

        // 3. Run in-house SentenceRoleSoftmax + zero-fabrication verbatim extraction
        const analysis = analyzePaperRecord(paper, customInstructions);
        const hasRealFullText = analysis.document_status === 'full_text' && Array.isArray(paper.pages) && paper.pages.length > 0;

        // 4. Chunking + Relevant-Context Retrieval metadata
        if (hasRealFullText) {
          const chunks = chunkDocumentWithPages(paper.pages, 1800, 200);
          const relevantChunks = retrieveRelevantChunks(
            chunks,
            `${researchTopic} ${customInstructions || ''}`,
            8
          );
          analysis.analysis_engine = 'In-House ResearchScholar NLP Engine (Chunk Retrieval + Softmax + Verbatim)';
          analysis.ai_interpretation = {
            is_ai_generated: false,
            model_type: 'In-House Statistical NLP & Grounded Retrieval',
            scope: analysis.analysis_scope_label,
            retrieval_context: `Extracted ${paper.pages.length} PDF pages (${chunks.length} chunks); indexed ${relevantChunks.length} highest-relevance chunks.`,
            note: `Structured claims extracted by our trained in-house SentenceRoleSoftmax model across ${paper.pages.length} parsed PDF pages with zero external generative AI.`
          };
        } else {
          analysis.analysis_engine = 'In-House ResearchScholar NLP Engine (Softmax + Verbatim)';
          analysis.ai_interpretation = {
            is_ai_generated: false,
            model_type: 'In-House Statistical NLP & Grounded Retrieval',
            scope: analysis.analysis_scope_label,
            retrieval_context: 'Abstract-only input (full-text PDF was unavailable).',
            note: 'Structured claims extracted by our trained in-house SentenceRoleSoftmax model from abstract metadata only; full-paper sections were unavailable.'
          };
        }

        return analysis;
      })
    );

    const synthesis = generateCrossPaperSynthesis(analyses, researchTopic);
    const output2 = buildModule3Output(validation.data, analyses, synthesis);

    res.json({
      success: true,
      project_id: validation.data.project_id,
      research_topic: validation.data.research_topic,
      paper_count: papers.length,
      analyses,
      synthesis,
      output2
    });
  } catch (err) {
    console.error('Paper processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Module 3: Research Gap Identification Endpoints
 */

// Get benchmark Sample Output 2
app.get('/api/gap/sample-output2', (req, res) => {
  res.json(SAMPLE_OUTPUT_2);
});

// Validate Output 2 JSON
app.post('/api/gap/validate-output2', (req, res) => {
  try {
    const payload = req.body;
    const validation = validateOutput2Payload(payload);
    res.json(validation);
  } catch (err) {
    res.status(400).json({ valid: false, errors: [err.message] });
  }
});

// Execute Agent 3 Research Gap Analysis Pipeline (In-House TF-IDF Clustering & Grounded Evidence Comparator)
app.post('/api/gap/analyze', async (req, res) => {
  try {
    const { output2Payload, preferences = {} } = req.body;

    const validation = validateOutput2Payload(output2Payload);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid Output 2 input', details: validation.errors });
    }

    const data = validation.data;
    const analyses = data.analyses || [];
    const researchTopic = data.research_topic || 'Academic Research Corpus';

    // 1. Normalize genuine observations (filters "Not reported")
    const normalized = normalizeObservations(analyses);

    // 2. Cluster real reported observations using in-house TF-IDF cosine clustering + theme taxonomy
    const clusters = clusterObservations(normalized, analyses);

    // 3. Detect genuine cross-paper contradictions & tensions
    const tensions = detectContradictionsAndTensions(analyses, normalized);

    // 4. Formulate evidence-grounded candidate gaps
    const gaps = formulateCandidateGaps(clusters, normalized, analyses, researchTopic, tensions);
    const analysisEngine = 'In-House Grounded Research-Gap Engine (TF-IDF + Evidence Comparator)';

    // 5. Build Final Comprehensive Report (Output 3 v3.0.0)
    const finalReport = buildFinalGapReport(data, gaps, clusters, tensions, normalized, preferences);
    finalReport.analysis_engine = analysisEngine;

    res.json({
      success: true,
      project_id: data.project_id,
      research_topic: researchTopic,
      analysis_engine: analysisEngine,
      corpus_coverage: validation.coverage,
      evidence_sufficiency: finalReport.evidence_sufficiency,
      clusters,
      tensions,
      candidate_gaps: gaps,
      final_report: finalReport
    });
  } catch (err) {
    console.error('Research gap analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mount Vite middleware in development
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});
app.use(vite.middlewares);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ResearchScholar AI] Server active on http://0.0.0.0:${PORT}`);
});
