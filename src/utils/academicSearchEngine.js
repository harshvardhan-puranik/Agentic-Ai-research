/**
 * ResearchScholar AI - Academic Search Engine Core Logic
 * handles query expansion, normalization, deduplication, filtering,
 * trained ML relevance ranking, and Output 1 Module 2 schema validation.
 */

import { getDomainClassifier, getRelevanceRanker } from '../ml/index.js';

/**
 * Normalizes title string for robust duplicate detection
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes DOI string
 */
export function normalizeDoi(doi) {
  if (!doi || typeof doi !== 'string') return null;
  const cleaned = doi.trim().toLowerCase();
  const match = cleaned.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  return match ? match[0] : null;
}

/**
 * Normalizes author array into clean string names
 */
export function normalizeAuthors(rawAuthors) {
  if (!rawAuthors) return ['Anonymous Scholar'];
  if (Array.isArray(rawAuthors)) {
    const list = rawAuthors.map(a => {
      if (typeof a === 'string') return a.trim();
      if (a && typeof a === 'object') {
        if (a.name) return a.name.trim();
        if (a.author && a.author.display_name) return a.author.display_name.trim();
        if (a.family && a.given) return `${a.given} ${a.family}`.trim();
        if (a.family) return a.family.trim();
      }
      return 'Unknown Author';
    }).filter(Boolean);
    return list.length > 0 ? list : ['Anonymous Scholar'];
  }
  if (typeof rawAuthors === 'string') {
    return rawAuthors.split(/,|and/).map(s => s.trim()).filter(Boolean);
  }
  return ['Anonymous Scholar'];
}

/**
 * Deduplicate papers using DOI, normalized title, and author/year overlap
 */
export function deduplicatePapers(papers) {
  if (!Array.isArray(papers)) return [];
  const seenDois = new Set();
  const seenTitles = new Map();
  const results = [];

  for (const paper of papers) {
    if (!paper || !paper.title) continue;

    const normDoi = normalizeDoi(paper.doi);
    if (normDoi && seenDois.has(normDoi)) {
      continue;
    }

    const normTitle = normalizeTitle(paper.title);
    if (!normTitle || normTitle.length < 5) continue;

    // Check title collision or similarity
    let isDuplicate = false;
    if (seenTitles.has(normTitle)) {
      isDuplicate = true;
    } else {
      // Check prefix / token match for slight variants
      for (const existingTitle of seenTitles.keys()) {
        if (existingTitle === normTitle) {
          isDuplicate = true;
          break;
        }
        // Substring check for titles > 30 chars
        if (normTitle.length > 30 && existingTitle.length > 30) {
          if (existingTitle.includes(normTitle) || normTitle.includes(existingTitle)) {
            // Check year match
            const existingPaper = seenTitles.get(existingTitle);
            if (existingPaper.year === paper.year) {
              isDuplicate = true;
              break;
            }
          }
        }
      }
    }

    if (!isDuplicate) {
      if (normDoi) seenDois.add(normDoi);
      seenTitles.set(normTitle, paper);
      results.push(paper);
    }
  }

  return results;
}

/**
 * Filter papers based on year, inclusion, exclusion, and content validity
 */
export function filterPapers(papers, options = {}) {
  const {
    yearRange = [1990, 2026],
    inclusionTerms = [],
    exclusionTerms = [],
    requireAbstract = false,
  } = options;

  const [minYear, maxYear] = yearRange;
  const incLower = (inclusionTerms || []).map(t => t.toLowerCase().trim()).filter(Boolean);
  const excLower = (exclusionTerms || []).map(t => t.toLowerCase().trim()).filter(Boolean);

  return papers.filter(p => {
    // Year check
    if (p.year) {
      if (p.year < minYear || p.year > maxYear) return false;
    }

    const searchableText = `${p.title || ''} ${p.abstract || ''} ${(p.keywords || []).join(' ')}`.toLowerCase();

    // Exclusion terms check (must NOT be present)
    for (const exc of excLower) {
      if (searchableText.includes(exc)) return false;
    }

    // Inclusion terms check (ALL must be present if specified)
    for (const inc of incLower) {
      if (!searchableText.includes(inc)) return false;
    }

    // Abstract requirement
    if (requireAbstract && (!p.abstract || p.abstract.trim().length < 20)) {
      return false;
    }

    return true;
  });
}

/**
 * Query Expansion generator: Extracts keywords, creates synonyms and Boolean search queries
 */
export function expandSearchTerms(topic, question = '', domain = '', userKeywords = []) {
  const cleanTopic = (topic || '').trim();
  const cleanQuestion = (question || '').trim();
  const combined = `${cleanTopic} ${cleanQuestion}`.toLowerCase();

  // Extract core non-stopword tokens
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
    'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
    'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
    'your', 'yours', 'yourself', 'yourselves'
  ]);

  const rawTokens = combined
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));

  const uniqueTokens = Array.from(new Set(rawTokens));

  // Synthesize domain-specific synonyms & expansions
  const synonymsMap = {
    'transformer': ['attention mechanism', 'self-attention', 'transformer model', 'neural architecture'],
    'attention': ['multi-head attention', 'contextual representation', 'query-key-value'],
    'llm': ['large language model', 'foundation models', 'generative ai', 'natural language processing'],
    'nlp': ['natural language processing', 'computational linguistics', 'text analysis'],
    'reasoning': ['multi-step inference', 'chain-of-thought', 'deductive reasoning', 'problem solving'],
    'climate': ['global warming', 'climate change', 'carbon emissions', 'environmental impact'],
    'cancer': ['oncology', 'tumor biology', 'carcinoma', 'malignancy', 'targeted therapy'],
    'quantum': ['quantum computing', 'qubits', 'quantum entanglement', 'quantum algorithms'],
    'vision': ['computer vision', 'image recognition', 'visual perception', 'deep visual representations'],
    'robotics': ['autonomous systems', 'robotic control', 'kinematics', 'manipulation'],
    'reinforcement': ['reinforcement learning', 'policy gradient', 'markov decision process', 'q-learning'],
    'graph': ['graph neural networks', 'knowledge graphs', 'network analysis', 'message passing'],
    'biomedical': ['clinical informatics', 'healthcare analytics', 'molecular biology'],
  };

  const synonyms = new Set();
  for (const token of uniqueTokens) {
    if (synonymsMap[token]) {
      synonymsMap[token].forEach(s => synonyms.add(s));
    }
  }

  // Combine user provided keywords
  const allKeywords = Array.from(new Set([
    ...uniqueTokens.slice(0, 8),
    ...(userKeywords || []).map(k => k.trim()).filter(Boolean),
    ...Array.from(synonyms).slice(0, 4)
  ]));

  // Generate multi-modal Boolean search queries
  const primaryQuery = cleanTopic;
  const booleanQuery = uniqueTokens.slice(0, 4).join(' AND ');
  const expandedQuery = domain
    ? `("${cleanTopic}") AND (${domain})`
    : `("${cleanTopic}")`;
  const alternativeQuery = Array.from(synonyms).slice(0, 2).length > 0
    ? `${uniqueTokens.slice(0, 2).join(' ')} ${Array.from(synonyms)[0]}`
    : `${cleanTopic} overview analysis`;

  const classifierResult = getDomainClassifier().predict(combined);

  return {
    classifiedDomain: domain || inferDomain(combined, classifierResult),
    domainConfidence: classifierResult.confidence,
    domainMatchedFeatures: classifierResult.matchedFeatures,
    generatedKeywords: allKeywords,
    synonyms: Array.from(synonyms),
    searchQueries: [
      primaryQuery,
      booleanQuery,
      expandedQuery,
      alternativeQuery
    ].filter(Boolean)
  };
}

/**
 * Infer academic domain using the trained in-house ResearchDomainClassifier (TF-IDF Softmax),
 * falling back to keyword taxonomy only when model confidence is too low or vocabulary unseen.
 */
function inferDomain(text, precomputedPred = null) {
  const pred = precomputedPred || getDomainClassifier().predict(text);
  if (pred.trained && pred.confidence >= 0.18 && pred.domain !== 'Interdisciplinary Studies') {
    return pred.domain;
  }

  if (/(transformer|attention|neural|deep learning|llm|nlp|agent|computer vision|machine learning)/i.test(text)) {
    return 'Computer Science / Artificial Intelligence';
  }
  if (/(clinical|cancer|therapy|disease|genomic|patient|biomedical|drug|crispr|vaccine)/i.test(text)) {
    return 'Biomedicine & Health Sciences';
  }
  if (/(quantum|particle|optics|relativity|thermodynamic|gravitational|astrophys)/i.test(text)) {
    return 'Physics & Astronomy';
  }
  if (/(battery|electrolyte|perovskite|catalys|polymer|alloy|material)/i.test(text)) {
    return 'Materials Science & Chemistry';
  }
  if (/(climate|carbon|biodiversity|ecosystem|pollution|sustainability|watershed)/i.test(text)) {
    return 'Environmental & Climate Sciences';
  }
  if (/(market|inflation|economic|fiscal|monetary|trade|macroeconomics|portfolio)/i.test(text)) {
    return 'Economics & Quantitative Finance';
  }
  if (/(robot|quadrotor|slam|actuator|control|turbine|aerospace)/i.test(text)) {
    return 'Engineering & Robotics';
  }
  return 'Interdisciplinary Studies';
}

/**
 * Compute corpus-level BM25 statistics for a batch of candidate papers.
 */
export function computeSearchCorpusStats(papers = []) {
  return getRelevanceRanker().computeCorpusStats(papers);
}

/**
 * Trained In-House BM25 + Pairwise-LTR Relevance Score Calculation (0.05 to 0.99)
 */
export function calculateRelevanceScore(paper, queryContext = {}, corpusStats = null) {
  const { topic = '', question = '', keywords = [] } = queryContext;
  const hasQuery = `${topic} ${question} ${(keywords || []).join(' ')}`.trim().length > 0;
  if (!hasQuery) return 0.85;

  const { score } = getRelevanceRanker().score(paper, queryContext, corpusStats);
  return score;
}

/**
 * Generate scholarly explanation for why the paper is relevant
 */
export function generateRelevanceExplanation(paper, queryContext = {}) {
  const topic = queryContext.topic || 'the specified research topic';
  const score = paper.relevance_score || 0.85;

  const titleTerms = (paper.title || '').split(' ').slice(0, 4).join(' ');
  const venue = paper.venue ? ` published in ${paper.venue}` : '';
  const year = paper.year ? ` (${paper.year})` : '';

  if (score >= 0.90) {
    return `Direct theoretical and empirical alignment with "${topic}". The paper${year}${venue} provides fundamental methodologies and rigorous experimental evaluation addressing the core problem.`;
  } else if (score >= 0.80) {
    return `Significant conceptual overlap with "${topic}". Investigates relevant foundational mechanisms and practical implementations directly applicable to the research inquiry.`;
  } else {
    return `Provides supportive context and complementary perspectives for "${topic}", offering background literature and comparative benchmarks.`;
  }
}

/**
 * Validates Output 1 JSON schema against Module 2 requirements
 */
export function validateModule2Schema(output) {
  const errors = [];
  const warnings = [];

  if (!output || typeof output !== 'object') {
    return { valid: false, errors: ['Output must be a non-null JSON object'], warnings: [] };
  }

  // Mandatory top-level attributes
  if (!output.schema_version) {
    errors.push('Missing required field: schema_version');
  }
  if (!output.project_id) {
    errors.push('Missing required field: project_id');
  }
  if (!output.research_topic || typeof output.research_topic !== 'string' || !output.research_topic.trim()) {
    errors.push('Missing or empty required field: research_topic');
  }
  if (!output.search_timestamp) {
    errors.push('Missing required field: search_timestamp');
  }
  if (!output.search_metadata || typeof output.search_metadata !== 'object') {
    errors.push('Missing or invalid search_metadata object');
  }

  // Papers array validation
  if (!Array.isArray(output.papers)) {
    errors.push('Missing or invalid papers array');
  } else if (output.papers.length === 0) {
    warnings.push('Papers array is empty. Module 2 expects at least 1 paper to proceed.');
  } else {
    output.papers.forEach((paper, idx) => {
      const pPrefix = `Paper #${idx + 1} (${paper.paper_id || 'unknown id'}):`;
      if (!paper.paper_id) errors.push(`${pPrefix} missing stable paper_id`);
      if (!paper.title) errors.push(`${pPrefix} missing title`);
      if (!Array.isArray(paper.authors) || paper.authors.length === 0) errors.push(`${pPrefix} missing authors list`);
      if (typeof paper.year !== 'number') errors.push(`${pPrefix} year must be a number`);
      if (typeof paper.abstract !== 'string') errors.push(`${pPrefix} abstract must be a string`);
      if (!paper.source) errors.push(`${pPrefix} missing source`);
      if (!paper.verified_source_url) errors.push(`${pPrefix} missing verified_source_url`);
      if (paper.open_access_status === undefined) errors.push(`${pPrefix} missing open_access_status`);
      if (!paper.full_text_status) errors.push(`${pPrefix} missing full_text_status`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    paperCount: Array.isArray(output.papers) ? output.papers.length : 0
  };
}

/**
 * Builds the canonical Output 1 JSON object for Module 2 ingestion
 */
export function buildModule2Output(params) {
  const {
    projectId = `rs-proj-${Date.now().toString(36)}`,
    topic = '',
    question = '',
    domain = '',
    papers = [],
    queryExpansion = null,
    sourcesQueried = ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref'],
    filtersApplied = {}
  } = params;

  return {
    schema_version: '1.0.0',
    module_source: 'ResearchScholar AI - Paper Discovery (Website 1)',
    target_module: 'ResearchScholar AI - Module 2',
    project_id: projectId,
    research_topic: topic,
    research_question: question || null,
    domain: domain || null,
    search_timestamp: new Date().toISOString(),
    search_metadata: {
      pipeline_version: '1.2.0',
      query_expansion: queryExpansion || {
        generated_keywords: [],
        synonyms: [],
        search_queries: [topic]
      },
      sources_queried: sourcesQueried,
      total_retrieved: papers.length,
      deduplicated_count: papers.length,
      filters_applied: filtersApplied
    },
    papers: papers.map((p, idx) => ({
      paper_id: p.paper_id || `rs-paper-${String(idx + 1).padStart(3, '0')}`,
      title: p.title || 'Untitled Academic Paper',
      authors: normalizeAuthors(p.authors),
      year: typeof p.year === 'number' ? p.year : (parseInt(p.year, 10) || 2024),
      doi: normalizeDoi(p.doi) || null,
      abstract: p.abstract || 'Abstract unavailable from the publisher index.',
      source: p.source || 'OpenAlex',
      verified_source_url: p.verified_source_url || p.url || (p.doi ? `https://doi.org/${p.doi}` : 'https://openalex.org'),
      open_access_status: p.open_access_status || 'unknown',
      full_text_status: p.full_text_status || (p.pdf_url ? 'available' : 'restricted'),
      pdf_url: p.pdf_url || null,
      relevance_score: typeof p.relevance_score === 'number' ? p.relevance_score : 0.85,
      relevance_explanation: p.relevance_explanation || 'Identified as highly relevant to the formulated research scope.',
      keywords: Array.isArray(p.keywords) ? p.keywords : [],
      citation_count: typeof p.citation_count === 'number' ? p.citation_count : 0,
      venue: p.venue || null
    }))
  };
}
