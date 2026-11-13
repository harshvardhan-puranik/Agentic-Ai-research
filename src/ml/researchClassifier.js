/**
 * In-House Research Domain Classifier
 * Implements a Discriminative L2-Regularized Multinomial Logistic Regression (Softmax) Classifier
 * trained via gradient descent over L2-normalized unigram + bigram TF-IDF features.
 * Zero external AI/ML SDKs.
 */

import { tokenizeText, computeTermCounts } from './textPreprocessing.js';

export class ResearchDomainClassifier {
  constructor(l2 = 0.002) {
    this.l2 = l2;
    this.classes = [];
    this.idf = {};
    this.vocab = [];
    this.weights = {}; // { [className]: { [token]: weight } }
    this.bias = {};    // { [className]: number }
    this.metadata = {
      model_name: 'ResearchScholar-TFIDF-SoftmaxClassifier',
      version: '1.1.0',
      trained: false,
      train_samples: 0,
      vocab_size: 0
    };
  }

  _extractTokens(text) {
    const base = tokenizeText(text, { removeStopwords: true, stem: true, includeBigrams: true });
    const cleanWords = tokenizeText(text, { removeStopwords: true, stem: false, includeBigrams: false });
    const morph = [];
    for (const w of cleanWords) {
      if (w.length >= 5 && !w.includes('_')) {
        morph.push(`p:${w.slice(0, 5)}`);
        if (w.length >= 7) {
          morph.push(`s:${w.slice(-4)}`);
        }
      }
    }
    return [...base, ...morph];
  }

  _featurize(text) {
    const tokens = this._extractTokens(text);
    const tf = computeTermCounts(tokens);
    const vec = Object.create(null);
    let normSq = 0;

    for (const [tok, count] of Object.entries(tf)) {
      const idf = this.idf[tok];
      if (idf === undefined) continue;
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
  }

  /**
   * Fit IDF vocabulary and train multinomial softmax weights using batch gradient descent.
   * @param {Array<{domain: string, text: string}>} samples
   */
  train(samples, { epochs = 220, lr = 1.4 } = {}) {
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new Error('Training samples are required to fit ResearchDomainClassifier.');
    }

    const classSet = new Set();
    const docFreq = Object.create(null);

    for (const s of samples) {
      classSet.add(s.domain);
      const tokens = this._extractTokens(s.text);
      for (const tok of new Set(tokens)) {
        docFreq[tok] = (docFreq[tok] || 0) + 1;
      }
    }

    const totalDocs = samples.length;
    this.classes = Array.from(classSet).sort();
    // Keep all unigrams; keep bigrams and morphological affixes only when df >= 2 to prevent noise & bloat
    this.vocab = Object.keys(docFreq)
      .filter(tok => docFreq[tok] >= 2 || (!tok.includes('_') && !tok.startsWith('p:') && !tok.startsWith('s:')))
      .sort();
    this.idf = Object.create(null);

    for (const tok of this.vocab) {
      this.idf[tok] = Math.log((totalDocs + 1) / ((docFreq[tok] || 0) + 1)) + 1;
    }

    // Initialize weights & bias
    this.weights = {};
    this.bias = {};
    for (const cls of this.classes) {
      this.weights[cls] = Object.create(null);
      this.bias[cls] = 0;
    }

    const dataset = samples.map(s => ({
      x: this._featurize(s.text),
      y: s.domain
    }));

    // Deterministic batch gradient descent on cross-entropy loss + L2 penalty
    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = {};
      const gradB = {};
      for (const cls of this.classes) {
        gradW[cls] = Object.create(null);
        gradB[cls] = 0;
      }

      for (const { x, y } of dataset) {
        const logits = {};
        let maxLogit = -Infinity;
        for (const cls of this.classes) {
          let z = this.bias[cls];
          const wCls = this.weights[cls];
          for (const tok in x) {
            if (wCls[tok] !== undefined) z += wCls[tok] * x[tok];
          }
          logits[cls] = z;
          if (z > maxLogit) maxLogit = z;
        }

        const probs = {};
        let sumExp = 0;
        for (const cls of this.classes) {
          const e = Math.exp(logits[cls] - maxLogit);
          probs[cls] = e;
          sumExp += e;
        }

        for (const cls of this.classes) {
          const p = probs[cls] / sumExp;
          const target = cls === y ? 1 : 0;
          const err = p - target;
          gradB[cls] += err;
          const gW = gradW[cls];
          for (const tok in x) {
            gW[tok] = (gW[tok] || 0) + err * x[tok];
          }
        }
      }

      const n = dataset.length;
      for (const cls of this.classes) {
        this.bias[cls] -= lr * (gradB[cls] / n);
        const wCls = this.weights[cls];
        const gCls = gradW[cls];
        for (const tok in wCls) {
          wCls[tok] *= (1 - lr * this.l2);
        }
        for (const tok in gCls) {
          wCls[tok] = (wCls[tok] || 0) - lr * (gCls[tok] / n);
        }
      }
    }

    // Prune zero/tiny weights for compact serialization and reduced noise
    for (const cls of this.classes) {
      const compact = Object.create(null);
      for (const [tok, val] of Object.entries(this.weights[cls])) {
        if (Math.abs(val) > 0.015) compact[tok] = Number(val.toFixed(4));
      }
      this.weights[cls] = compact;
      this.bias[cls] = Number(this.bias[cls].toFixed(4));
    }

    this.metadata = {
      model_name: 'ResearchScholar-TFIDF-SoftmaxClassifier',
      version: '1.1.0',
      trained: true,
      train_samples: totalDocs,
      vocab_size: this.vocab.length,
      num_classes: this.classes.length,
      l2: this.l2,
      epochs
    };

    return this;
  }

  /**
   * Predict research domain probabilities and top discriminative terms for input text.
   */
  predict(text) {
    if (!this.metadata.trained || this.classes.length === 0) {
      return {
        domain: 'Interdisciplinary Studies',
        confidence: 0,
        probabilities: {},
        matchedFeatures: [],
        trained: false
      };
    }

    const x = this._featurize(text);
    const matchedTokens = Object.keys(x);
    if (matchedTokens.length === 0) {
      return {
        domain: 'Interdisciplinary Studies',
        confidence: 0,
        probabilities: {},
        matchedFeatures: [],
        trained: true
      };
    }

    const logits = {};
    let maxLogit = -Infinity;
    for (const cls of this.classes) {
      let z = this.bias[cls] || 0;
      const wCls = this.weights[cls] || {};
      for (const tok of matchedTokens) {
        if (wCls[tok] !== undefined) z += wCls[tok] * x[tok];
      }
      logits[cls] = z;
      if (z > maxLogit) maxLogit = z;
    }

    const expScores = {};
    let sumExp = 0;
    for (const cls of this.classes) {
      const e = Math.exp(logits[cls] - maxLogit);
      expScores[cls] = e;
      sumExp += e;
    }

    const probabilities = {};
    let bestDomain = this.classes[0];
    let bestProb = -1;
    for (const cls of this.classes) {
      const p = sumExp > 0 ? expScores[cls] / sumExp : 1 / this.classes.length;
      probabilities[cls] = Number(p.toFixed(4));
      if (p > bestProb) {
        bestProb = p;
        bestDomain = cls;
      }
    }

    const bestWeights = this.weights[bestDomain] || {};
    const matchedFeatures = matchedTokens
      .filter(tok => !tok.startsWith('p:') && !tok.startsWith('s:') && !tok.startsWith('c:') && !tok.includes('_') && (bestWeights[tok] || 0) > 0)
      .sort((a, b) => (bestWeights[b] || 0) - (bestWeights[a] || 0))
      .slice(0, 6);

    const lowConfidence = matchedTokens.length === 0 || bestProb < 0.16;

    return {
      domain: lowConfidence ? 'Interdisciplinary Studies' : bestDomain,
      topCandidate: bestDomain,
      confidence: Number(bestProb.toFixed(4)),
      probabilities,
      matchedFeatures,
      trained: true
    };
  }

  /**
   * Evaluate on held-out test records: returns accuracy, macroF1, and per-class F1.
   */
  evaluate(testSamples) {
    if (!Array.isArray(testSamples) || testSamples.length === 0) {
      return { accuracy: 0, macroF1: 0, total: 0, correct: 0, perClass: {} };
    }

    let correct = 0;
    const stats = {};
    for (const cls of this.classes) {
      stats[cls] = { tp: 0, fp: 0, fn: 0 };
    }

    for (const sample of testSamples) {
      const pred = this.predict(sample.text);
      const predicted = pred.topCandidate || pred.domain;
      const actual = sample.domain;

      if (!stats[actual]) stats[actual] = { tp: 0, fp: 0, fn: 0 };
      if (!stats[predicted]) stats[predicted] = { tp: 0, fp: 0, fn: 0 };

      if (predicted === actual) {
        correct++;
        stats[actual].tp++;
      } else {
        stats[predicted].fp++;
        stats[actual].fn++;
      }
    }

    const perClass = {};
    let f1Sum = 0;
    let clsCount = 0;
    for (const [cls, c] of Object.entries(stats)) {
      if (c.tp + c.fp + c.fn === 0) continue;
      const prec = c.tp + c.fp > 0 ? c.tp / (c.tp + c.fp) : 0;
      const rec = c.tp + c.fn > 0 ? c.tp / (c.tp + c.fn) : 0;
      const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
      perClass[cls] = {
        precision: Number(prec.toFixed(4)),
        recall: Number(rec.toFixed(4)),
        f1: Number(f1.toFixed(4))
      };
      f1Sum += f1;
      clsCount++;
    }

    return {
      accuracy: Number((correct / testSamples.length).toFixed(4)),
      macroF1: Number((clsCount > 0 ? f1Sum / clsCount : 0).toFixed(4)),
      correct,
      total: testSamples.length,
      perClass
    };
  }

  toJSON() {
    return {
      metadata: this.metadata,
      l2: this.l2,
      classes: this.classes,
      idf: this.idf,
      vocab: this.vocab,
      weights: this.weights,
      bias: this.bias
    };
  }

  static fromJSON(json) {
    const model = new ResearchDomainClassifier(json?.l2 ?? 0.002);
    model.metadata = json?.metadata || model.metadata;
    model.classes = json?.classes || [];
    model.idf = json?.idf || {};
    model.vocab = json?.vocab || [];
    model.weights = json?.weights || {};
    model.bias = json?.bias || {};
    return model;
  }
}
