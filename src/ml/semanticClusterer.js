/**
 * In-House TF-IDF Cosine Similarity & Agglomerative Semantic Clusterer
 * Used for unsupervised grouping of cross-paper limitations and research observations
 * without relying on external embedding or generative AI APIs.
 */

import { tokenizeText, computeTermCounts, sparseCosineSimilarity } from './textPreprocessing.js';

/**
 * Build normalized TF-IDF vectors for an array of text items.
 */
export function buildTfIdfVectors(texts = []) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const docFreq = Object.create(null);
  const tokenized = texts.map(text => {
    const tokens = tokenizeText(String(text || ''), { removeStopwords: true, stem: true, includeBigrams: true });
    const seen = new Set(tokens);
    for (const tok of seen) {
      docFreq[tok] = (docFreq[tok] || 0) + 1;
    }
    return tokens;
  });

  const N = texts.length;
  return tokenized.map(tokens => {
    const tf = computeTermCounts(tokens);
    const vec = Object.create(null);
    let normSq = 0;

    for (const [tok, count] of Object.entries(tf)) {
      const idf = Math.log((N + 1) / ((docFreq[tok] || 0) + 1)) + 1;
      const val = (1 + Math.log(count)) * idf;
      vec[tok] = val;
      normSq += val * val;
    }

    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (const tok in vec) {
        vec[tok] /= norm;
      }
    }
    return vec;
  });
}

/**
 * Average-linkage agglomerative clustering of observation strings by TF-IDF cosine similarity.
 * @param {Array<{text: string, paper_id: string}>} items
 * @param {number} similarityThreshold
 */
export function clusterObservationsByTfIdf(items = [], similarityThreshold = 0.14) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const vectors = buildTfIdfVectors(items.map(i => i.text));
  let clusters = items.map((item, idx) => ({
    indices: [idx],
    items: [item]
  }));

  const pairSimilarity = (idxA, idxB) => sparseCosineSimilarity(vectors[idxA], vectors[idxB]);

  while (clusters.length > 1) {
    let bestSim = -1;
    let bestPair = null;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let sumSim = 0;
        let count = 0;
        for (const ia of clusters[i].indices) {
          for (const ib of clusters[j].indices) {
            sumSim += pairSimilarity(ia, ib);
            count++;
          }
        }
        const avgSim = count > 0 ? sumSim / count : 0;
        if (avgSim > bestSim) {
          bestSim = avgSim;
          bestPair = [i, j];
        }
      }
    }

    if (!bestPair || bestSim < similarityThreshold) break;

    const [i, j] = bestPair;
    clusters[i] = {
      indices: [...clusters[i].indices, ...clusters[j].indices],
      items: [...clusters[i].items, ...clusters[j].items]
    };
    clusters.splice(j, 1);
  }

  return clusters.map((c, idx) => ({
    cluster_id: `tfidf-cluster-${idx + 1}`,
    size: c.items.length,
    paperIds: Array.from(new Set(c.items.map(it => it.paper_id).filter(Boolean))),
    items: c.items
  }));
}
