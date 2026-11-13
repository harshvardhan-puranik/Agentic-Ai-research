/**
 * ResearchScholar AI - Module 3: Research Gap Identification Engine
 * Evidence-grounded cross-paper synthesis and research gap analysis.
 *
 * Strictly compares actual Module 2 (Output 2 v2.0.0) findings without
 * fabricating limitations, datasets, citations, percentages, or page numbers,
 * and never treats "Not reported" / missing metadata as proof of a domain gap.
 */

import { clusterObservationsByTfIdf } from '../ml/index.js';

const SENTINEL_VALUES = new Set([
  '',
  'not reported',
  'unspecified',
  'n/a',
  'na',
  'none',
  'unknown',
  'unavailable',
  'insufficient content',
  'insufficient content (no full text or abstract)'
]);

export function isReportedValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val !== 'string') return Boolean(val);
  const norm = val.trim().toLowerCase();
  if (!norm || SENTINEL_VALUES.has(norm)) return false;
  if (norm.startsWith('not reported')) return false;
  return true;
}

function cleanArrayValues(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(v => isReportedValue(v));
}

function extractKeywords(text) {
  const stop = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'which', 'their', 'about',
    'into', 'using', 'used', 'based', 'study', 'studies', 'paper', 'papers', 'research',
    'results', 'model', 'models', 'approach', 'approaches', 'method', 'methods', 'analysis',
    'evaluation', 'reported', 'across', 'through', 'between', 'under', 'over', 'when',
    'where', 'while', 'such', 'than', 'more', 'most', 'only', 'also', 'well', 'high',
    'large', 'limited', 'lack', 'lacks', 'remaining', 'future', 'work', 'further',
    'direction', 'directions', 'however', 'current', 'currently', 'either', 'both',
    'since', 'thus', 'therefore', 'although', 'despite', 'many', 'some', 'several',
    'various', 'different', 'other', 'often', 'still', 'even', 'because', 'could',
    'would', 'should', 'there', 'these', 'those', 'they', 'them', 'what', 'each',
    'every', 'very', 'much', 'make', 'made', 'need', 'needs', 'show', 'shows', 'shown',
    'present', 'presents', 'propose', 'proposed', 'existing', 'previous', 'recent',
    'mechanism', 'mechanisms', 'framework', 'system', 'systems', 'performance',
    'additional', 'significant', 'investigate', 'explore', 'exploring', 'property',
    'opens', 'multitude', 'regarding', 'toward', 'towards', 'within', 'without', 'among'
  ]);
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stop.has(w));
  return Array.from(new Set(tokens));
}

/**
 * Validates Output 2 JSON payload imported from Module 2
 */
export function validateOutput2Payload(payload) {
  if (!payload) {
    return { valid: false, errors: ['Input is empty. Please provide Output 2 JSON from Module 2.'] };
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
    return { valid: false, errors: ['Invalid Output 2 structure: Root must be a valid JSON object.'] };
  }

  const errors = [];

  if (data.schema_version !== '2.0.0') {
    errors.push(`Invalid schema_version: Expected "2.0.0", received "${data.schema_version || 'undefined'}".`);
  }
  if (!data.project_id) {
    errors.push('Missing "project_id".');
  }
  if (!data.research_topic) {
    errors.push('Missing "research_topic".');
  }
  if (!Array.isArray(data.analyses)) {
    errors.push('Missing "analyses" array.');
  } else if (data.analyses.length === 0) {
    errors.push('"analyses" array is empty. At least 1 analyzed paper is required.');
  } else {
    const seenIds = new Set();
    data.analyses.forEach((a, idx) => {
      const pId = a.paper_id || `#${idx + 1}`;
      if (!a.paper_id) {
        errors.push(`Analysis ${pId}: Missing "paper_id".`);
      } else if (seenIds.has(a.paper_id)) {
        errors.push(`Analysis ${pId}: Duplicate paper_id "${a.paper_id}". Paper IDs must be unique.`);
      } else {
        seenIds.add(a.paper_id);
      }
      if (!a.title) errors.push(`Analysis ${pId}: Missing "title".`);
      if (!a.methodology) errors.push(`Analysis ${pId}: Missing "methodology".`);
      if (!Array.isArray(a.evidence)) errors.push(`Analysis ${pId}: Missing "evidence" array.`);
    });
  }

  let fullTextCount = 0;
  let abstractOnlyCount = 0;
  let scannedCount = 0;
  let failedCount = 0;
  let unavailableCount = 0;
  let totalEvidence = 0;

  if (Array.isArray(data.analyses)) {
    data.analyses.forEach(a => {
      const status = (a.document_status || '').toLowerCase();
      if (status === 'full_text') fullTextCount++;
      else if (status === 'scanned_pdf') scannedCount++;
      else if (status === 'extraction_failed') failedCount++;
      else if (status === 'unavailable') unavailableCount++;
      else abstractOnlyCount++;

      if (Array.isArray(a.evidence)) {
        totalEvidence += a.evidence.length;
      }
    });
  }

  const coverage = {
    totalPapers: data.analyses ? data.analyses.length : 0,
    fullTextCount,
    abstractOnlyCount,
    scannedCount,
    failedCount,
    unavailableCount,
    totalEvidence,
    coverageRatio: data.analyses && data.analyses.length > 0
      ? Math.round((fullTextCount / data.analyses.length) * 100)
      : 0
  };

  return {
    valid: errors.length === 0,
    errors,
    data,
    coverage
  };
}

/**
 * Normalizes genuine observations across all imported paper analyses.
 * Strictly strips "Not reported" placeholders and preserves null pages for abstract-only items.
 */
export function normalizeObservations(analyses = []) {
  const observations = {
    objectives: [],
    problemStatements: [],
    methodologies: [],
    algorithms: new Set(),
    datasets: [],
    metrics: new Set(),
    reportedResults: [],
    reportedPerformance: [],
    limitations: [],
    futureWork: [],
    evidenceBank: [],
    paperAlgorithmMap: {},
    paperMetricMap: {},
    paperDatasetMap: {},
    unreportedSummary: {
      algorithmsMissingPapers: [],
      datasetMissingPapers: [],
      metricsMissingPapers: [],
      resultsMissingPapers: [],
      limitationsMissingPapers: [],
      futureWorkMissingPapers: []
    }
  };

  analyses.forEach(a => {
    const pId = a.paper_id;
    const title = a.title;
    const year = a.year || null;
    const docStatus = a.document_status || 'abstract_only';

    if (isReportedValue(a.objective)) {
      observations.objectives.push({ paper_id: pId, title, year, document_status: docStatus, text: a.objective.trim() });
    }
    if (isReportedValue(a.problem_statement)) {
      observations.problemStatements.push({ paper_id: pId, title, year, document_status: docStatus, text: a.problem_statement.trim() });
    }
    if (isReportedValue(a.methodology)) {
      observations.methodologies.push({ paper_id: pId, title, year, document_status: docStatus, text: a.methodology.trim() });
    }

    const algs = cleanArrayValues(a.algorithms);
    observations.paperAlgorithmMap[pId] = algs;
    if (algs.length > 0) {
      algs.forEach(alg => observations.algorithms.add(alg));
    } else {
      observations.unreportedSummary.algorithmsMissingPapers.push(pId);
    }

    // Support both Module 2 `dataset` object and `datasets` array
    const dsEntries = [];
    if (a.dataset && isReportedValue(a.dataset.name)) {
      dsEntries.push({
        paper_id: pId,
        paper_title: title,
        name: a.dataset.name.trim(),
        size: isReportedValue(a.dataset.size) ? a.dataset.size.trim() : 'Not reported',
        domain: isReportedValue(a.dataset.domain) ? a.dataset.domain.trim() : 'Not reported'
      });
    } else if (Array.isArray(a.datasets)) {
      cleanArrayValues(a.datasets).forEach(dsName => {
        dsEntries.push({
          paper_id: pId,
          paper_title: title,
          name: dsName,
          size: 'Not reported',
          domain: 'Not reported'
        });
      });
    }
    observations.paperDatasetMap[pId] = dsEntries.map(d => d.name);
    if (dsEntries.length > 0) {
      observations.datasets.push(...dsEntries);
    } else {
      observations.unreportedSummary.datasetMissingPapers.push(pId);
    }

    const paperMetrics = cleanArrayValues(a.evaluation_metrics || a.metrics);
    observations.paperMetricMap[pId] = paperMetrics;
    if (paperMetrics.length > 0) {
      paperMetrics.forEach(m => observations.metrics.add(m));
    } else {
      observations.unreportedSummary.metricsMissingPapers.push(pId);
    }

    const results = cleanArrayValues(a.reported_results);
    if (results.length > 0) {
      results.forEach(res => {
        observations.reportedResults.push({ paper_id: pId, title, year, document_status: docStatus, text: res });
      });
    } else {
      observations.unreportedSummary.resultsMissingPapers.push(pId);
    }

    if (isReportedValue(a.reported_performance)) {
      observations.reportedPerformance.push({ paper_id: pId, title, document_status: docStatus, text: a.reported_performance.trim() });
    }

    const lims = cleanArrayValues(a.limitations);
    if (lims.length > 0) {
      lims.forEach(lim => {
        observations.limitations.push({ paper_id: pId, title, year, document_status: docStatus, text: lim });
      });
    } else {
      observations.unreportedSummary.limitationsMissingPapers.push(pId);
    }

    const fws = cleanArrayValues(a.future_work);
    if (fws.length > 0) {
      fws.forEach(fw => {
        observations.futureWork.push({ paper_id: pId, title, year, document_status: docStatus, text: fw });
      });
    } else {
      observations.unreportedSummary.futureWorkMissingPapers.push(pId);
    }

    if (Array.isArray(a.evidence)) {
      a.evidence.forEach(ev => {
        if (!ev || !isReportedValue(ev.excerpt)) return;
        const validPage = typeof ev.page === 'number' && ev.page > 0 ? ev.page : null;
        observations.evidenceBank.push({
          paper_id: pId,
          paper_title: title,
          finding: ev.finding || 'Extracted Claim',
          page: validPage,
          section: ev.section || (validPage ? 'Body' : 'Abstract'),
          excerpt: ev.excerpt.trim(),
          evidence_status: ev.evidence_status || (validPage ? 'verbatim_full_text' : 'verbatim_abstract'),
          verification_status: ev.verification_status || (validPage ? 'verified' : 'abstract_only')
        });
      });
    }
  });

  return {
    ...observations,
    algorithms: Array.from(observations.algorithms),
    metrics: Array.from(observations.metrics)
  };
}

const DOMAIN_AGNOSTIC_THEMES = [
  {
    id: 'cluster-scalability-efficiency',
    name: 'Computational, Resource & Scalability Constraints',
    theme: 'Scalability & Efficiency',
    description: 'Reported constraints regarding computational cost, memory overhead, throughput, latency, or scaling behavior.',
    keywords: ['computational', 'overhead', 'memory', 'quadratic', 'complexity', 'latency', 'scalab', 'throughput', 'cost', 'expensive', 'resource', 'energy', 'vram', 'runtime']
  },
  {
    id: 'cluster-generalization-robustness',
    name: 'Generalization, Stability & External Validity Boundaries',
    theme: 'Generalization & Robustness',
    description: 'Reported sensitivity to distribution shifts, noisy real-world inputs, degradation mechanisms, or restricted validation scope.',
    keywords: ['generaliz', 'robust', 'distribution', 'noise', 'drift', 'shift', 'stability', 'degrad', 'in vivo', 'in vitro', 'external validity', 'overfit', 'adversarial', 'real-world', 'out-of-domain']
  },
  {
    id: 'cluster-data-sample-scarcity',
    name: 'Data Availability, Annotation Scarcity & Cohort Bias',
    theme: 'Data & Measurement Quality',
    description: 'Reported dependence on large labeled cohorts, small sample sizes, class imbalance, or incomplete measurement coverage.',
    keywords: ['dataset', 'data', 'sample', 'cohort', 'annotated', 'label', 'scarce', 'scarcity', 'small size', 'imbalance', 'bias', 'missing data', 'heterogeneity']
  },
  {
    id: 'cluster-methodological-design',
    name: 'Methodological, Architectural & Mechanistic Limitations',
    theme: 'Methodological Constraints',
    description: 'Explicit limitations in experimental protocol, control baselines, hyperparameter sensitivity, or underlying physical/algorithmic mechanisms.',
    keywords: ['hyperparameter', 'baseline', 'ablation', 'initialization', 'assumption', 'parameter', 'calibration', 'off-target', 'efficiency', 'yield', 'precision', 'selectivity', 'specificity', 'convergence']
  },
  {
    id: 'cluster-evaluation-interpretability',
    name: 'Evaluation Consistency, Reproducibility & Interpretability',
    theme: 'Evaluation & Theory',
    description: 'Challenges related to metric comparability, benchmark fragmentation, causal interpretability, or theoretical guarantees.',
    keywords: ['metric', 'benchmark', 'split', 'reproduc', 'interpret', 'explainab', 'causal', 'theoretical', 'faithfulness', 'standardiz', 'comparison']
  },
  {
    id: 'cluster-deployment-translation',
    name: 'Practical Deployment, Hardware & Translational Barriers',
    theme: 'Translation & Deployment',
    description: 'Barriers preventing laboratory or simulated methods from transferring to operational, clinical, industrial, or constrained environments.',
    keywords: ['deploy', 'clinical', 'patient', 'hardware', 'edge', 'fabrication', 'manufactur', 'regulatory', 'safety', 'toxicity', 'long-term', 'field', 'operational']
  }
];

/**
 * Dynamically clusters ONLY genuine observations from the analyzed corpus.
 * Never returns unpopulated boilerplate clusters.
 */
export function clusterObservations(normalized, analyses = []) {
  const clustersMap = new Map();

  const addToCluster = (template, item, bucket) => {
    if (!clustersMap.has(template.id)) {
      clustersMap.set(template.id, {
        id: template.id,
        name: template.name,
        theme: template.theme,
        description: template.description,
        matchedLimitations: [],
        matchedProblemStatements: [],
        matchedFutureWork: [],
        paperIds: new Set()
      });
    }
    const c = clustersMap.get(template.id);
    c[bucket].push(item);
    if (item.paper_id) c.paperIds.add(item.paper_id);
  };

  const matchTheme = (text) => {
    const lower = (text || '').toLowerCase();
    for (const theme of DOMAIN_AGNOSTIC_THEMES) {
      if (theme.keywords.some(kw => lower.includes(kw))) {
        return theme;
      }
    }
    return {
      id: 'cluster-corpus-specific',
      name: 'Corpus-Specific Reported Constraints & Open Problems',
      theme: 'Domain-Specific Challenges',
      description: 'Specific domain constraints and open challenges directly stated in the analyzed literature.'
    };
  };

  (normalized.limitations || []).forEach(lim => {
    addToCluster(matchTheme(lim.text), lim, 'matchedLimitations');
  });

  // Include explicit problem statements ONLY if there are also limitations or future work,
  // or to contextualize papers where limitations were summarized in problem framing
  (normalized.problemStatements || []).forEach(prob => {
    const lower = prob.text.toLowerCase();
    for (const theme of DOMAIN_AGNOSTIC_THEMES) {
      if (theme.keywords.some(kw => lower.includes(kw))) {
        addToCluster(theme, prob, 'matchedProblemStatements');
        break;
      }
    }
  });

  (normalized.futureWork || []).forEach(fw => {
    addToCluster(matchTheme(fw.text), fw, 'matchedFutureWork');
  });

  return Array.from(clustersMap.values())
    .map(c => {
      const limSubclusters = clusterObservationsByTfIdf(c.matchedLimitations || [], 0.14);
      return {
        ...c,
        paperIds: Array.from(c.paperIds),
        semantic_subclusters: limSubclusters.length
      };
    })
    .sort((a, b) => {
      const scoreA = a.matchedLimitations.length * 3 + a.paperIds.length * 2 + a.matchedFutureWork.length;
      const scoreB = b.matchedLimitations.length * 3 + b.paperIds.length * 2 + b.matchedFutureWork.length;
      return scoreB - scoreA;
    });
}

/**
 * Detects genuine cross-paper tensions, trade-offs, and disagreements
 * derived strictly from the analyzed papers (never fabricated numbers or fake IDs).
 */
export function detectContradictionsAndTensions(analyses = [], normalizedInput = null) {
  if (!Array.isArray(analyses) || analyses.length < 2) {
    return [];
  }

  const normalized = normalizedInput || normalizeObservations(analyses);
  const tensions = [];

  // 1. Positive empirical results vs explicitly reported operational limitations across the corpus
  const papersWithResults = analyses.filter(a => cleanArrayValues(a.reported_results).length > 0);
  const papersWithLimitations = analyses.filter(a => cleanArrayValues(a.limitations).length > 0);
  if (papersWithResults.length > 0 && papersWithLimitations.length > 0) {
    const sampleRes = cleanArrayValues(papersWithResults[0].reported_results)[0];
    const sampleLim = cleanArrayValues(papersWithLimitations[0].limitations)[0];
    const involvedIds = Array.from(new Set([
      ...papersWithResults.slice(0, 3).map(a => a.paper_id),
      ...papersWithLimitations.slice(0, 3).map(a => a.paper_id)
    ]));
    tensions.push({
      id: 'tension-efficacy-vs-constraints',
      topic: 'Reported Efficacy Gains vs Documented Practical Limitations',
      observationA: `${papersWithResults.length} analyzed paper(s) report positive outcomes (e.g., ${papersWithResults[0].paper_id}: "${sampleRes.slice(0, 180)}").`,
      observationB: `${papersWithLimitations.length} analyzed paper(s) simultaneously document operational or methodological constraints (e.g., ${papersWithLimitations[0].paper_id}: "${sampleLim.slice(0, 180)}").`,
      paperIds: involvedIds,
      conflictType: 'Performance vs Practicality Trade-off',
      implication: 'Reported gains under controlled study settings remain bounded by the unresolved constraints documented by the authors.'
    });
  }

  // 2. Methodological / Algorithmic Divergence across papers
  const paperAlgsEntries = Object.entries(normalized.paperAlgorithmMap || {})
    .filter(([, algs]) => algs.length > 0);
  if (paperAlgsEntries.length >= 2) {
    const [pA, algsA] = paperAlgsEntries[0];
    const divergentEntry = paperAlgsEntries.find(([, algs]) => algs.some(alg => !algsA.includes(alg)));
    if (divergentEntry) {
      const [pB, algsB] = divergentEntry;
      tensions.push({
        id: 'tension-methodological-divergence',
        topic: 'Methodological & Algorithmic Divergence Without Direct Cross-Benchmarking',
        observationA: `${pA} employs ${algsA.join(', ')}.`,
        observationB: `${pB} instead utilizes ${algsB.join(', ')}.`,
        paperIds: [pA, pB],
        conflictType: 'Methodological Divergence',
        implication: 'Studies pursue distinct modeling or experimental paradigms without evaluating competing approaches under identical controlled conditions.'
      });
    }
  }

  // 3. Evaluation Metric & Dataset Fragmentation (prevents direct cross-paper comparison)
  const reportedDatasets = normalized.datasets || [];
  const uniqueDatasetNames = Array.from(new Set(reportedDatasets.map(d => d.name)));
  const reportedMetrics = normalized.metrics || [];
  if (uniqueDatasetNames.length >= 2 || (reportedDatasets.length >= 2 && reportedMetrics.length >= 2)) {
    const dsPapers = Array.from(new Set(reportedDatasets.map(d => d.paper_id)));
    tensions.push({
      id: 'tension-evaluation-incomparability',
      topic: 'Disjoint Datasets & Evaluation Metrics Limiting Cross-Study Comparability',
      observationA: `Reported datasets span ${uniqueDatasetNames.slice(0, 4).join(', ')}.`,
      observationB: `Evaluation relies on varied metrics (${reportedMetrics.slice(0, 4).join(', ')}), preventing standardized head-to-head comparison.`,
      paperIds: dsPapers.slice(0, 4),
      conflictType: 'Evaluation Protocol Fragmentation',
      implication: 'Cross-paper performance rankings cannot be reliably synthesized until studies adopt shared benchmarks and consistent metrics.'
    });
  }

  // 4. Direct directional tension (improvement/stability vs degradation/failure)
  const failurePapers = analyses.filter(a => {
    const text = [...cleanArrayValues(a.limitations), ...cleanArrayValues(a.reported_results)].join(' ');
    return /\b(fail|degrad|worse|insufficient|unstable|collapse|drop|sensitivity|poor)\b/i.test(text);
  });
  const successPapers = analyses.filter(a => {
    const text = cleanArrayValues(a.reported_results).join(' ');
    return /\b(outperform|achieve|improv|superior|higher|significant|robust)\b/i.test(text);
  });
  if (failurePapers.length > 0 && successPapers.length > 0 && (failurePapers[0].paper_id !== successPapers[0].paper_id || failurePapers.length > 1)) {
    const fPaper = failurePapers.find(p => p.paper_id !== successPapers[0].paper_id) || failurePapers[0];
    const sPaper = successPapers[0];
    const fQuote = cleanArrayValues(fPaper.limitations)[0] || cleanArrayValues(fPaper.reported_results)[0];
    const sQuote = cleanArrayValues(sPaper.reported_results)[0];
    if (fQuote && sQuote && fPaper.paper_id !== sPaper.paper_id) {
      tensions.push({
        id: 'tension-contextual-disagreement',
        topic: 'Context-Dependent Outcome Divergence Across Studies',
        observationA: `${sPaper.paper_id} reports strong outcomes: "${sQuote.slice(0, 170)}".`,
        observationB: `${fPaper.paper_id} highlights degradation or sensitivity issues: "${fQuote.slice(0, 170)}".`,
        paperIds: [sPaper.paper_id, fPaper.paper_id],
        conflictType: 'Empirical Tension',
        implication: 'Method effectiveness depends heavily on experimental conditions, highlighting boundary conditions requiring systematic ablation.'
      });
    }
  }

  return tensions;
}

/**
 * Generates the complete 10-dimension Comparative Analysis across all analyzed papers.
 */
export function compareCorpusDimensions(analyses = [], normalizedInput = null, clusters = [], tensions = []) {
  const normalized = normalizedInput || normalizeObservations(analyses);

  const objectivesPerPaper = analyses.map(a => ({
    paper_id: a.paper_id,
    title: a.title,
    document_status: a.document_status,
    objective: isReportedValue(a.objective) ? a.objective : 'Not reported'
  }));

  const methPerPaper = analyses.map(a => ({
    paper_id: a.paper_id,
    title: a.title,
    methodology: isReportedValue(a.methodology) ? a.methodology : 'Not reported',
    algorithms: normalized.paperAlgorithmMap[a.paper_id]?.length
      ? normalized.paperAlgorithmMap[a.paper_id]
      : ['Not reported']
  }));

  const datasetsReported = normalized.datasets;
  const unreportedDsCount = normalized.unreportedSummary.datasetMissingPapers.length;
  const metricsPerPaper = analyses.map(a => ({
    paper_id: a.paper_id,
    title: a.title,
    metrics: normalized.paperMetricMap[a.paper_id]?.length
      ? normalized.paperMetricMap[a.paper_id]
      : ['Not reported']
  }));

  const resultsPerPaper = analyses.map(a => ({
    paper_id: a.paper_id,
    title: a.title,
    document_status: a.document_status,
    reported_results: cleanArrayValues(a.reported_results),
    reported_performance: isReportedValue(a.reported_performance) ? a.reported_performance : 'Not reported'
  }));

  const recurringLimitations = clusters
    .filter(c => c.matchedLimitations.length > 0)
    .map(c => ({
      theme: c.name,
      category: c.theme,
      paper_count: c.paperIds.length,
      affected_paper_ids: c.paperIds,
      statements: c.matchedLimitations.map(l => ({
        paper_id: l.paper_id,
        text: l.text
      }))
    }));

  const methodologicalLimitations = normalized.limitations.map(l => ({
    paper_id: l.paper_id,
    title: l.title,
    limitation: l.text
  }));

  const futureResearchOpportunities = normalized.futureWork.map(fw => ({
    paper_id: fw.paper_id,
    title: fw.title,
    opportunity: fw.text
  }));

  // Underexplored research areas derived ONLY from observed future work & disjoint benchmark coverage
  const underexploredAreas = [];
  if (normalized.futureWork.length > 0) {
    normalized.futureWork.slice(0, 4).forEach(fw => {
      underexploredAreas.push({
        area: fw.text,
        basis: 'Explicit Future Work Suggestion',
        supporting_paper_ids: [fw.paper_id]
      });
    });
  }
  if (normalized.algorithms.length >= 2 && Array.from(new Set(datasetsReported.map(d => d.name))).length <= 1 && datasetsReported.length > 0) {
    underexploredAreas.push({
      area: `Cross-benchmark generalization across multiple independent datasets beyond ${datasetsReported[0].name}`,
      basis: 'Observed Single-Dataset Concentration in Corpus',
      supporting_paper_ids: Array.from(new Set(datasetsReported.map(d => d.paper_id)))
    });
  }

  return {
    objectives_comparison: {
      summary: `${normalized.objectives.length} of ${analyses.length} papers reported explicit research objectives.`,
      per_paper: objectivesPerPaper
    },
    methodologies_and_algorithms_comparison: {
      summary: normalized.algorithms.length > 0
        ? `Identified ${normalized.algorithms.length} distinct algorithmic/modeling approaches across ${analyses.length} papers: ${normalized.algorithms.join(', ')}.`
        : `Explicit algorithm names were not reported across the retrieved records (${normalized.methodologies.length} reported methodology summaries).`,
      unique_algorithms: normalized.algorithms,
      per_paper: methPerPaper
    },
    datasets_comparison: {
      summary: datasetsReported.length > 0
        ? `${datasetsReported.length} explicit dataset reference(s) reported across ${new Set(datasetsReported.map(d => d.paper_id)).size} paper(s)${unreportedDsCount > 0 ? ` (${unreportedDsCount} paper(s) did not report datasets in available text — treated as missing data, not a research gap).` : '.'}`
        : `No specific named datasets were reported in the available extracted text across ${analyses.length} papers (missing metadata due to abstract-only scope or unstated datasets is NOT treated as a research gap).`,
      datasets_reported: datasetsReported,
      unreported_paper_ids: normalized.unreportedSummary.datasetMissingPapers
    },
    evaluation_metrics_comparison: {
      summary: normalized.metrics.length > 0
        ? `${normalized.metrics.length} evaluation metric(s) identified: ${normalized.metrics.join(', ')}.`
        : 'No explicit quantitative evaluation metrics were reported in the analyzed text.',
      unique_metrics: normalized.metrics,
      per_paper: metricsPerPaper
    },
    reported_results_comparison: {
      summary: normalized.reportedResults.length > 0
        ? `${normalized.reportedResults.length} experimental result statement(s) extracted across ${new Set(normalized.reportedResults.map(r => r.paper_id)).size} paper(s).`
        : 'No explicit experimental result statements were reported in the available paper text.',
      per_paper: resultsPerPaper
    },
    recurring_limitations: recurringLimitations,
    contradictory_findings: tensions,
    underexplored_research_areas: underexploredAreas,
    methodological_limitations: methodologicalLimitations,
    future_research_opportunities: futureResearchOpportunities
  };
}

/**
 * Evaluates whether the imported papers provide sufficient evidence
 * to support valid research-gap synthesis without speculation.
 */
export function assessEvidenceSufficiency(analyses = [], normalizedInput = null, gaps = []) {
  const normalized = normalizedInput || normalizeObservations(analyses);
  const totalPapers = analyses.length;
  const fullTextCount = analyses.filter(a => a.document_status === 'full_text').length;
  const abstractOnlyCount = totalPapers - fullTextCount;
  const papersWithLimitations = new Set(normalized.limitations.map(l => l.paper_id)).size;
  const papersWithResults = new Set(normalized.reportedResults.map(r => r.paper_id)).size;
  const evidenceSupportedGaps = gaps.filter(g => !g.is_speculative).length;

  if (totalPapers === 0) {
    return {
      is_sufficient: false,
      sufficiency_level: 'insufficient',
      message: 'No analyzed papers provided. More research papers are needed.',
      recommendation: 'Discover and analyze at least 2–3 relevant research papers in Modules 1 & 2.',
      full_text_papers: 0,
      abstract_only_papers: 0,
      papers_with_limitations: 0
    };
  }

  if (totalPapers < 2) {
    return {
      is_sufficient: false,
      sufficiency_level: 'insufficient',
      message: `Only ${totalPapers} paper was analyzed. More research papers are needed (at least 2–3 papers) to perform cross-paper comparison and validate recurring gaps.`,
      recommendation: 'Add additional peer-reviewed papers or upload full-text PDFs in Modules 1 & 2.',
      full_text_papers: fullTextCount,
      abstract_only_papers: abstractOnlyCount,
      papers_with_limitations: papersWithLimitations
    };
  }

  if (normalized.limitations.length === 0 && normalized.problemStatements.length === 0 && normalized.futureWork.length === 0) {
    return {
      is_sufficient: false,
      sufficiency_level: 'insufficient',
      message: `Insufficient evidence in the ${totalPapers} analyzed papers: no explicit limitations, problem bottlenecks, or future directions were reported in the extracted text (${abstractOnlyCount} abstract-only). Missing information is NOT treated as proof of a research gap; more research papers or full-text PDFs are needed.`,
      recommendation: 'Upload full-text PDFs in Module 2 or retrieve additional open-access papers in Module 1.',
      full_text_papers: fullTextCount,
      abstract_only_papers: abstractOnlyCount,
      papers_with_limitations: 0
    };
  }

  if (fullTextCount === 0 || evidenceSupportedGaps === 0) {
    return {
      is_sufficient: evidenceSupportedGaps > 0,
      sufficiency_level: 'limited',
      message: `Limited corpus depth (${fullTextCount} full-text PDFs, ${abstractOnlyCount} abstract-only records; ${papersWithLimitations} paper(s) state explicit limitations). Findings are bounded by available abstracts; more full-text research papers are needed for strong evidence confirmation.`,
      recommendation: 'Upload full-text PDFs in Module 2 to strengthen evidence verification and page-level citations.',
      full_text_papers: fullTextCount,
      abstract_only_papers: abstractOnlyCount,
      papers_with_limitations: papersWithLimitations
    };
  }

  return {
    is_sufficient: true,
    sufficiency_level: fullTextCount >= Math.ceil(totalPapers * 0.5) && papersWithLimitations >= 2 ? 'sufficient' : 'moderate',
    message: `Corpus provides grounded comparative coverage (${fullTextCount} of ${totalPapers} full-text papers; ${papersWithLimitations} papers reporting explicit limitations).`,
    recommendation: abstractOnlyCount > 0 ? `Uploading full-text PDFs for the remaining ${abstractOnlyCount} abstract-only paper(s) would further increase confidence.` : 'Corpus well-grounded with full-text evidence.',
    full_text_papers: fullTextCount,
    abstract_only_papers: abstractOnlyCount,
    papers_with_limitations: papersWithLimitations
  };
}

/**
 * Helper to gather ONLY verified evidence excerpts from specific paper IDs
 */
function collectSupportingEvidenceForPapers(paperIds, analyses, preferredFindings = []) {
  const results = [];
  const seen = new Set();

  paperIds.forEach(pId => {
    const paper = analyses.find(a => a.paper_id === pId);
    if (!paper || !Array.isArray(paper.evidence)) return;

    // Sort so limitation / problem / future evidence for that gap comes first
    const sorted = [...paper.evidence].sort((a, b) => {
      const aPref = preferredFindings.some(f => (a.finding || '').toLowerCase().includes(f)) ? 1 : 0;
      const bPref = preferredFindings.some(f => (b.finding || '').toLowerCase().includes(f)) ? 1 : 0;
      return bPref - aPref;
    });

    sorted.forEach(ev => {
      if (!ev || !isReportedValue(ev.excerpt)) return;
      const key = `${pId}::${ev.excerpt.slice(0, 60)}`;
      if (seen.has(key)) return;
      seen.add(key);

      const validPage = paper.document_status === 'full_text' && typeof ev.page === 'number' && ev.page > 0
        ? ev.page
        : null;

      results.push({
        paper_id: pId,
        paper_title: paper.title,
        finding: ev.finding || 'Supporting Claim',
        excerpt: ev.excerpt.trim(),
        page: validPage,
        section: ev.section || (validPage ? 'Body' : 'Abstract'),
        evidence_status: ev.evidence_status || (validPage ? 'verbatim_full_text' : 'verbatim_abstract'),
        verification_status: validPage ? 'verified' : 'abstract_only'
      });
    });
  });

  return results.slice(0, 6);
}

/**
 * Grades evidence strength strictly based on verified paper support and full-text availability.
 */
export function gradeEvidenceStrength({ supportingPaperIds = [], supportingEvidence = [], analyses = [], isSpeculative = false }) {
  if (isSpeculative) {
    return {
      code: 'speculative',
      label: 'Speculative opportunity',
      rationale: `Speculative opportunity synthesized from future-work trajectories or cross-paper gaps across ${supportingPaperIds.length} paper(s); not directly established as an empirical failure in the current corpus.`
    };
  }

  const distinctPapers = Array.from(new Set(supportingPaperIds));
  const fullTextSupport = distinctPapers.filter(id => {
    const p = analyses.find(a => a.paper_id === id);
    return p && p.document_status === 'full_text';
  }).length;
  const fullTextEvidenceCount = supportingEvidence.filter(e => e.page !== null && e.page > 0).length;

  if (distinctPapers.length >= 3 && fullTextSupport >= 2 && fullTextEvidenceCount >= 2) {
    return {
      code: 'strong',
      label: 'Strong evidence',
      rationale: `Supported by ${distinctPapers.length} distinct papers (${fullTextSupport} full-text PDF(s)) with ${fullTextEvidenceCount} page-grounded verbatim evidence excerpt(s).`
    };
  }

  if (distinctPapers.length >= 2 && (fullTextSupport >= 1 || supportingEvidence.length >= 2)) {
    return {
      code: 'moderate',
      label: 'Moderate evidence',
      rationale: `Supported by ${distinctPapers.length} papers (${fullTextSupport} full-text, ${distinctPapers.length - fullTextSupport} abstract-only) with ${supportingEvidence.length} verbatim excerpt(s). Additional full-text confirmation across more studies would raise confidence to Strong.`
    };
  }

  return {
    code: 'weak',
    label: 'Limited evidence',
    rationale: `Observed in ${distinctPapers.length} paper(s) (${fullTextSupport} full-text) with ${supportingEvidence.length} verbatim excerpt(s); independent cross-study replication is needed.`
  };
}

/**
 * Formulates evidence-grounded candidate research gaps and clearly labeled speculative opportunities.
 * Never fabricates generic domain gaps or derives gaps from "Not reported" fields.
 */
export function formulateCandidateGaps(clusters = [], normalizedInput = null, analyses = [], researchTopic = 'Research Corpus', tensions = []) {
  const normalized = normalizedInput || normalizeObservations(analyses);
  if (!analyses || analyses.length === 0) return [];

  const gaps = [];
  let gapCounter = 1;

  // 1. Evidence-Supported Gaps from clusters that have real reported limitations
  const limitationClusters = (clusters || []).filter(c => c.matchedLimitations && c.matchedLimitations.length > 0);

  limitationClusters.slice(0, 4).forEach(cluster => {
    const supportingPaperIds = Array.from(new Set(cluster.matchedLimitations.map(l => l.paper_id)));
    const relevantLimitations = cluster.matchedLimitations.map(l => `${l.paper_id}: ${l.text}`);
    const supportingPapers = supportingPaperIds
      .map(id => analyses.find(a => a.paper_id === id))
      .filter(Boolean)
      .map(a => ({
        paper_id: a.paper_id,
        title: a.title,
        authors: a.authors || [],
        year: a.year || null
      }));

    const supportingEvidence = collectSupportingEvidenceForPapers(
      supportingPaperIds,
      analyses,
      ['limitation', 'problem', 'result', 'future']
    );

    const relatedFuture = (cluster.matchedFutureWork || []).map(f => f.text);
    const algsInvolved = Array.from(new Set(
      supportingPaperIds.flatMap(id => normalized.paperAlgorithmMap[id] || [])
    ));
    const datasetsInvolved = Array.from(new Set(
      supportingPaperIds.flatMap(id => normalized.paperDatasetMap[id] || [])
    ));

    const firstLim = cluster.matchedLimitations[0].text;
    const strength = gradeEvidenceStrength({
      supportingPaperIds,
      supportingEvidence,
      analyses,
      isSpeculative: false
    });

    const gapId = `gap-${String(gapCounter++).padStart(3, '0')}`;
    const focusKeyword = extractKeywords(firstLim).slice(0, 3).join(', ') || cluster.theme;

    gaps.push({
      gap_id: gapId,
      title: `Unresolved ${cluster.name} in ${researchTopic}`,
      gap_type: cluster.theme,
      is_speculative: false,
      gap_category: 'Evidence-Supported Gap',
      domain: researchTopic,
      description: `Across ${supportingPaperIds.length} of ${analyses.length} analyzed paper(s), authors explicitly report constraints in ${cluster.theme.toLowerCase()}—specifically: "${firstLim}".`,
      summary: `Across ${supportingPaperIds.length} of ${analyses.length} analyzed paper(s), authors explicitly report constraints in ${cluster.theme.toLowerCase()}—specifically: "${firstLim}".`,
      cluster_ref: cluster.id,
      recurring_frequency: `${supportingPaperIds.length} of ${analyses.length} paper(s) report related limitations`,
      supporting_papers: supportingPapers,
      affected_paper_ids: supportingPaperIds,
      supporting_evidence: supportingEvidence,
      contradictory_evidence: [],
      relevant_limitations: relevantLimitations,
      why_gap_exists: `Existing studies (${supportingPaperIds.join(', ')})${algsInvolved.length ? ` using ${algsInvolved.slice(0, 3).join(', ')}` : ''} encounter unresolved bottlenecks around ${focusKeyword}, and have not yet validated a general solution across${datasetsInvolved.length ? ` ${datasetsInvolved.slice(0, 3).join(', ')}` : ' controlled comparative settings'}.`,
      research_significance: `Addressing this limitation directly resolves an explicitly documented barrier affecting ${supportingPaperIds.length} ${supportingPaperIds.length === 1 ? 'study' : 'studies'} in ${researchTopic}, improving empirical reliability and practical applicability.`,
      methodological_weakness: relevantLimitations.join(' | '),
      evidence_strength: strength.code,
      evidence_strength_label: strength.label,
      evidence_strength_rationale: strength.rationale,
      potential_methodology: relatedFuture.length > 0
        ? `Design a controlled comparative study directly building on author recommendations (${relatedFuture[0]}) and benchmarking against current baselines${algsInvolved.length ? ` (${algsInvolved.slice(0, 2).join(', ')})` : ''}.`
        : `Conduct systematic ablation experiments isolating ${focusKeyword} across standardized evaluation splits and comparing against existing approaches reported in ${supportingPaperIds.join(', ')}.`,
      future_research_direction: relatedFuture.length > 0
        ? relatedFuture[0]
        : `Investigate targeted mechanisms to mitigate ${firstLim}`,
      future_directions: relatedFuture.length > 0
        ? relatedFuture.slice(0, 3)
        : [`Investigate targeted mechanisms to mitigate ${firstLim}`],
      proposed_research_questions: [
        `RQ${gapCounter - 1}: How can ${researchTopic} approaches overcome the limitation reported in ${supportingPaperIds[0]} ("${firstLim.slice(0, 120)}") without degrading baseline performance?`
      ],
      proposed_objectives: [
        `RO${gapCounter - 1}: Formulate and empirically evaluate a mitigation strategy addressing ${cluster.theme.toLowerCase()} across reproducible benchmarks.`
      ]
    });
  });

  // 2. Evidence-Supported Gap from Empirical Tensions (if tensions identify evaluation/methodological divergence not already covered)
  const evalTension = (tensions || []).find(t => t.id === 'tension-evaluation-incomparability' || t.id === 'tension-contextual-disagreement');
  if (evalTension && analyses.length >= 2 && gaps.length < 4) {
    const pIds = evalTension.paperIds || analyses.slice(0, 2).map(a => a.paper_id);
    const supportingPapers = pIds
      .map(id => analyses.find(a => a.paper_id === id))
      .filter(Boolean)
      .map(a => ({ paper_id: a.paper_id, title: a.title, authors: a.authors || [], year: a.year || null }));
    const supportingEvidence = collectSupportingEvidenceForPapers(pIds, analyses, ['result', 'method', 'limitation']);
    const strength = gradeEvidenceStrength({
      supportingPaperIds: pIds,
      supportingEvidence,
      analyses,
      isSpeculative: false
    });
    const gapId = `gap-${String(gapCounter++).padStart(3, '0')}`;
    gaps.push({
      gap_id: gapId,
      title: `Cross-Study Evaluation & Protocol Standardization Gap in ${researchTopic}`,
      gap_type: 'Comparative / Evaluation',
      is_speculative: false,
      gap_category: 'Evidence-Supported Gap',
      domain: researchTopic,
      description: `${evalTension.observationA} However, ${evalTension.observationB}`,
      summary: `${evalTension.observationA} However, ${evalTension.observationB}`,
      cluster_ref: 'cross-paper-tension',
      recurring_frequency: `${pIds.length} of ${analyses.length} paper(s) exhibit evaluation divergence`,
      supporting_papers: supportingPapers,
      affected_paper_ids: pIds,
      supporting_evidence: supportingEvidence,
      contradictory_evidence: [],
      relevant_limitations: [evalTension.implication],
      why_gap_exists: evalTension.implication,
      research_significance: `Unified evaluation protocols are essential so future researchers on ${researchTopic} can establish reliable, reproducible state-of-the-art comparisons.`,
      methodological_weakness: `${evalTension.observationA} ${evalTension.observationB}`,
      evidence_strength: strength.code,
      evidence_strength_label: strength.label,
      evidence_strength_rationale: strength.rationale,
      potential_methodology: `Establish a unified multi-dataset evaluation suite applying consistent metrics (${normalized.metrics.slice(0, 3).join(', ') || 'standardized task metrics'}) across the competing methods reported in ${pIds.join(', ')}.`,
      future_research_direction: 'Standardize shared evaluation protocols and unified benchmarks across competing approaches.',
      future_directions: ['Standardize shared evaluation protocols and unified benchmarks across competing approaches.'],
      proposed_research_questions: [
        `RQ${gapCounter - 1}: Under a standardized benchmark and metric suite, how do the competing methods in ${pIds.join(' and ')} compare quantitatively?`
      ],
      proposed_objectives: [
        `RO${gapCounter - 1}: Construct a reproducible head-to-head evaluation benchmark unifying the datasets and metrics identified in the corpus.`
      ]
    });
  }

  // 3. Clearly demarcated Speculative Opportunity from reported future_work or problem framing (never from missing/unreported fields)
  if (normalized.futureWork.length > 0 || (normalized.problemStatements.length > 0 && gaps.length === 0)) {
    const sourceItems = normalized.futureWork.length > 0 ? normalized.futureWork : normalized.problemStatements;
    const pIds = Array.from(new Set(sourceItems.map(i => i.paper_id))).slice(0, 3);
    const supportingPapers = pIds
      .map(id => analyses.find(a => a.paper_id === id))
      .filter(Boolean)
      .map(a => ({ paper_id: a.paper_id, title: a.title, authors: a.authors || [], year: a.year || null }));
    const supportingEvidence = collectSupportingEvidenceForPapers(pIds, analyses, ['future', 'problem', 'objective']);
    const strength = gradeEvidenceStrength({
      supportingPaperIds: pIds,
      supportingEvidence,
      analyses,
      isSpeculative: true
    });
    const gapId = `gap-${String(gapCounter++).padStart(3, '0')}`;
    const leadItem = sourceItems[0];
    const leadKeywords = extractKeywords(leadItem.text).slice(0, 3);
    const titleFocus = leadKeywords.length >= 2
      ? `${leadKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' & ')} (${researchTopic})`
      : researchTopic;

    gaps.push({
      gap_id: gapId,
      title: `Exploratory Future Direction: ${titleFocus}`,
      gap_type: 'Future Trajectory / Exploratory',
      is_speculative: true,
      gap_category: 'Speculative Opportunity',
      domain: researchTopic,
      description: `Authors in ${pIds.join(', ')} suggest exploring future avenues beyond current experiments (e.g., "${leadItem.text}"). Because empirical validation has not been conducted yet, this is categorized as a speculative opportunity rather than an empirically proven flaw.`,
      summary: `Authors in ${pIds.join(', ')} suggest exploring future avenues beyond current experiments ("${leadItem.text}").`,
      cluster_ref: 'future-work-synthesis',
      recurring_frequency: `${pIds.length} paper(s) highlight future directions`,
      supporting_papers: supportingPapers,
      affected_paper_ids: pIds,
      supporting_evidence: supportingEvidence,
      contradictory_evidence: [],
      relevant_limitations: sourceItems.slice(0, 3).map(s => `${s.paper_id}: ${s.text}`),
      why_gap_exists: `Current papers focus on foundational baselines and defer this direction ("${leadItem.text}") to future investigation.`,
      research_significance: `Pursuing author-proposed future directions opens novel methodological extensions in ${researchTopic}.`,
      methodological_weakness: 'Deferred to future work by original authors; empirical feasibility remains untested in the corpus.',
      evidence_strength: strength.code,
      evidence_strength_label: strength.label,
      evidence_strength_rationale: strength.rationale,
      potential_methodology: `Pilot an exploratory prototype testing "${leadItem.text}" and measure incremental improvements against the baselines in ${pIds.join(', ')}.`,
      future_research_direction: leadItem.text,
      future_directions: sourceItems.slice(0, 3).map(s => s.text),
      proposed_research_questions: [
        `RQ${gapCounter - 1}: To what extent does pursuing the future direction noted by ${leadItem.paper_id} improve outcomes over current ${researchTopic} baselines?`
      ],
      proposed_objectives: [
        `RO${gapCounter - 1}: Prototype and evaluate an exploratory extension guided by the future work statements in ${pIds.join(', ')}.`
      ]
    });
  }

  return gaps;
}

/**
 * Compiles Output 3: The Comprehensive Final Research Gap Report (schema_version 3.0.0)
 */
export function buildFinalGapReport(output2Data, gaps = [], clusters = [], tensions = [], normalizedInput = null, preferences = {}) {
  const timestamp = new Date().toISOString();
  const projectId = output2Data.project_id || `rs-proj-${Date.now()}`;
  const topic = output2Data.research_topic || 'Academic Research Corpus';
  const question = output2Data.research_question || `What are the evidence-supported research gaps in ${topic}?`;
  const analyses = output2Data.analyses || [];
  const normalized = normalizedInput || normalizeObservations(analyses);

  const years = analyses.map(a => a.year).filter(y => typeof y === 'number' && y > 1900);
  const yearSpan = years.length > 0 ? `${Math.min(...years)} – ${Math.max(...years)}` : 'Not reported';

  const domainsRepresented = Array.from(
    new Set(normalized.datasets.map(d => d.domain).filter(isReportedValue))
  );

  const coverage = {
    totalPapers: analyses.length,
    fullTextCount: analyses.filter(a => a.document_status === 'full_text').length,
    abstractOnlyCount: analyses.filter(a => a.document_status !== 'full_text').length,
    totalEvidenceClaims: normalized.evidenceBank.length,
    publicationYearSpan: yearSpan,
    domainsRepresented: domainsRepresented.length > 0 ? domainsRepresented : ['Derived from corpus metadata']
  };

  const comparativeFindings = compareCorpusDimensions(analyses, normalized, clusters, tensions);
  const evidenceSufficiency = assessEvidenceSufficiency(analyses, normalized, gaps);

  const evidenceSupportedGaps = gaps.filter(g => !g.is_speculative);
  const speculativeOpportunities = gaps.filter(g => g.is_speculative);

  // Deduplicated supporting evidence across all formulated gaps
  const supportingEvidenceLedger = [];
  const seenLedgerKeys = new Set();
  gaps.forEach(g => {
    (g.supporting_evidence || []).forEach(ev => {
      const k = `${ev.paper_id}::${ev.excerpt.slice(0, 60)}`;
      if (!seenLedgerKeys.has(k)) {
        seenLedgerKeys.add(k);
        supportingEvidenceLedger.push({
          ...ev,
          linked_gap_ids: [g.gap_id]
        });
      }
    });
  });

  const evidenceStrengthRatings = gaps.map(g => ({
    gap_id: g.gap_id,
    title: g.title,
    rating: g.evidence_strength_label || g.evidence_strength,
    code: g.evidence_strength,
    is_speculative: Boolean(g.is_speculative),
    supporting_paper_count: (g.affected_paper_ids || g.supporting_papers || []).length,
    full_text_evidence_count: (g.supporting_evidence || []).filter(e => e.page !== null && e.page > 0).length,
    rationale: g.evidence_strength_rationale
  }));

  const executiveSummary = !evidenceSufficiency.is_sufficient
    ? `This Research Gap Analysis examined ${coverage.totalPapers} paper(s) on "${topic}" (${coverage.fullTextCount} full-text PDFs, ${coverage.abstractOnlyCount} abstract-only). ${evidenceSufficiency.message} In accordance with strict anti-fabrication rules, missing or unreported fields were excluded rather than treated as proof of domain gaps.`
    : `This evidence-grounded Research Gap Analysis synthesizes findings across ${coverage.totalPapers} paper(s) investigating "${topic}" (${coverage.fullTextCount} full-text PDFs, ${coverage.abstractOnlyCount} abstract-only; ${coverage.totalEvidenceClaims} verified verbatim claims). Cross-paper comparison identified ${evidenceSupportedGaps.length} evidence-supported research gap(s) and ${speculativeOpportunities.length} clearly demarcated speculative opportunity/opportunities derived strictly from reported methodologies, results, limitations, and future work.`;

  const overallConclusion = !evidenceSufficiency.is_sufficient
    ? `Current corpus evidence (${coverage.totalPapers} paper(s), ${coverage.fullTextCount} full-text) is insufficient to confirm broad cross-study research gaps in "${topic}". ${evidenceSufficiency.recommendation}`
    : `Synthesis of the ${coverage.totalPapers} analyzed papers on "${topic}" indicates that while studies report promising outcomes (${normalized.algorithms.slice(0, 3).join(', ') || 'domain-specific methodologies'}), verified limitations highlight ${evidenceSupportedGaps.map(g => g.title).slice(0, 2).join('; ') || 'methodological and evaluation constraints'}. Addressing the prioritized research questions with standardized comparative baselines represents the clearest grounded path forward.`;

  const researchQuestions = gaps.flatMap(g => g.proposed_research_questions || []);
  const objectives = gaps.flatMap(g => g.proposed_objectives || []);
  const proposedFutureMethodology = gaps.map(g => ({
    gap_id: g.gap_id,
    gap_title: g.title,
    potential_methodology: g.potential_methodology
  }));

  const papersAnalysed = analyses.map(a => ({
    paper_id: a.paper_id,
    title: a.title,
    authors: a.authors || [],
    year: a.year || null,
    doi: a.doi || null,
    document_status: a.document_status,
    analysis_scope_label: a.analysis_scope_label || (a.document_status === 'full_text' ? 'Full-Text PDF' : 'Abstract-Only'),
    objective: a.objective || 'Not reported',
    methodology_summary: a.methodology || 'Not reported',
    key_algorithms: cleanArrayValues(a.algorithms),
    primary_dataset: (a.dataset && isReportedValue(a.dataset.name)) ? a.dataset.name : (cleanArrayValues(a.datasets)[0] || 'Not reported'),
    evaluation_metrics: cleanArrayValues(a.evaluation_metrics || a.metrics),
    reported_performance: isReportedValue(a.reported_performance) ? a.reported_performance : 'Not reported',
    evidence_count: Array.isArray(a.evidence) ? a.evidence.length : 0,
    reported_limitations_count: cleanArrayValues(a.limitations).length
  }));

  const report = {
    schema_version: '3.0.0',
    module_source: 'ResearchScholar AI - Module 3: Research Gap Identification',
    project_id: projectId,
    report_timestamp: timestamp,
    report_title: `Evidence-Grounded Research Gap Analysis: ${topic}`,
    research_topic: topic,
    research_question: question,
    target_venue: preferences.targetVenue || 'Peer-Reviewed Academic Synthesis Standard',
    report_preferences: preferences,

    // Explicit Output 3 Required Top-Level Keys
    evidence_sufficiency: evidenceSufficiency,
    papers_analysed: papersAnalysed,
    comparative_findings: comparativeFindings,
    identified_research_gaps: gaps,
    supporting_evidence: supportingEvidenceLedger,
    evidence_strength_ratings: evidenceStrengthRatings,
    research_questions: researchQuestions,
    objectives: objectives,
    proposed_future_methodology: proposedFutureMethodology,
    overall_conclusion: overallConclusion,

    // Backward-compatible & Report Export Fields
    executive_summary: executiveSummary,
    research_scope: {
      primary_inquiry: question,
      thematic_focus: topic,
      corpus_boundaries: `Analysis strictly constrained to the ${coverage.totalPapers} validated records imported from Module 2 Output 2.`,
      anti_hallucination_guarantee: 'Every evidence-supported gap links to real analyzed paper IDs and verified excerpts. Missing fields ("Not reported") are never treated as proof of a research gap, and speculative opportunities are explicitly separated from evidence-supported gaps.'
    },
    corpus_coverage: coverage,
    literature_synthesis: {
      consensus_findings: output2Data.cross_paper_synthesis?.synthesized_consensus ||
        `Cross-paper review of ${coverage.totalPapers} papers examining ${topic}.`,
      primary_algorithmic_paradigms: normalized.algorithms,
      dominant_evaluation_metrics: normalized.metrics,
      datasets_surveyed: normalized.datasets
    },
    paper_comparison_matrix: papersAnalysed,
    observation_clusters: clusters.map(c => ({
      cluster_id: c.id,
      theme: c.theme,
      name: c.name,
      description: c.description,
      limitation_count: c.matchedLimitations.length,
      future_work_count: c.matchedFutureWork.length,
      affected_paper_ids: c.paperIds
    })),
    cross_paper_tensions: tensions,
    candidate_research_gaps: gaps,
    gap_breakdown: {
      total_gaps: gaps.length,
      evidence_supported_count: evidenceSupportedGaps.length,
      speculative_opportunities_count: speculativeOpportunities.length
    },
    future_research_roadmap: {
      research_directions: gaps.flatMap(g => g.future_directions || [g.future_research_direction].filter(Boolean)),
      proposed_research_questions: researchQuestions,
      proposed_objectives: objectives,
      proposed_methodologies: proposedFutureMethodology
    },
    review_limitations: {
      epistemic_boundary: `This synthesis is strictly bounded to the ${coverage.totalPapers} paper(s) analyzed in Module 2. It makes no claims about uninspected literature.`,
      full_text_availability: `${coverage.fullTextCount} of ${coverage.totalPapers} papers had full-text PDFs (${coverage.abstractOnlyCount} relied on abstract metadata or failed full-text extraction).`,
      distinction_policy: 'Evidence-supported gaps, speculative opportunities, and in-house statistical TF-IDF comparative synthesis are explicitly separated; unreported fields are never counted as gaps.'
    },
    conclusion: overallConclusion,
    references: analyses.map((a, idx) => ({
      index: idx + 1,
      paper_id: a.paper_id,
      citation_text: `${(a.authors && a.authors.length ? a.authors : ['Unknown Author']).join(', ')} (${a.year || 'n.d.'}). ${a.title}. ${a.source || 'Academic Repository'}.`,
      doi: a.doi || null,
      source_url: a.source_url || (a.doi ? `https://doi.org/${a.doi}` : null),
      document_status: a.document_status,
      verified_evidence_citations: Array.isArray(a.evidence) ? a.evidence.length : 0
    }))
  };

  return report;
}

/**
 * Sample Output 2 Demo Fixture (clearly labeled for optional 1-click demo only)
 */
export const SAMPLE_OUTPUT_2 = {
  schema_version: '2.0.0',
  module_source: 'ResearchScholar AI - Module 2: Demo Fixture',
  target_module: 'ResearchScholar AI - Module 3: Research Gap Identification',
  project_id: 'rs-demo-output2',
  research_topic: 'Attention Mechanisms in Deep Learning',
  research_question: 'How do linear attention mechanisms scale context length without quadratic complexity?',
  analysis_timestamp: '2026-11-12T04:57:25.086Z',
  analysis_metadata: {
    pipeline_version: '2.1.0',
    total_papers_analyzed: 3,
    full_text_count: 2,
    abstract_only_count: 1,
    evidence_claim_count: 6
  },
  analyses: [
    {
      paper_id: 'demo-paper-001',
      doi: '10.1109/tkde.2021.3126456',
      title: 'A General Survey on Attention Mechanisms in Deep Learning',
      authors: ['Gianni Brauwers', 'Flavius Frasincar'],
      year: 2021,
      source: 'OpenAlex',
      source_url: 'https://doi.org/10.1109/tkde.2021.3126456',
      document_status: 'full_text',
      analysis_status: 'complete',
      objective: 'Survey major attention architectures and taxonomy across NLP and vision tasks.',
      problem_statement: 'Standard dot-product self-attention incurs O(N^2) memory and compute scaling with sequence length.',
      methodology: 'Systematic comparative taxonomy of additive, multiplicative, and self-attention variants.',
      algorithms: ['Self-Attention / Multi-Head Attention'],
      dataset: { name: 'Not reported', size: 'Not reported', domain: 'Computer Science' },
      metrics: ['Accuracy', 'Latency / FLOPs'],
      reported_results: ['Synthesizes benchmark comparisons reported across prior attention formulations.'],
      reported_performance: 'Not reported',
      limitations: ['Standard self-attention exhibits quadratic computational and memory overhead for long sequences.'],
      future_work: ['Explore sparse and linear-complexity kernel approximations for long-context modeling.'],
      conclusion: 'Attention improves feature selection while motivating lower-complexity variants.',
      evidence: [
        {
          paper_id: 'demo-paper-001',
          finding: 'Limitations',
          page: 12,
          section: 'Limitations & Future Work',
          excerpt: 'Standard dot-product self-attention incurs quadratic memory complexity with sequence length.',
          evidence_status: 'verbatim_full_text',
          verification_status: 'verified'
        }
      ]
    },
    {
      paper_id: 'demo-paper-002',
      doi: null,
      title: 'Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention',
      authors: ['Angelos Katharopoulos', 'Apoorv Vyas', 'Nikolaos Pappas', 'Francois Fleuret'],
      year: 2020,
      source: 'arXiv',
      source_url: 'https://arxiv.org/abs/2006.16236',
      document_status: 'full_text',
      analysis_status: 'complete',
      objective: 'Express self-attention as a linear dot-product of kernel feature maps to achieve O(N) time and memory complexity.',
      problem_statement: 'Quadratic complexity limits Transformer training and inference on long sequences.',
      methodology: 'Kernelized causal linear attention formulated as a causal recurrent neural network.',
      algorithms: ['Linear Attention', 'Transformer'],
      dataset: { name: 'CIFAR-10 / Image Generation', size: 'Not reported', domain: 'Computer Vision & Sequence Modeling' },
      metrics: ['Perplexity', 'Inference Latency'],
      reported_results: ['Matches standard softmax transformer perplexity on autoregressive tasks with up to 4000x faster autoregressive inference on very long sequences.'],
      reported_performance: 'Linear O(N) scaling with comparable perplexity on CIFAR-10 and speech recognition.',
      limitations: ['Kernel approximation choice (elu+1) can underperform full softmax attention on associative recall tasks.'],
      future_work: ['Investigate learnable positive feature maps tailored to causal autoregressive sequences.'],
      conclusion: 'Linearized attention turns Transformers into fast RNNs during inference.',
      evidence: [
        {
          paper_id: 'demo-paper-002',
          finding: 'Experimental Results',
          page: 6,
          section: 'Experiments',
          excerpt: 'Linear Transformer achieves linear O(N) complexity and orders-of-magnitude faster autoregressive inference on long sequences.',
          evidence_status: 'verbatim_full_text',
          verification_status: 'verified'
        }
      ]
    },
    {
      paper_id: 'demo-paper-003',
      doi: null,
      title: 'Attention Mechanisms on Embedded Sensor Streams',
      authors: ['Demo Abstract Record'],
      year: 2024,
      source: 'Semantic Scholar',
      source_url: 'https://www.semanticscholar.org/',
      document_status: 'abstract_only',
      analysis_status: 'abstract_only',
      objective: 'Evaluate compact attention heads for real-time time-series telemetry.',
      problem_statement: 'High memory footprint restricts deployment of multi-head attention on embedded hardware.',
      methodology: 'Empirical ablation of compact attention layers on sensor streams (abstract-only summary).',
      algorithms: ['Self-Attention / Multi-Head Attention'],
      dataset: { name: 'Not reported', size: 'Not reported', domain: 'Embedded Systems' },
      metrics: ['Not reported'],
      reported_results: ['Not reported'],
      reported_performance: 'Not reported',
      limitations: ['High memory footprint and lack of out-of-distribution robustness tests on noisy sensor hardware.'],
      future_work: ['Standardize noise-shift benchmarks for compact attention models.'],
      conclusion: 'Not reported',
      evidence: [
        {
          paper_id: 'demo-paper-003',
          finding: 'Limitations',
          page: null,
          section: 'Abstract',
          excerpt: 'High memory footprint restricts deployment of multi-head attention on embedded hardware without robustness guarantees.',
          evidence_status: 'verbatim_abstract',
          verification_status: 'abstract_only'
        }
      ]
    }
  ]
};

/**
 * Generates formatted Word DOCX-compatible HTML Blob
 */
export function generateDocxBlob(report) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const formatPage = (ev) => (ev && typeof ev.page === 'number' && ev.page > 0 ? `Page ${ev.page}` : 'Abstract / Unpaginated');

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${esc(report.report_title)}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 1in; }
        h1 { font-size: 20pt; color: #123D32; border-bottom: 2pt solid #123D32; padding-bottom: 6pt; margin-top: 18pt; }
        h2 { font-size: 14pt; color: #176B50; margin-top: 14pt; border-bottom: 1pt solid #ddd; padding-bottom: 3pt; }
        h3 { font-size: 12pt; color: #123D32; margin-top: 10pt; }
        p { margin-bottom: 8pt; text-align: justify; }
        .meta-box { background-color: #E8F1EA; border: 1pt solid #D7E8DC; padding: 10pt; margin-bottom: 15pt; }
        .gap-box { border: 1pt solid #176B50; padding: 10pt; margin-bottom: 12pt; background-color: #F8FAF9; }
        .quote { font-style: italic; color: #333; margin-left: 15pt; border-left: 2pt solid #176B50; padding-left: 8pt; }
        table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }
        th, td { border: 1pt solid #bbb; padding: 6pt; text-align: left; }
        th { background-color: #123D32; color: #fff; }
      </style>
    </head>
    <body>
      <h1>${esc(report.report_title)}</h1>
      <div class="meta-box">
        <p><strong>Project ID:</strong> ${esc(report.project_id)} | <strong>Date:</strong> ${new Date(report.report_timestamp).toLocaleDateString()}</p>
        <p><strong>Research Topic:</strong> ${esc(report.research_topic)}</p>
        <p><strong>Corpus Coverage:</strong> ${report.corpus_coverage.totalPapers} Papers analyzed (${report.corpus_coverage.fullTextCount} full-text, ${report.corpus_coverage.abstractOnlyCount} abstract-only) | ${report.corpus_coverage.totalEvidenceClaims} Grounded Citations</p>
        <p><strong>Evidence Sufficiency:</strong> ${esc(report.evidence_sufficiency?.sufficiency_level?.toUpperCase())} &mdash; ${esc(report.evidence_sufficiency?.message)}</p>
      </div>

      <h2>1. Executive Summary</h2>
      <p>${esc(report.executive_summary)}</p>

      <h2>2. Cross-Paper Comparative Synthesis</h2>
      <p><strong>Objectives:</strong> ${esc(report.comparative_findings?.objectives_comparison?.summary)}</p>
      <p><strong>Methodologies &amp; Algorithms:</strong> ${esc(report.comparative_findings?.methodologies_and_algorithms_comparison?.summary)}</p>
      <p><strong>Datasets:</strong> ${esc(report.comparative_findings?.datasets_comparison?.summary)}</p>
      <p><strong>Evaluation Metrics:</strong> ${esc(report.comparative_findings?.evaluation_metrics_comparison?.summary)}</p>
      <p><strong>Reported Results:</strong> ${esc(report.comparative_findings?.reported_results_comparison?.summary)}</p>

      <h2>3. Identified Research Gaps &amp; Speculative Opportunities (${report.candidate_research_gaps.length})</h2>
      ${report.candidate_research_gaps.length === 0 ? `<p><em>No evidence-supported gaps could be formulated because ${esc(report.evidence_sufficiency?.message)}</em></p>` : report.candidate_research_gaps.map(g => `
        <div class="gap-box">
          <h3>[${esc(g.gap_id.toUpperCase())}] ${esc(g.title)}</h3>
          <p><strong>Category:</strong> ${esc(g.gap_category)} (${esc(g.gap_type)}) | <strong>Evidence Strength:</strong> ${esc(g.evidence_strength_label || g.evidence_strength)}</p>
          <p><strong>Rating Rationale:</strong> ${esc(g.evidence_strength_rationale)}</p>
          <p>${esc(g.description || g.summary)}</p>
          <p><strong>Why Gap Exists:</strong> ${esc(g.why_gap_exists)}</p>
          <p><strong>Research Significance:</strong> ${esc(g.research_significance)}</p>
          <p><strong>Supporting Papers:</strong> ${(g.supporting_papers || []).map(p => esc(p.paper_id)).join(', ') || 'None'}</p>
          <p><strong>Supporting Evidence Excerpts:</strong></p>
          ${(g.supporting_evidence || []).map(e => `
            <p class="quote">"${esc(e.excerpt)}" &mdash; <strong>${esc(e.paper_id)}</strong> (${esc(e.paper_title)}), ${formatPage(e)}, ${esc(e.section)}</p>
          `).join('')}
          <p><strong>Potential Methodology:</strong> ${esc(g.potential_methodology)}</p>
          <p><strong>Target Research Question:</strong> ${(g.proposed_research_questions || []).map(esc).join('; ')}</p>
          <p><strong>Suggested Objective:</strong> ${(g.proposed_objectives || []).map(esc).join('; ')}</p>
        </div>
      `).join('')}

      <h2>4. Overall Conclusion</h2>
      <p>${esc(report.overall_conclusion || report.conclusion)}</p>

      <h2>5. References &amp; Empirical Traceability</h2>
      <ol>
        ${report.references.map(r => `
          <li>${esc(r.citation_text)} [${r.verified_evidence_citations} verified citations | ${esc(r.document_status)}] ${r.doi ? `DOI: ${esc(r.doi)}` : ''}</li>
        `).join('')}
      </ol>
    </body>
    </html>
  `;
  return new Blob(['\ufeff', content], { type: 'application/msword' });
}

/**
 * Generates formatted Markdown Report
 */
export function generateMarkdownReport(report) {
  const formatPage = (ev) => (ev && typeof ev.page === 'number' && ev.page > 0 ? `Page ${ev.page}` : 'Abstract / Unpaginated');
  const ratio = report.corpus_coverage.totalPapers > 0
    ? Math.round((report.corpus_coverage.fullTextCount / report.corpus_coverage.totalPapers) * 100)
    : 0;

  let md = `# ${report.report_title}\n\n`;
  md += `**Project ID:** \`${report.project_id}\`  \n`;
  md += `**Research Topic:** ${report.research_topic}  \n`;
  md += `**Generated:** ${report.report_timestamp}  \n`;
  md += `**Evidence Sufficiency:** **${(report.evidence_sufficiency?.sufficiency_level || 'unknown').toUpperCase()}** — ${report.evidence_sufficiency?.message || ''}\n\n`;
  md += `---\n\n`;

  md += `## 1. Executive Summary\n\n${report.executive_summary}\n\n`;

  md += `## 2. Corpus Coverage & Epistemic Policy\n\n`;
  md += `- Total Analyzed Papers: **${report.corpus_coverage.totalPapers}**\n`;
  md += `- Full-Text PDFs Analyzed: **${report.corpus_coverage.fullTextCount}** (${ratio}%)\n`;
  md += `- Abstract-Only / Fallback Papers: **${report.corpus_coverage.abstractOnlyCount}**\n`;
  md += `- Grounded Verbatim Claims: **${report.corpus_coverage.totalEvidenceClaims}**\n`;
  md += `- Publication Year Span: **${report.corpus_coverage.publicationYearSpan}**\n`;
  md += `- Grounding Policy: ${report.research_scope.anti_hallucination_guarantee}\n\n`;

  md += `## 3. Comparative Cross-Paper Findings\n\n`;
  const cf = report.comparative_findings || {};
  md += `- **Research Objectives:** ${cf.objectives_comparison?.summary || 'Not reported'}\n`;
  md += `- **Methodologies & Algorithms:** ${cf.methodologies_and_algorithms_comparison?.summary || 'Not reported'}\n`;
  md += `- **Datasets:** ${cf.datasets_comparison?.summary || 'Not reported'}\n`;
  md += `- **Evaluation Metrics:** ${cf.evaluation_metrics_comparison?.summary || 'Not reported'}\n`;
  md += `- **Reported Results:** ${cf.reported_results_comparison?.summary || 'Not reported'}\n`;
  md += `- **Contradictions / Tensions:** ${report.cross_paper_tensions?.length || 0} cross-paper tension(s) identified\n\n`;

  md += `## 4. Identified Research Gaps & Speculative Opportunities\n\n`;
  if (!report.candidate_research_gaps || report.candidate_research_gaps.length === 0) {
    md += `> **Insufficient Evidence:** ${report.evidence_sufficiency?.message || 'More research papers are needed.'}\n\n`;
  } else {
    report.candidate_research_gaps.forEach((g, idx) => {
      md += `### 4.${idx + 1} [${g.gap_id.toUpperCase()}] ${g.title}\n\n`;
      md += `- **Classification:** ${g.gap_category || (g.is_speculative ? 'Speculative Opportunity' : 'Evidence-Supported Gap')} (${g.gap_type})\n`;
      md += `- **Evidence Strength:** **${g.evidence_strength_label || g.evidence_strength}**\n`;
      md += `- **Rating Rationale:** ${g.evidence_strength_rationale}\n`;
      md += `- **Supporting Papers:** ${(g.supporting_papers || []).map(p => `${p.paper_id} (${p.title})`).join('; ') || 'None'}\n\n`;
      md += `**Description:**  \n${g.description || g.summary}\n\n`;
      md += `**Why This Gap Exists:**  \n${g.why_gap_exists}\n\n`;
      md += `**Research Significance:**  \n${g.research_significance}\n\n`;
      if (g.relevant_limitations && g.relevant_limitations.length > 0) {
        md += `**Relevant Limitations:**\n`;
        g.relevant_limitations.forEach(l => { md += `- ${l}\n`; });
        md += `\n`;
      }
      if (g.supporting_evidence && g.supporting_evidence.length > 0) {
        md += `**Supporting Evidence Excerpts:**\n`;
        g.supporting_evidence.forEach(e => {
          md += `> "${e.excerpt}"  \n> — *${e.paper_id} (${e.paper_title})*, ${formatPage(e)}, ${e.section}\n\n`;
        });
      }
      md += `**Potential Methodology:** ${g.potential_methodology || 'Not specified'}\n\n`;
      md += `**Future Research Direction:** ${g.future_research_direction || (g.future_directions || []).join('; ')}\n\n`;
      md += `**Proposed Research Questions:** ${(g.proposed_research_questions || []).join('; ')}  \n`;
      md += `**Suggested Objectives:** ${(g.proposed_objectives || []).join('; ')}  \n\n`;
    });
  }

  md += `## 5. Overall Conclusion\n\n${report.overall_conclusion || report.conclusion}\n\n`;

  md += `## 6. References & Empirical Traceability\n\n`;
  report.references.forEach(r => {
    md += `${r.index}. ${r.citation_text} [${r.verified_evidence_citations} verified citations | ${r.document_status}] ${r.doi ? `https://doi.org/${r.doi}` : ''}\n`;
  });

  return md;
}
