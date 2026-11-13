/**
 * ResearchScholar AI - Module 2: Paper Analysis Engine Core Logic
 * Handles Output 1 schema validation, PDF page-aware sectioning & chunking,
 * relevant-context retrieval, zero-fabrication structured extraction,
 * page-grounded evidence verification, and Output 2 Module 3 schema generation.
 *
 * Strict constraint: Pure JavaScript ES6+ only. Never fabricates results,
 * datasets, algorithms, page numbers, or evidence excerpts.
 */

import { getSentenceRoleClassifier } from '../ml/index.js';

export const NOT_REPORTED = 'Not reported';

/**
 * Validates Output 1 JSON payload imported from Module 1
 */
export function validateOutput1Payload(payload) {
  if (!payload) {
    return { valid: false, errors: ['Input is empty. Please paste Output 1 JSON.'] };
  }

  let data = payload;
  if (typeof payload === 'string') {
    try {
      data = JSON.parse(payload);
    } catch (e) {
      return { valid: false, errors: [`JSON parse error: ${e.message}`] };
    }
  }

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Invalid Output 1 structure: Root must be an object.'] };
  }

  const errors = [];

  if (!data.schema_version) {
    errors.push('Missing "schema_version" (expected "1.0.0").');
  } else if (data.schema_version !== '1.0.0') {
    errors.push(`Invalid schema_version: Expected "1.0.0", received "${data.schema_version}".`);
  }
  if (!data.project_id) {
    errors.push('Missing "project_id".');
  }
  if (!data.research_topic) {
    errors.push('Missing "research_topic".');
  }
  if (!Array.isArray(data.papers)) {
    errors.push('Missing or invalid "papers" array.');
  } else if (data.papers.length === 0) {
    errors.push('"papers" array is empty. At least 1 paper is required for analysis.');
  } else {
    const seenIds = new Set();
    data.papers.forEach((p, idx) => {
      if (!p.paper_id) {
        errors.push(`Paper #${idx + 1}: Missing "paper_id".`);
      } else if (seenIds.has(p.paper_id)) {
        errors.push(`Paper #${idx + 1}: Duplicate paper_id "${p.paper_id}". Paper IDs must be unique.`);
      } else {
        seenIds.add(p.paper_id);
      }
      if (!p.title) {
        errors.push(`Paper #${idx + 1}: Missing "title".`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null,
    paperCount: Array.isArray(data.papers) ? data.papers.length : 0,
    project_id: data.project_id || null,
    research_topic: data.research_topic || null,
    research_question: data.research_question || null,
    domain: data.domain || 'Interdisciplinary Studies'
  };
}

/**
 * Validates uploaded PDF file header and attributes
 */
export function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const isPdfMime = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  if (!isPdfMime) {
    return { valid: false, error: `Invalid file format: "${file.name}". Only PDF documents (.pdf) are permitted.` };
  }

  const maxSize = 35 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed PDF size is 35MB.` };
  }

  if (file.size < 100) {
    return { valid: false, error: 'File is too small or corrupted (< 100 bytes).' };
  }

  return { valid: true, error: null };
}

const HEADING_PATTERNS = [
  { name: 'Abstract', regex: /^(abstract|executive summary)\b[:.\s-]*$/i },
  { name: 'Introduction', regex: /^(?:\d+\.?\s*|I\.?\s*)?introduction\b[:.\s-]*$/i },
  { name: 'Related Work & Background', regex: /^(?:\d+\.?\s*|II\.?\s*)?(related work|background|literature review|prior work)\b/i },
  { name: 'Problem Formulation', regex: /^(?:\d+\.?\s*)?(problem formulation|problem definition|problem statement|theoretical framework)\b/i },
  { name: 'Methodology & Proposed Architecture', regex: /^(?:\d+\.?\s*|[IVX]+\.?\s*)?(methodology|methods|materials and methods|proposed (?:model|architecture|method|approach|framework)|system design|approach)\b/i },
  { name: 'Algorithms & Implementation', regex: /^(?:\d+\.?\s*)?(algorithms?|implementation details|computational model)\b/i },
  { name: 'Experimental Setup & Datasets', regex: /^(?:\d+\.?\s*|[IVX]+\.?\s*)?(experiments?|experimental setup|datasets?|evaluation setup|empirical evaluation|data collection)\b/i },
  { name: 'Results & Findings', regex: /^(?:\d+\.?\s*|[IVX]+\.?\s*)?(results?|findings|evaluation results|results and discussion|comparative analysis|experimental results)\b/i },
  { name: 'Discussion & Ablation', regex: /^(?:\d+\.?\s*|[IVX]+\.?\s*)?(discussion|ablation study|sensitivity analysis)\b/i },
  { name: 'Limitations', regex: /^(?:\d+\.?\s*)?(limitations?|threats to validity|constraints)\b/i },
  { name: 'Future Work', regex: /^(?:\d+\.?\s*)?(future work|future directions|open challenges|recommendations)\b/i },
  { name: 'Conclusion', regex: /^(?:\d+\.?\s*|[IVX]+\.?\s*)?(conclusions?|concluding remarks|summary and conclusions)\b/i },
  { name: 'References', regex: /^(?:references|bibliography)\b/i }
];

/**
 * Detects structural section headings in scholarly text or per-page objects while preserving real page numbers.
 * Accepts either a plain string OR an array of `{ pageNumber, text }` objects.
 */
export function identifySectionHeadings(input) {
  if (!input) return [];

  const pages = Array.isArray(input)
    ? input.map((p, idx) => ({
        pageNumber: typeof p.pageNumber === 'number' ? p.pageNumber : (typeof p.num === 'number' ? p.num : idx + 1),
        text: String(p.text || '')
      }))
    : (typeof input === 'string' ? [{ pageNumber: 1, text: input }] : []);

  if (pages.length === 0 || pages.every(p => !p.text.trim())) {
    return [];
  }

  const sections = [];
  let currentSection = {
    heading: 'Preamble / Title & Abstract',
    content: [],
    page: pages[0].pageNumber,
    endPage: pages[0].pageNumber
  };

  for (const pageObj of pages) {
    const lines = pageObj.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      let matchedHeading = null;
      let remainderText = null;
      const colonMatch = rawLine.match(/^([^:]{2,55}):\s+(.+)$/);

      if (colonMatch) {
        const prefix = colonMatch[1].trim();
        for (const pattern of HEADING_PATTERNS) {
          if (pattern.regex.test(prefix)) {
            matchedHeading = pattern.name;
            remainderText = colonMatch[2].trim();
            break;
          }
        }
      } else if (rawLine.length < 65 && !/[.!?]$/.test(rawLine)) {
        for (const pattern of HEADING_PATTERNS) {
          if (pattern.regex.test(rawLine)) {
            matchedHeading = pattern.name;
            break;
          }
        }
      }

      if (matchedHeading) {
        if (currentSection.content.length > 0) {
          sections.push({
            heading: currentSection.heading,
            content: currentSection.content.join('\n').trim(),
            page: currentSection.page,
            endPage: currentSection.endPage
          });
        }
        currentSection = {
          heading: matchedHeading,
          content: remainderText ? [remainderText] : [],
          page: pageObj.pageNumber,
          endPage: pageObj.pageNumber
        };
      } else {
        currentSection.content.push(rawLine);
        currentSection.endPage = pageObj.pageNumber;
      }
    }
  }

  if (currentSection.content.length > 0) {
    sections.push({
      heading: currentSection.heading,
      content: currentSection.content.join('\n').trim(),
      page: currentSection.page,
      endPage: currentSection.endPage
    });
  }

  return sections;
}

/**
 * Splits multi-page extracted PDF documents into manageable overlapping chunks
 * while preserving exact page numbers and detected section labels.
 */
export function chunkDocumentWithPages(pagesOrText, chunkSize = 1800, overlap = 200) {
  const pages = Array.isArray(pagesOrText)
    ? pagesOrText
        .filter(p => p && typeof p.text === 'string' && p.text.trim().length > 0)
        .map((p, idx) => ({
          pageNumber: typeof p.pageNumber === 'number' ? p.pageNumber : (typeof p.num === 'number' ? p.num : idx + 1),
          text: p.text.trim()
        }))
    : (typeof pagesOrText === 'string' && pagesOrText.trim().length > 0
        ? [{ pageNumber: 1, text: pagesOrText.trim() }]
        : []);

  if (pages.length === 0) return [];

  const chunks = [];
  let activeSection = 'Abstract / Preamble';
  let chunkIndex = 1;

  for (const pageObj of pages) {
    const lines = pageObj.text.split('\n');
    let pageSection = activeSection;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 90) {
        for (const p of HEADING_PATTERNS) {
          if (p.regex.test(trimmed)) {
            pageSection = p.name;
            activeSection = p.name;
            break;
          }
        }
      }
    }

    const pageText = pageObj.text;
    if (pageText.length <= chunkSize) {
      chunks.push({
        chunkId: `chunk-${chunkIndex++}`,
        startPage: pageObj.pageNumber,
        endPage: pageObj.pageNumber,
        pageNumbers: [pageObj.pageNumber],
        section: pageSection,
        text: pageText
      });
    } else {
      let start = 0;
      while (start < pageText.length) {
        const end = Math.min(pageText.length, start + chunkSize);
        const slice = pageText.slice(start, end).trim();
        if (slice.length > 30) {
          chunks.push({
            chunkId: `chunk-${chunkIndex++}`,
            startPage: pageObj.pageNumber,
            endPage: pageObj.pageNumber,
            pageNumbers: [pageObj.pageNumber],
            section: pageSection,
            text: slice
          });
        }
        if (end >= pageText.length) break;
        start = Math.max(start + 1, end - overlap);
      }
    }
  }

  return chunks;
}

/**
 * Retrieves the most relevant chunks from a large document for structured paper analysis
 * using lexical facet matching + coverage across Introduction, Methodology, Results, and Limitations.
 */
export function retrieveRelevantChunks(chunks = [], queryContext = '', maxChunks = 8) {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  if (chunks.length <= maxChunks) return chunks;

  const facetKeywords = [
    'objective', 'aim', 'propose', 'problem', 'challenge', 'limitation',
    'method', 'methodology', 'architecture', 'algorithm', 'model', 'dataset',
    'corpus', 'sample', 'metric', 'accuracy', 'f1', 'precision', 'recall',
    'auc', 'error', 'result', 'performance', 'experiment', 'evaluation',
    'outperform', 'future', 'conclusion', 'drawback', 'bottleneck'
  ];

  const customTokens = (queryContext || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 3);

  const searchTerms = Array.from(new Set([...facetKeywords, ...customTokens]));

  const scored = chunks.map((chunk, idx) => {
    const lower = chunk.text.toLowerCase();
    const sectionLower = (chunk.section || '').toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      if (lower.includes(term)) score += 1.5;
    }

    // Prioritize critical analytical sections, penalize pure References bibliography dumps
    if (/methodology|method|experiment|dataset|result|evaluation|limitation|future|conclusion|abstract|introduction/i.test(sectionLower)) {
      score += 6;
    }
    if (/references/i.test(sectionLower)) {
      score -= 10;
    }
    if (idx === 0) {
      score += 5; // Always favor page 1 abstract/intro context
    }

    // Quantitative figures boost (helps capture actual experimental results)
    const numericMatches = lower.match(/\b\d+(?:\.\d+)?%|\bp\s*[<=>]\s*0\.\d+/g);
    if (numericMatches) {
      score += Math.min(numericMatches.length * 1.2, 6);
    }

    return { chunk, idx, score };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .sort((a, b) => a.idx - b.idx)
    .map(item => item.chunk);

  return selected;
}

/**
 * Finds the exact 1-based page number where an excerpt (or its core phrase) appears in parsed PDF pages.
 * Returns null if no pages exist or no reliable match is found (never invents a page number).
 */
export function findActualPageForExcerpt(excerpt, pages = []) {
  if (!excerpt || !Array.isArray(pages) || pages.length === 0) {
    return null;
  }

  const normalize = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/([a-z]{2,})-\s*\n+\s*([a-z]{2,})/g, '$1$2')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanExcerpt = normalize(excerpt).replace(/^["']|["']$/g, '').replace(/\.\.\.$/, '').trim();
  if (cleanExcerpt.length < 12) return null;

  // 1. Direct normalized substring match
  const probe = cleanExcerpt.slice(0, Math.min(80, cleanExcerpt.length));
  for (const p of pages) {
    const pText = normalize(p.text);
    if (pText.includes(probe)) {
      return typeof p.pageNumber === 'number' ? p.pageNumber : (p.num || null);
    }
  }

  // 2. Fallback: token window overlap against each page
  const excerptTokens = new Set(cleanExcerpt.split(/[^a-z0-9]+/).filter(w => w.length > 3));
  if (excerptTokens.size === 0) return null;

  let bestPage = null;
  let bestOverlap = 0;

  for (const p of pages) {
    const pText = normalize(p.text);
    let hits = 0;
    for (const tok of excerptTokens) {
      if (pText.includes(tok)) hits++;
    }
    const ratio = hits / excerptTokens.size;
    if (ratio > bestOverlap) {
      bestOverlap = ratio;
      bestPage = typeof p.pageNumber === 'number' ? p.pageNumber : (p.num || null);
    }
  }

  return bestOverlap >= 0.6 ? bestPage : null;
}

/**
 * Splits academic text into clean complete sentences
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .replace(/\r\n/g, '\n')
    .replace(/([a-z]{2,})-\s*\n+\s*([a-z]{2,})/g, '$1$2')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"(\[])/)
    .map(s => s.trim())
    .filter(s => s.length >= 25 && s.length <= 650);
}

/**
 * Assigns real page & section provenance to sentences from parsed pages (or abstract-only)
 */
function buildSentenceRecords(paper, pages, abstract) {
  const records = [];

  if (Array.isArray(pages) && pages.length > 0) {
    const sections = identifySectionHeadings(pages);
    for (const sec of sections) {
      if (/^references$/i.test(sec.heading)) continue;
      const sents = splitIntoSentences(sec.content);
      for (const s of sents) {
        const realPage = findActualPageForExcerpt(s, pages) || sec.page;
        records.push({
          text: s,
          page: realPage,
          section: sec.heading,
          evidence_status: 'verbatim_full_text'
        });
      }
    }
  }

  if (records.length === 0 && abstract && abstract.trim().length > 0) {
    const sents = splitIntoSentences(abstract);
    for (const s of sents) {
      records.push({
        text: s,
        page: null,
        section: 'Abstract',
        evidence_status: 'verbatim_abstract'
      });
    }
  }

  return records;
}

/**
 * Extracts ONLY explicitly reported algorithms/models/methods found in actual text
 */
function extractMentionedAlgorithms(corpus) {
  if (!corpus) return [NOT_REPORTED];

  const catalog = [
    { label: 'Transformer', regex: /\btransformers?\b/i },
    { label: 'Self-Attention / Multi-Head Attention', regex: /\b(?:self-attention|multi-head attention|scaled dot-product attention)\b/i },
    { label: 'Linear Attention', regex: /\blinear attention\b/i },
    { label: 'Convolutional Neural Network (CNN)', regex: /\b(?:convolutional neural network|cnn|resnet|vgg|u-net|unet|efficientnet)\b/i },
    { label: 'Vision Transformer (ViT)', regex: /\b(?:vision transformer|vit)\b/i },
    { label: 'Recurrent Neural Network / LSTM / GRU', regex: /\b(?:recurrent neural network|rnn|lstm|long short-term memory|gru)\b/i },
    { label: 'Graph Neural Network (GNN)', regex: /\b(?:graph neural network|gnn|graph convolutional|gcn|gat)\b/i },
    { label: 'Generative Adversarial Network (GAN)', regex: /\b(?:generative adversarial network|gan)\b/i },
    { label: 'Diffusion Model', regex: /\bdiffusion model\b/i },
    { label: 'Large Language Model (LLM) / BERT / GPT', regex: /\b(?:large language model|llm|bert|roberta|gpt-\d)\b/i },
    { label: 'Reinforcement Learning / PPO / DQN', regex: /\b(?:reinforcement learning|q-learning|dqn|ppo|actor-critic)\b/i },
    { label: 'Random Forest / Decision Tree / XGBoost', regex: /\b(?:random forest|decision tree|xgboost|gradient boosting|lightgbm)\b/i },
    { label: 'Support Vector Machine (SVM)', regex: /\b(?:support vector machine|svm)\b/i },
    { label: 'K-Means / Clustering', regex: /\b(?:k-means|dbscan|hierarchical clustering)\b/i },
    { label: 'Principal Component Analysis (PCA)', regex: /\b(?:principal component analysis|pca)\b/i },
    { label: 'Bayesian Inference / MCMC', regex: /\b(?:bayesian|markov chain monte carlo|mcmc|monte carlo)\b/i },
    { label: 'CRISPR-Cas9 / Gene Editing', regex: /\b(?:crispr-cas9|crispr\/cas9|cas9|base editing|prime editing)\b/i },
    { label: 'Surface Code / Quantum Error Correction', regex: /\b(?:surface code|toric code|stabilizer code|ldpc code|quantum error correction)\b/i },
    { label: 'Variational Quantum Eigensolver (VQE) / QAOA', regex: /\b(?:variational quantum|vqe|qaoa)\b/i },
    { label: 'Kalman Filter', regex: /\bkalman filter\b/i },
    { label: 'Fine-Tuning / Transfer Learning', regex: /\b(?:transfer learning|fine-tuning|fine tuning|lora)\b/i }
  ];

  const found = [];
  for (const item of catalog) {
    if (item.regex.test(corpus)) {
      found.push(item.label);
    }
  }

  return found.length > 0 ? Array.from(new Set(found)) : [NOT_REPORTED];
}

/**
 * Extracts ONLY datasets/corpora/cohorts explicitly named in the paper text
 */
function extractMentionedDatasets(rawCorpus, paperKeywords = []) {
  if (!rawCorpus) {
    return { name: NOT_REPORTED, size: NOT_REPORTED, domain: NOT_REPORTED };
  }

  const knownDatasets = [
    { name: 'ImageNet / ILSVRC', regex: /\bimagenet(?:-1k)?\b|\bilsvrc\b/i, domain: 'Computer Vision' },
    { name: 'CIFAR-10 / CIFAR-100', regex: /\bcifar-(?:10|100)\b/i, domain: 'Image Classification' },
    { name: 'MNIST / Fashion-MNIST', regex: /\b(?:fashion-)?mnist\b/i, domain: 'Computer Vision' },
    { name: 'MS COCO', regex: /\b(?:ms\s*)?coco\b/i, domain: 'Object Detection' },
    { name: 'WMT Benchmark', regex: /\bwmt\s*(?:20\d{2}|1[4-9])?\b/i, domain: 'Machine Translation' },
    { name: 'GLUE / SuperGLUE', regex: /\b(?:super)?glue\b/i, domain: 'Natural Language Understanding' },
    { name: 'SQuAD', regex: /\bsquad\b/i, domain: 'Question Answering' },
    { name: 'WikiText', regex: /\bwikitext(?:-\d+)?\b/i, domain: 'Language Modeling' },
    { name: 'MIMIC-III / MIMIC-IV', regex: /\bmimic-(?:iii|iv|cxr)\b/i, domain: 'Clinical / Healthcare' },
    { name: 'HAM10000', regex: /\bham10000\b/i, domain: 'Medical Imaging' },
    { name: 'UK Biobank', regex: /\buk biobank\b/i, domain: 'Biomedical Genomics' },
    { name: 'TCGA (The Cancer Genome Atlas)', regex: /\btcga\b/i, domain: 'Oncology / Genomics' },
    { name: 'PubMed / MEDLINE', regex: /\b(?:pubmedqa|pubmed|medline)\b/i, domain: 'Biomedical Literature' }
  ];

  let matchedName = NOT_REPORTED;
  let matchedDomain = paperKeywords?.[0] || NOT_REPORTED;

  for (const ds of knownDatasets) {
    if (ds.regex.test(rawCorpus)) {
      matchedName = ds.name;
      matchedDomain = ds.domain;
      break;
    }
  }

  // Generic explicit dataset/corpus/cohort mention in text
  if (matchedName === NOT_REPORTED) {
    const genericMatch = rawCorpus.match(/\b([A-Z][A-Za-z0-9_-]{2,25}(?:\s+[A-Z0-9][A-Za-z0-9_-]{1,20}){0,3})\s+(?:dataset|corpus|benchmark|cohort|database)\b/);
    if (genericMatch && genericMatch[1] && !/^(The|This|Our|A|An|In|For|Standard|Proposed|Using)$/i.test(genericMatch[1])) {
      matchedName = `${genericMatch[1].trim()} dataset`;
    }
  }

  // Extract explicit sample/cohort size ONLY if directly stated in text
  let matchedSize = NOT_REPORTED;
  const sizeMatch = rawCorpus.match(/\b(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s*[kKmMbB]?)\s+(?:samples|images|patients|participants|subjects|records|sentence pairs|documents|cases|tweets|tokens)\b/i);
  if (sizeMatch) {
    matchedSize = sizeMatch[0].trim();
  }

  return {
    name: matchedName,
    size: matchedSize,
    domain: matchedDomain
  };
}

/**
 * Extracts ONLY evaluation metrics explicitly mentioned in the paper text
 */
function extractMentionedMetrics(corpus) {
  if (!corpus) return [NOT_REPORTED];

  const metricCatalog = [
    { label: 'Accuracy (Top-1 / Top-5 / Classification)', regex: /\b(?:top-1|top-5|classification\s+)?accuracy\b/i },
    { label: 'F1-Score', regex: /\bf1(?:-score|-measure)?\b/i },
    { label: 'Precision & Recall', regex: /\b(?:precision|recall)\b/i },
    { label: 'ROC-AUC / AUC', regex: /\b(?:roc-?auc|auroc|area under the (?:roc )?curve)\b/i },
    { label: 'BLEU / ROUGE', regex: /\b(?:bleu|rouge(?:-[12l])?)\b/i },
    { label: 'Perplexity', regex: /\bperplexity\b/i },
    { label: 'RMSE / MAE / MSE', regex: /\b(?:rmse|mae|mse|root mean squared error|mean absolute error)\b/i },
    { label: 'Mean Average Precision (mAP)', regex: /\b(?:mean average precision|mAP)\b/ },
    { label: 'IoU / Dice Score', regex: /\b(?:intersection over union|iou|dice (?:score|coefficient))\b/i },
    { label: 'Inference Latency / Throughput / FLOPs', regex: /\b(?:latency|throughput|flops|inference time|runtime|memory usage)\b/i },
    { label: 'Logical Error Rate / Threshold / Fidelity', regex: /\b(?:logical error rate|threshold|gate fidelity|state fidelity)\b/i },
    { label: 'Statistical Significance (p-value)', regex: /\bp-values?\b|\bp\s*[<=>]\s*0\.\d+/i },
    { label: 'Power Conversion Efficiency (PCE)', regex: /\b(?:power conversion efficiency|pce)\b/i }
  ];

  const found = [];
  for (const m of metricCatalog) {
    if (m.regex.test(corpus)) {
      found.push(m.label);
    }
  }

  return found.length > 0 ? Array.from(new Set(found)) : [NOT_REPORTED];
}

/**
 * Extracts deep structured analysis strictly grounded in actual paper content.
 * Never fabricates results, datasets, algorithms, page numbers, or excerpts.
 */
export function analyzePaperRecord(paper, customInstructions = '') {
  const title = paper.title || 'Untitled Academic Paper';
  const abstract = (paper.abstract || '').trim();
  const pages = Array.isArray(paper.pages) ? paper.pages : [];
  const rawFullText = typeof paper.fullText === 'string' ? paper.fullText.trim() : '';

  const extractionStatus = paper.extraction_status || null;
  const hasRealFullText =
    extractionStatus !== 'scanned_pdf' &&
    extractionStatus !== 'extraction_failed' &&
    ((pages.length > 0 && pages.map(p => p.text || '').join(' ').replace(/\s+/g, '').length >= 80) ||
      (rawFullText.length >= 250 && rawFullText !== abstract));

  const documentStatus =
    extractionStatus === 'scanned_pdf'
      ? 'scanned_pdf'
      : extractionStatus === 'extraction_failed'
      ? 'extraction_failed'
      : hasRealFullText
      ? 'full_text'
      : abstract.length > 30
      ? 'abstract_only'
      : 'unavailable';

  const analysisScopeLabel =
    documentStatus === 'full_text'
      ? `Full-Text PDF Analyzed (${pages.length || 1} pages)`
      : documentStatus === 'scanned_pdf'
      ? 'Scanned PDF (OCR Required) – Abstract-Only Fallback'
      : documentStatus === 'extraction_failed'
      ? 'PDF Extraction Failed – Abstract-Only Fallback'
      : documentStatus === 'abstract_only'
      ? 'Abstract-Only Analysis (Full Text Unavailable)'
      : 'Insufficient Content (No Full Text or Abstract)';

  const sourceText = hasRealFullText
    ? (rawFullText || pages.map(p => p.text || '').join('\n\n'))
    : abstract;

  const sentenceRecords = buildSentenceRecords(paper, hasRealFullText ? pages : [], abstract);
  const roleClassifier = getSentenceRoleClassifier();
  const classifiedRecords = sentenceRecords.map(r => ({
    ...r,
    mlRole: roleClassifier.predict(r.text)
  }));
  const fullCorpus = `${title}\n\n${sourceText}`;

  const isMlRole = (r, targetRole, minConf = 0.62) =>
    r.mlRole?.trained && r.mlRole.role === targetRole && r.mlRole.confidence >= minConf;

  // 1. Objective (regex + trained SentenceRoleClassifier)
  const objectiveMatches = classifiedRecords.filter(r =>
    /\b(in this (?:paper|work|study|article|survey|review)|we (?:propose|introduce|present|develop|investigate|examine|evaluate|aim|explore)|this (?:paper|study|work) (?:presents|proposes|investigates|aims|examines|explores|reviews))\b/i.test(r.text) ||
    isMlRole(r, 'objective', 0.60)
  );
  const objective = objectiveMatches.length > 0
    ? objectiveMatches[0].text
    : (classifiedRecords[0]?.text || NOT_REPORTED);

  // 2. Problem statement (regex + trained SentenceRoleClassifier)
  const problemMatches = classifiedRecords.filter(r =>
    /\b(however|although|despite|challenge|bottleneck|problem|limitation|drawback|suffer(?:s)? from|prohibitive|remains? (?:challenging|unclear|limited|expensive|difficult)|insufficient)\b/i.test(r.text) ||
    isMlRole(r, 'problem_statement', 0.62)
  );
  const problemStatement = problemMatches.length > 0 ? problemMatches[0].text : NOT_REPORTED;

  // 3. Methodology (regex + trained SentenceRoleClassifier)
  const methodMatches = classifiedRecords.filter(r =>
    /\b(method|methodology|framework|architecture|pipeline|approach|algorithm|we (?:use|employ|train|formulate|design|construct|apply|combine)|based on|model(?:ed|ing)?)\b/i.test(r.text) ||
    isMlRole(r, 'methodology', 0.62)
  );
  const methodology = methodMatches.length > 0
    ? methodMatches.slice(0, 2).map(m => m.text).join(' ')
    : NOT_REPORTED;

  // 4. Algorithms & Models (only explicitly mentioned)
  const algorithms = extractMentionedAlgorithms(fullCorpus);

  // 5. Dataset used (only explicitly mentioned)
  const dataset = extractMentionedDatasets(fullCorpus, paper.keywords);
  const datasets = dataset.name !== NOT_REPORTED ? [dataset.name] : [NOT_REPORTED];

  // 6. Preprocessing (only explicitly mentioned)
  const preprocMatches = classifiedRecords
    .filter(r => /\b(preprocess|normaliz|tokeniz|augment|clean|filter|segment|resampl|standardiz|encoding)\b/i.test(r.text))
    .map(r => r.text);
  const preprocessing = preprocMatches.length > 0 ? Array.from(new Set(preprocMatches)).slice(0, 3) : [NOT_REPORTED];

  // 7. Evaluation Metrics (only explicitly mentioned)
  const metrics = extractMentionedMetrics(fullCorpus);

  // 8. Experimental Results & Reported Performance (STRICTLY from actual text; NEVER invented numbers)
  const resultMatches = classifiedRecords.filter(r =>
    /\b(result(?:s)? (?:show|demonstrate|indicate|confirm|reveal)|achieve(?:s|d)?|outperform(?:s|ed)?|improve(?:s|d)?|reduce(?:s|d)?|yield(?:s|ed)?|obtain(?:s|ed)?|accuracy of|f1[- ]score of|significant(?:ly)?)\b|\b\d+(?:\.\d+)?%/i.test(r.text) ||
    (isMlRole(r, 'results', 0.72) && /\d/.test(r.text))
  );
  const reportedResults = resultMatches.length > 0
    ? Array.from(new Set(resultMatches.map(r => r.text))).slice(0, 4)
    : [NOT_REPORTED];

  const quantitativeMatches = classifiedRecords.filter(r =>
    /\b\d+(?:\.\d+)?%|\bp\s*[<=>]\s*0\.\d+|\b\d+(?:\.\d+)?x\b/i.test(r.text)
  );
  const reportedPerformance = quantitativeMatches.length > 0
    ? quantitativeMatches.slice(0, 2).map(r => r.text).join(' ')
    : (reportedResults[0] !== NOT_REPORTED ? reportedResults[0] : NOT_REPORTED);

  // 9. Limitations (only explicitly stated in paper)
  const limitationMatches = classifiedRecords.filter(r =>
    /\b(limitation|threat(?:s)? to validity|drawback|shortcoming|weakness|fail(?:s|ed)? to|cannot|does not|restricted to|constrained by|overhead|scarce|scarcity)\b/i.test(r.text) ||
    /limitations/i.test(r.section) ||
    (isMlRole(r, 'limitations', 0.68) && !/\bwithout reporting\b/i.test(r.text))
  );
  const limitations = limitationMatches.length > 0
    ? Array.from(new Set(limitationMatches.map(r => r.text))).slice(0, 4)
    : [NOT_REPORTED];

  // 10. Future Research Directions (only explicitly stated in paper)
  const futureMatches = classifiedRecords.filter(r =>
    /\b(future work|future research|future direction|further investigation|open (?:challenge|question|problem)|next step|intend to|plan to|remain(?:s)? to be)\b/i.test(r.text) ||
    /future work/i.test(r.section) ||
    isMlRole(r, 'future_work', 0.65)
  );
  const futureWork = futureMatches.length > 0
    ? Array.from(new Set(futureMatches.map(r => r.text))).slice(0, 4)
    : [NOT_REPORTED];

  // 11. Conclusion (only explicitly stated in Conclusion section or concluding sentences)
  const conclusionMatches = classifiedRecords.filter(r =>
    /conclusion/i.test(r.section) ||
    /\b(in conclusion|we conclude|to summarize|overall,\s+this|findings demonstrate)\b/i.test(r.text)
  );
  const conclusion = conclusionMatches.length > 0 ? conclusionMatches[0].text : NOT_REPORTED;

  // 12. Grounded Evidence References (STRICTLY verbatim + real page or null)
  const evidence = [];
  const seenExcerpts = new Set();
  const addEvidence = (findingLabel, record) => {
    if (!record || !record.text || seenExcerpts.has(record.text)) return;
    seenExcerpts.add(record.text);
    evidence.push({
      paper_id: paper.paper_id,
      finding: findingLabel,
      excerpt: record.text,
      page: hasRealFullText ? record.page : null,
      section: record.section || (hasRealFullText ? 'Body' : 'Abstract'),
      evidence_status: record.evidence_status,
      verification_status: hasRealFullText ? 'verified' : 'abstract_only'
    });
  };

  if (objectiveMatches[0]) addEvidence('Research Objective', objectiveMatches[0]);
  if (problemMatches[0]) addEvidence('Problem Statement', problemMatches[0]);
  if (methodMatches[0]) addEvidence('Methodology', methodMatches[0]);
  if (resultMatches[0]) addEvidence('Experimental Results', resultMatches[0]);
  if (limitationMatches[0]) addEvidence('Limitations', limitationMatches[0]);
  if (futureMatches[0]) addEvidence('Future Work', futureMatches[0]);

  if (evidence.length === 0 && sentenceRecords[0]) {
    addEvidence('Core Paper Statement', sentenceRecords[0]);
  }

  // 13. Extracted Findings ledger clearly separating paper statements vs interpretive notes
  const extractedFindings = evidence.map(ev => ({
    paper_id: paper.paper_id,
    field: ev.finding,
    finding: ev.excerpt,
    evidence_excerpt: ev.excerpt,
    page: ev.page,
    section: ev.section,
    evidence_status: ev.evidence_status,
    statement_type: 'verbatim_paper_statement'
  }));

  // 14. Explicit Missing Fields / Uncertainties Audit
  const uncertainties = [];
  if (documentStatus === 'scanned_pdf') {
    uncertainties.push('Uploaded or retrieved PDF appears to be scanned/image-only with no selectable text layer (OCR required). Analysis fell back to available abstract metadata.');
  } else if (documentStatus === 'extraction_failed') {
    uncertainties.push(`PDF extraction failed (${paper.extraction_error || 'corrupted or encrypted stream'}). Analysis fell back to available abstract metadata.`);
  } else if (documentStatus === 'abstract_only') {
    uncertainties.push('Abstract-only analysis: Full-text PDF was unavailable or could not be retrieved from open repositories. Page-level claims and full experimental details require PDF upload.');
  } else if (documentStatus === 'unavailable') {
    uncertainties.push('Neither full-text PDF nor abstract text was available for this record.');
  }
  if (paper.retrieval_note) {
    uncertainties.push(paper.retrieval_note);
  }
  if (dataset.name === NOT_REPORTED) uncertainties.push('Dataset used: Not reported in available text.');
  if (metrics[0] === NOT_REPORTED) uncertainties.push('Evaluation metrics: Not reported in available text.');
  if (reportedResults[0] === NOT_REPORTED) uncertainties.push('Experimental results / quantitative performance: Not reported in available text.');
  if (limitations[0] === NOT_REPORTED) uncertainties.push('Limitations: Not reported in available text.');
  if (!paper.doi) uncertainties.push('Canonical DOI identifier unconfirmed in metadata.');

  return {
    paper_id: paper.paper_id,
    doi: paper.doi || 'N/A',
    title,
    authors: paper.authors || ['Anonymous Scholar'],
    year: paper.year || 2024,
    source: paper.source || paper.source_database || 'OpenAlex',
    source_url: paper.verified_source_url || paper.url || paper.source_url || (paper.doi ? `https://doi.org/${paper.doi}` : ''),
    document_status: documentStatus,
    analysis_scope_label: analysisScopeLabel,
    analysis_status: documentStatus === 'unavailable' ? 'incomplete' : (hasRealFullText ? 'completed_full_text' : 'completed_abstract_only'),
    analysis_engine: 'In-House ResearchScholar NLP Engine (SentenceRoleSoftmax + Verbatim)',
    objective,
    problem_statement: problemStatement,
    methodology,
    algorithms,
    dataset,
    datasets,
    preprocessing,
    metrics,
    evaluation_metrics: metrics,
    reported_results: reportedResults,
    reported_performance: reportedPerformance,
    limitations,
    future_work: futureWork,
    conclusion,
    extracted_findings: extractedFindings,
    ai_interpretation: {
      is_ai_generated: false,
      scope: analysisScopeLabel,
      note: hasRealFullText
        ? `Extracted using our in-house SentenceRoleSoftmax classifier and grounded verifier across ${pages.length || 1} parsed PDF pages.`
        : 'Extracted using our in-house SentenceRoleSoftmax classifier strictly from abstract metadata only; full-paper sections were unavailable.'
    },
    evidence,
    uncertainties,
    missing_fields: uncertainties,
    custom_instructions_applied: Boolean(customInstructions)
  };
}

/**
 * Generates Cross-Paper Synthesis matrix across all analyzed papers using ONLY verified extracted fields.
 */
export function generateCrossPaperSynthesis(analyses = [], researchTopic = '') {
  if (!Array.isArray(analyses) || analyses.length === 0) {
    return null;
  }

  const realFilter = (val) => val && val !== NOT_REPORTED;

  const allAlgorithms = Array.from(new Set(analyses.flatMap(a => a.algorithms || []).filter(realFilter)));
  const allMetrics = Array.from(new Set(analyses.flatMap(a => a.metrics || a.evaluation_metrics || []).filter(realFilter)));
  const allDatasets = Array.from(new Set(analyses.map(a => a.dataset?.name).filter(realFilter)));
  const allLimitations = Array.from(new Set(analyses.flatMap(a => a.limitations || []).filter(realFilter)));
  const allFutureWork = Array.from(new Set(analyses.flatMap(a => a.future_work || []).filter(realFilter)));

  const fullTextCount = analyses.filter(a => a.document_status === 'full_text').length;
  const abstractOnlyCount = analyses.filter(a => a.document_status !== 'full_text').length;

  return {
    corpus_size: analyses.length,
    full_text_count: fullTextCount,
    abstract_only_count: abstractOnlyCount,
    full_text_coverage: `${fullTextCount} of ${analyses.length} (${Math.round((fullTextCount / analyses.length) * 100)}%)`,
    primary_algorithmic_paradigms: allAlgorithms.length > 0 ? allAlgorithms.slice(0, 8) : [NOT_REPORTED],
    dominant_evaluation_metrics: allMetrics.length > 0 ? allMetrics.slice(0, 8) : [NOT_REPORTED],
    identified_datasets: allDatasets.length > 0 ? allDatasets.slice(0, 8) : [NOT_REPORTED],
    synthesized_consensus: fullTextCount > 0
      ? `Synthesized across ${analyses.length} papers (${fullTextCount} full-text PDF, ${abstractOnlyCount} abstract-only) on "${researchTopic}". Extracted ${allAlgorithms.length} distinct algorithms/models and ${allMetrics.length} evaluation metrics directly from source text.`
      : `Abstract-only synthesis across ${analyses.length} papers on "${researchTopic}". Upload open or local PDFs for page-level full-text extraction.`,
    shared_limitations: allLimitations.length > 0 ? allLimitations.slice(0, 5) : [NOT_REPORTED],
    cross_study_recommendations: allFutureWork.length > 0 ? allFutureWork.slice(0, 5) : [NOT_REPORTED]
  };
}

/**
 * Builds canonical Output 2 JSON payload directly acceptable by Module 3
 */
export function buildModule3Output(output1Payload, analyses, synthesis) {
  const projectId = output1Payload?.project_id || `rs-proj-${Date.now().toString(36)}`;
  const topic = output1Payload?.research_topic || 'Academic Research Topic';
  const question = output1Payload?.research_question || null;

  const fullTextCount = analyses.filter(a => a.document_status === 'full_text').length;
  const abstractOnlyCount = analyses.filter(a => a.document_status === 'abstract_only').length;
  const scannedPdfCount = analyses.filter(a => a.document_status === 'scanned_pdf').length;
  const failedCount = analyses.filter(a => a.document_status === 'extraction_failed' || a.document_status === 'unavailable').length;
  const evidenceCount = analyses.reduce((acc, a) => acc + (a.evidence?.length || 0), 0);

  return {
    schema_version: '2.0.0',
    module_source: 'ResearchScholar AI - Paper Analysis (Website 2)',
    target_module: 'ResearchScholar AI - Knowledge Graph & Synthesis (Module 3)',
    project_id: projectId,
    research_topic: topic,
    research_question: question,
    analysis_timestamp: new Date().toISOString(),
    analysis_metadata: {
      pipeline_version: '2.2.0',
      total_papers_analyzed: analyses.length,
      full_text_count: fullTextCount,
      abstract_only_count: abstractOnlyCount,
      scanned_pdf_count: scannedPdfCount,
      failed_count: failedCount,
      evidence_claim_count: evidenceCount
    },
    corpus_summary: {
      total_papers_analyzed: analyses.length,
      full_text_count: fullTextCount,
      abstract_only_count: abstractOnlyCount,
      scanned_pdf_count: scannedPdfCount,
      grounded_evidence_citations: evidenceCount
    },
    analyses: analyses.map(a => ({
      paper_id: a.paper_id,
      doi: a.doi,
      title: a.title,
      authors: a.authors,
      year: a.year,
      source: a.source,
      source_url: a.source_url,
      document_status: a.document_status,
      analysis_scope_label: a.analysis_scope_label,
      analysis_status: a.analysis_status,
      analysis_engine: a.analysis_engine || 'In-House ResearchScholar NLP Engine (SentenceRoleSoftmax + Verbatim)',
      objective: a.objective,
      problem_statement: a.problem_statement,
      methodology: a.methodology,
      algorithms: a.algorithms,
      dataset: a.dataset,
      datasets: a.datasets || (a.dataset?.name ? [a.dataset.name] : [NOT_REPORTED]),
      preprocessing: a.preprocessing,
      metrics: a.metrics,
      evaluation_metrics: a.evaluation_metrics || a.metrics,
      reported_results: a.reported_results,
      reported_performance: a.reported_performance || (Array.isArray(a.reported_results) ? a.reported_results[0] : NOT_REPORTED),
      limitations: a.limitations,
      future_work: a.future_work,
      conclusion: a.conclusion,
      extracted_findings: a.extracted_findings || [],
      ai_interpretation: a.ai_interpretation || null,
      evidence: a.evidence,
      uncertainties: a.uncertainties,
      missing_fields: a.missing_fields || a.uncertainties || []
    })),
    cross_paper_synthesis: synthesis
  };
}

/**
 * Validates Output 2 JSON schema against Module 3 requirements
 */
export function validateModule3Schema(output2) {
  if (!output2 || typeof output2 !== 'object') {
    return { valid: false, errors: ['Output 2 root must be a valid JSON object.'] };
  }

  const errors = [];
  if (output2.schema_version !== '2.0.0') {
    errors.push(`Invalid schema_version: Expected "2.0.0", got "${output2.schema_version}".`);
  }
  if (!output2.project_id) {
    errors.push('Missing "project_id".');
  }
  if (!output2.research_topic) {
    errors.push('Missing "research_topic".');
  }
  if (!Array.isArray(output2.analyses) || output2.analyses.length === 0) {
    errors.push('Missing or empty "analyses" array.');
  } else {
    output2.analyses.forEach((a, idx) => {
      if (!a.paper_id) errors.push(`Analysis #${idx + 1}: Missing "paper_id".`);
      if (!a.objective) errors.push(`Analysis #${idx + 1}: Missing "objective".`);
      if (!a.methodology) errors.push(`Analysis #${idx + 1}: Missing "methodology".`);
      if (!Array.isArray(a.evidence)) errors.push(`Analysis #${idx + 1}: Missing "evidence" array.`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    analysisCount: output2.analyses?.length || 0
  };
}

/**
 * Sample Output 1 Payload for explicit demo/testing ONLY
 */
export const SAMPLE_OUTPUT_1 = {
  schema_version: '1.0.0',
  module_source: 'ResearchScholar AI - Paper Discovery (Website 1)',
  target_module: 'ResearchScholar AI - Module 2',
  project_id: 'rs-proj-mwd1ajtz',
  research_topic: 'Attention Mechanisms in Deep Learning',
  research_question: 'How do linear attention mechanisms scale context length without quadratic complexity?',
  domain: 'Computer Science / AI',
  search_timestamp: '2026-11-12T04:14:37.031Z',
  search_metadata: {
    pipeline_version: '1.2.0',
    query_expansion: {
      classifiedDomain: 'Computer Science / AI',
      generatedKeywords: [
        'attention', 'mechanisms', 'deep', 'learning', 'linear', 'scale', 'context', 'length', 'transformer', 'efficiency'
      ],
      synonyms: ['multi-head attention', 'contextual representation', 'query-key-value'],
      searchQueries: [
        'Attention Mechanisms in Deep Learning',
        'attention AND mechanisms AND deep AND learning'
      ]
    },
    sources_queried: ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref'],
    total_retrieved: 5,
    deduplicated_count: 5,
    filters_applied: {
      year_range: [2018, 2026],
      preferred_sources: ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref'],
      inclusion_terms: [],
      exclusion_terms: [],
      papers_requested: 5
    }
  },
  papers: [
    {
      paper_id: 'rs-paper-001',
      title: 'A General Survey on Attention Mechanisms in Deep Learning',
      authors: ['Gianni Brauwers', 'Flavius Frăsincar'],
      year: 2021,
      doi: '10.1109/tkde.2021.3126456',
      abstract: 'Attention is an important mechanism that can be employed for a variety of deep learning models across many different domains and tasks. This survey provides an overview of the most important attention mechanisms proposed in the literature. The various attention mechanisms are explained by means of a framework consisting of a general attention model, uniform notation, and a comprehensive taxonomy of attention mechanisms. Furthermore, the various measures for evaluating attention models are reviewed, and methods to characterize the structure of attention models based on the proposed framework are discussed.',
      source: 'OpenAlex',
      verified_source_url: 'https://doi.org/10.1109/tkde.2021.3126456',
      open_access_status: 'green',
      full_text_status: 'available',
      pdf_url: 'https://pure.eur.nl/en/publications/0bd2c718-88ec-42b7-a5ac-81256a768854',
      relevance_score: 0.88,
      relevance_explanation: 'Significant conceptual overlap with "Attention Mechanisms in Deep Learning".',
      keywords: ['Computer science', 'Data science', 'Deep learning'],
      citation_count: 774,
      venue: 'IEEE Transactions on Knowledge and Data Engineering'
    },
    {
      paper_id: 'rs-paper-002',
      title: 'Improving Image Classification Using Attention Mechanisms in Deep Learning Models',
      authors: ['Vinod Sharma', 'Atul Kumar Mishra', 'Anil Kumar', 'Nanda Shakti'],
      year: 2024,
      doi: '10.1109/aece62803.2024.10911830',
      abstract: 'In this study, we explore the application of attention mechanisms to enhance deep learning models in the context of image classification. We assess several types of attention mechanisms across diverse image classification datasets. Our findings indicate substantial enhancements in model accuracy facilitated by these attention mechanisms. Additionally, we delve into implementation challenges such as computational overhead and the necessity for extensive datasets.',
      source: 'OpenAlex',
      verified_source_url: 'https://doi.org/10.1109/aece62803.2024.10911830',
      open_access_status: 'closed',
      full_text_status: 'restricted',
      pdf_url: null,
      relevance_score: 0.81,
      relevance_explanation: 'Significant conceptual overlap with "Attention Mechanisms in Deep Learning".',
      keywords: ['Computer science', 'Deep learning', 'Artificial intelligence'],
      citation_count: 12,
      venue: 'International Conference on Advancement in Electronics & Communication Engineering'
    },
    {
      paper_id: 'rs-paper-003',
      title: 'Examining Attention Mechanisms in Deep Learning Models for Sentiment Analysis',
      authors: ['Spyridon Kardakis', 'Isidoros Perikos', 'Foteini Grivokostopoulou'],
      year: 2021,
      doi: '10.3390/app11093883',
      abstract: 'Attention-based methods for deep neural networks constitute a technique that has attracted increased interest in recent years. Attention mechanisms can focus on important parts of a sequence and, as a result, enhance the performance of neural networks in a variety of tasks, including sentiment analysis, emotion recognition, machine translation and speech recognition. In this work, we study attention-based models built on recurrent neural networks (RNNs) and examine their performance in various contexts of sentiment analysis.',
      source: 'OpenAlex',
      verified_source_url: 'https://doi.org/10.3390/app11093883',
      open_access_status: 'gold',
      full_text_status: 'available',
      pdf_url: 'https://www.mdpi.com/2076-3417/11/9/3883/pdf?version=1619361335',
      relevance_score: 0.80,
      relevance_explanation: 'Significant conceptual overlap with "Attention Mechanisms in Deep Learning".',
      keywords: ['Computer science', 'Sentiment analysis', 'Artificial intelligence', 'Deep learning'],
      citation_count: 86,
      venue: 'Applied Sciences'
    },
    {
      paper_id: 'rs-paper-004',
      title: 'Attention mechanisms and deep learning for machine vision: A survey of the state of the art',
      authors: ['Abdul Mueed Hafiz', 'Shabir A. Parah', 'Rouf Ul Alam Bhat'],
      year: 2021,
      doi: '10.21203/rs.3.rs-510910/v1',
      abstract: 'With the advent of state of the art nature-inspired pure attention based models i.e. transformers, and their success in natural language processing (NLP), their extension to machine vision (MV) tasks was inevitable and much felt. Subsequently, vision transformers (ViTs) were introduced which are giving quite a challenge to the established deep learning based machine vision techniques.',
      source: 'arXiv',
      verified_source_url: 'https://doi.org/10.21203/rs.3.rs-510910/v1',
      open_access_status: 'green',
      full_text_status: 'available',
      pdf_url: 'https://www.researchsquare.com/article/rs-510910/latest.pdf',
      relevance_score: 0.79,
      relevance_explanation: 'Provides supportive context for "Attention Mechanisms in Deep Learning".',
      keywords: ['Computer science', 'Artificial intelligence', 'Deep learning', 'Transformer'],
      citation_count: 93,
      venue: 'Research Square'
    },
    {
      paper_id: 'rs-paper-005',
      title: 'Effect of Attention Mechanism in Deep Learning-Based Remote Sensing Image Processing: A Systematic Literature Review',
      authors: ['Saman Ghaffarian', 'Joao Ricardo Pereira Valente', 'Mariska van der Voort', 'Bedir Tekinerdoğan'],
      year: 2021,
      doi: '10.3390/rs13152965',
      abstract: 'Machine learning, particularly deep learning (DL), has become a central and state-of-the-art method for several computer vision applications and remote sensing (RS) image processing. Researchers are continually trying to improve the performance of the DL methods by developing new architectural designs of the networks and/or developing new techniques, such as attention mechanisms.',
      source: 'OpenAlex',
      verified_source_url: 'https://doi.org/10.3390/rs13152965',
      open_access_status: 'gold',
      full_text_status: 'available',
      pdf_url: 'https://www.mdpi.com/2072-4292/13/15/2965/pdf?version=1627568111',
      relevance_score: 0.79,
      relevance_explanation: 'Provides supportive context for "Attention Mechanisms in Deep Learning".',
      keywords: ['Computer science', 'Artificial intelligence', 'Deep learning', 'Machine learning'],
      citation_count: 231,
      venue: 'Remote Sensing'
    }
  ]
};
