/**
 * In-House Scholarly Text Preprocessing, Stemming & TF-IDF Vectorization
 * Zero external AI/NLP dependencies.
 */

export const ACADEMIC_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my',
  'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'using', 'used', 'use', 'based', 'paper', 'study', 'show',
  'shows', 'shown', 'present', 'presents', 'proposed', 'propose', 'approach', 'method', 'methods'
]);

/**
 * Lightweight deterministic suffix normalizer for academic English tokens.
 */
export function normalizeStem(token) {
  if (!token || token.length <= 4) return token;
  let w = token;
  if (w.endsWith('ational')) w = w.slice(0, -5) + 'e';
  else if (w.endsWith('ization')) w = w.slice(0, -5) + 'e';
  else if (w.endsWith('fulness')) w = w.slice(0, -4);
  else if (w.endsWith('iveness')) w = w.slice(0, -4);
  else if (w.endsWith('ities')) w = w.slice(0, -5) + 'y';
  else if (w.endsWith('ingly')) w = w.slice(0, -5);
  else if (w.endsWith('edly')) w = w.slice(0, -4);
  else if (w.endsWith('ment') && w.length > 6) w = w.slice(0, -4);
  else if (w.endsWith('tion') && w.length > 6) w = w.slice(0, -3) + 't';
  else if (w.endsWith('sion') && w.length > 6) w = w.slice(0, -3) + 's';
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ied') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 4) w = w.slice(0, -1);
  return w;
}

/**
 * Tokenize academic text into normalized unigrams and optional bigrams.
 */
export function tokenizeText(text, { removeStopwords = true, stem = true, includeBigrams = true } = {}) {
  if (!text || typeof text !== 'string') return [];

  const raw = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 1 && !/^\d+$/.test(w));

  const unigrams = [];
  for (const w of raw) {
    if (removeStopwords && ACADEMIC_STOPWORDS.has(w)) continue;
    const norm = stem ? normalizeStem(w) : w;
    if (norm.length > 1) unigrams.push(norm);
  }

  if (!includeBigrams || unigrams.length < 2) {
    return unigrams;
  }

  const features = [...unigrams];
  for (let i = 0; i < unigrams.length - 1; i++) {
    features.push(`${unigrams[i]}_${unigrams[i + 1]}`);
  }
  return features;
}

/**
 * Compute sparse term-frequency map for a token array.
 */
export function computeTermCounts(tokens) {
  const counts = Object.create(null);
  for (const tok of tokens) {
    counts[tok] = (counts[tok] || 0) + 1;
  }
  return counts;
}

/**
 * Compute cosine similarity between two sparse numeric maps.
 */
export function sparseCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const k in vecA) {
    const valA = vecA[k];
    normA += valA * valA;
    if (vecB[k] !== undefined) {
      dot += valA * vecB[k];
    }
  }
  for (const k in vecB) {
    const valB = vecB[k];
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic PRNG (Mulberry32) for reproducible train/test dataset splitting.
 */
export function createSeededRng(seed = 42) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded stratified train/test split.
 */
export function stratifiedSplit(items, labelFn, testRatio = 0.25, seed = 42) {
  const rng = createSeededRng(seed);
  const byClass = new Map();
  for (const item of items) {
    const label = labelFn(item);
    if (!byClass.has(label)) byClass.set(label, []);
    byClass.get(label).push(item);
  }

  const train = [];
  const test = [];

  for (const [, group] of byClass.entries()) {
    const copy = [...group];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const testCount = Math.max(1, Math.round(copy.length * testRatio));
    for (let i = 0; i < copy.length; i++) {
      if (i < testCount && copy.length > 1) {
        test.push(copy[i]);
      } else {
        train.push(copy[i]);
      }
    }
  }

  return { train, test };
}
