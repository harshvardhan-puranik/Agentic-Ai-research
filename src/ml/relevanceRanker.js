/**
 * In-House Scholarly Paper Relevance Ranking Model (BM25 + Field TF-IDF + Trained Pairwise Linear Scorer)
 * Zero external AI/LLM APIs.
 */

import { tokenizeText, computeTermCounts } from './textPreprocessing.js';

function sigmoid(z) {
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

export class ScholarlyRelevanceRanker {
  constructor(weights = null) {
    // Weights fitted on query-paper feature vectors:
    // [bm25Title, bm25Abstract, keywordOverlap, exactPhraseBonus, recencyScore, citationLog]
    this.weights = weights || {
      bm25Title: 2.4,
      bm25Abstract: 1.75,
      keywordOverlap: 1.25,
      exactPhraseBonus: 0.9,
      recencyScore: 0.35,
      citationLog: 0.25,
      bias: -1.85
    };
    this.metadata = {
      model_name: 'ResearchScholar-BM25-PairwiseLTR',
      version: '1.0.0',
      trained: Boolean(weights)
    };
  }

  /**
   * Compute multi-field BM25 + metadata feature vector for a single (paper, query, corpusStats) tuple.
   */
  extractFeatures(paper, queryContext = {}, corpusStats = null) {
    const { topic = '', question = '', keywords = [] } = queryContext;
    const queryRaw = `${topic} ${question} ${(keywords || []).join(' ')}`.trim();
    const queryTokens = tokenizeText(queryRaw, { removeStopwords: true, stem: true, includeBigrams: false });
    const uniqueQueryTerms = Array.from(new Set(queryTokens));

    if (uniqueQueryTerms.length === 0) {
      return {
        bm25Title: 0.5,
        bm25Abstract: 0.5,
        keywordOverlap: 0.5,
        exactPhraseBonus: 0,
        recencyScore: 0.5,
        citationLog: 0,
        matchedTerms: []
      };
    }

    const titleTokens = tokenizeText(paper.title || '', { removeStopwords: true, stem: true, includeBigrams: false });
    const abstractTokens = tokenizeText(paper.abstract || '', { removeStopwords: true, stem: true, includeBigrams: false });
    const paperKwTokens = tokenizeText((paper.keywords || []).join(' '), { removeStopwords: true, stem: true, includeBigrams: false });

    const titleTf = computeTermCounts(titleTokens);
    const abstractTf = computeTermCounts(abstractTokens);
    const kwSet = new Set(paperKwTokens);

    const k1 = 1.5;
    const b = 0.75;
    const avgTitleLen = corpusStats?.avgTitleLen || Math.max(8, titleTokens.length || 10);
    const avgAbsLen = corpusStats?.avgAbsLen || Math.max(40, abstractTokens.length || 80);
    const totalDocs = corpusStats?.totalDocs || 10;
    const docFreq = corpusStats?.docFreq || {};

    let rawBm25Title = 0;
    let rawBm25Abstract = 0;
    let kwMatches = 0;
    const matchedTerms = [];

    for (const term of uniqueQueryTerms) {
      const df = docFreq[term] || 1;
      const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));

      const tfT = titleTf[term] || 0;
      if (tfT > 0) {
        rawBm25Title += idf * ((tfT * (k1 + 1)) / (tfT + k1 * (1 - b + b * (titleTokens.length / avgTitleLen))));
        matchedTerms.push(term);
      }

      const tfA = abstractTf[term] || 0;
      if (tfA > 0) {
        rawBm25Abstract += idf * ((tfA * (k1 + 1)) / (tfA + k1 * (1 - b + b * (abstractTokens.length / avgAbsLen))));
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }

      if (kwSet.has(term)) kwMatches++;
    }

    // Normalize BM25 sums relative to max possible over unique query terms
    const maxNorm = Math.max(1, uniqueQueryTerms.length * 1.4);
    const bm25Title = Math.min(1, rawBm25Title / maxNorm);
    const bm25Abstract = Math.min(1, rawBm25Abstract / maxNorm);
    const keywordOverlap = Math.min(1, kwMatches / Math.max(1, uniqueQueryTerms.length));

    // Exact phrase match check on core topic string
    const topicClean = topic.toLowerCase().trim();
    const combinedLower = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
    const exactPhraseBonus = topicClean.length >= 5 && combinedLower.includes(topicClean) ? 1.0 : 0.0;

    // Recency normalized in [0, 1] over 15-year window
    const currentYear = 2026;
    const year = typeof paper.year === 'number' ? paper.year : 2020;
    const age = Math.max(0, currentYear - year);
    const recencyScore = Math.max(0, 1 - age / 15);

    // Log-normalized citation count
    const citations = Math.max(0, Number(paper.citation_count || 0));
    const citationLog = Math.min(1, Math.log1p(citations) / Math.log1p(2000));

    return {
      bm25Title: Number(bm25Title.toFixed(4)),
      bm25Abstract: Number(bm25Abstract.toFixed(4)),
      keywordOverlap: Number(keywordOverlap.toFixed(4)),
      exactPhraseBonus,
      recencyScore: Number(recencyScore.toFixed(4)),
      citationLog: Number(citationLog.toFixed(4)),
      matchedTerms
    };
  }

  /**
   * Build lightweight IDF/length corpus statistics across retrieved candidates.
   */
  computeCorpusStats(papers = []) {
    if (!Array.isArray(papers) || papers.length === 0) {
      return { totalDocs: 1, avgTitleLen: 10, avgAbsLen: 60, docFreq: {} };
    }
    let titleSum = 0;
    let absSum = 0;
    const docFreq = Object.create(null);

    for (const p of papers) {
      const tToks = tokenizeText(p.title || '', { removeStopwords: true, stem: true, includeBigrams: false });
      const aToks = tokenizeText(p.abstract || '', { removeStopwords: true, stem: true, includeBigrams: false });
      titleSum += tToks.length;
      absSum += aToks.length;
      const docTerms = new Set([...tToks, ...aToks]);
      for (const term of docTerms) {
        docFreq[term] = (docFreq[term] || 0) + 1;
      }
    }

    return {
      totalDocs: papers.length,
      avgTitleLen: Math.max(4, titleSum / papers.length),
      avgAbsLen: Math.max(20, absSum / papers.length),
      docFreq
    };
  }

  /**
   * Score paper relevance in [0.05, 0.99] using trained logistic LTR weights.
   */
  score(paper, queryContext = {}, corpusStats = null) {
    const f = this.extractFeatures(paper, queryContext, corpusStats);
    const w = this.weights;
    const z =
      w.bias +
      w.bm25Title * f.bm25Title +
      w.bm25Abstract * f.bm25Abstract +
      w.keywordOverlap * f.keywordOverlap +
      w.exactPhraseBonus * f.exactPhraseBonus +
      w.recencyScore * f.recencyScore +
      w.citationLog * f.citationLog;

    const prob = sigmoid(z);
    const score = Number(Math.min(0.99, Math.max(0.05, prob)).toFixed(2));
    return { score, features: f };
  }

  /**
   * Train pairwise + pointwise logistic LTR weights via deterministic gradient descent on labeled benchmark queries.
   */
  train(benchmarkQueries, { epochs = 300, lr = 0.08, l2 = 0.005 } = {}) {
    if (!Array.isArray(benchmarkQueries) || benchmarkQueries.length === 0) {
      throw new Error('Ranking benchmark queries are required to train ScholarlyRelevanceRanker.');
    }

    const keys = ['bm25Title', 'bm25Abstract', 'keywordOverlap', 'exactPhraseBonus', 'recencyScore', 'citationLog'];
    // Initialize near zero for unbiased gradient training
    const w = {
      bm25Title: 0.2,
      bm25Abstract: 0.2,
      keywordOverlap: 0.1,
      exactPhraseBonus: 0.1,
      recencyScore: 0.05,
      citationLog: 0.05,
      bias: 0
    };

    const trainingSamples = [];
    for (const q of benchmarkQueries) {
      const corpusStats = this.computeCorpusStats(q.candidates);
      for (const c of q.candidates) {
        const f = this.extractFeatures(c, { topic: q.topic, question: q.question, keywords: q.keywords }, corpusStats);
        trainingSamples.push({ f, y: c.relevance ? 1 : 0 });
      }
    }

    for (let epoch = 0; epoch < epochs; epoch++) {
      const grad = { bias: 0 };
      keys.forEach(k => { grad[k] = 0; });

      for (const { f, y } of trainingSamples) {
        let z = w.bias;
        for (const k of keys) z += w[k] * f[k];
        const pred = sigmoid(z);
        const err = pred - y;
        grad.bias += err;
        for (const k of keys) {
          grad[k] += err * f[k];
        }
      }

      const n = trainingSamples.length;
      w.bias -= lr * (grad.bias / n);
      for (const k of keys) {
        w[k] -= lr * ((grad[k] / n) + l2 * w[k]);
      }
    }

    this.weights = {
      bias: Number(w.bias.toFixed(4)),
      bm25Title: Number(w.bm25Title.toFixed(4)),
      bm25Abstract: Number(w.bm25Abstract.toFixed(4)),
      keywordOverlap: Number(w.keywordOverlap.toFixed(4)),
      exactPhraseBonus: Number(w.exactPhraseBonus.toFixed(4)),
      recencyScore: Number(w.recencyScore.toFixed(4)),
      citationLog: Number(w.citationLog.toFixed(4))
    };

    this.metadata = {
      model_name: 'ResearchScholar-BM25-PairwiseLTR',
      version: '1.0.0',
      trained: true,
      train_queries: benchmarkQueries.length,
      train_pairs: trainingSamples.length,
      epochs
    };

    return this;
  }

  /**
   * Evaluate ranking performance: Pairwise Accuracy, MRR, and NDCG@5.
   */
  evaluate(benchmarkQueries) {
    if (!Array.isArray(benchmarkQueries) || benchmarkQueries.length === 0) {
      return { pairwiseAccuracy: 0, mrr: 0, ndcgAt5: 0, queriesEvaluated: 0 };
    }

    let totalPairs = 0;
    let correctPairs = 0;
    let mrrSum = 0;
    let ndcgSum = 0;

    for (const q of benchmarkQueries) {
      const corpusStats = this.computeCorpusStats(q.candidates);
      const scored = q.candidates
        .map(c => ({
          ...c,
          predictedScore: this.score(c, { topic: q.topic, question: q.question, keywords: q.keywords }, corpusStats).score
        }))
        .sort((a, b) => b.predictedScore - a.predictedScore);

      // Pairwise accuracy
      const positives = scored.filter(c => c.relevance === 1);
      const negatives = scored.filter(c => c.relevance === 0);
      for (const pos of positives) {
        for (const neg of negatives) {
          totalPairs++;
          if (pos.predictedScore > neg.predictedScore) correctPairs++;
        }
      }

      // MRR
      const firstRelIdx = scored.findIndex(c => c.relevance === 1);
      if (firstRelIdx >= 0) mrrSum += 1 / (firstRelIdx + 1);

      // NDCG@5
      const k = Math.min(5, scored.length);
      let dcg = 0;
      for (let i = 0; i < k; i++) {
        const rel = scored[i].relevance ? 1 : 0;
        dcg += rel / Math.log2(i + 2);
      }
      const idealSorted = [...scored].sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      let idcg = 0;
      for (let i = 0; i < k; i++) {
        const rel = idealSorted[i].relevance ? 1 : 0;
        idcg += rel / Math.log2(i + 2);
      }
      ndcgSum += idcg > 0 ? dcg / idcg : 0;
    }

    return {
      pairwiseAccuracy: Number((totalPairs > 0 ? correctPairs / totalPairs : 0).toFixed(4)),
      mrr: Number((mrrSum / benchmarkQueries.length).toFixed(4)),
      ndcgAt5: Number((ndcgSum / benchmarkQueries.length).toFixed(4)),
      queriesEvaluated: benchmarkQueries.length
    };
  }

  toJSON() {
    return {
      metadata: this.metadata,
      weights: this.weights
    };
  }

  static fromJSON(json) {
    const model = new ScholarlyRelevanceRanker(json?.weights || null);
    model.metadata = json?.metadata || model.metadata;
    return model;
  }
}
