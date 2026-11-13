/**
 * In-House Extractive Sentence-Role Classifier
 * Trained L2-Regularized Multinomial Logistic Regression (Softmax) over TF-IDF unigram/bigram
 * and structural cue features identifying scholarly extraction roles:
 *   - objective
 *   - problem_statement
 *   - methodology
 *   - results
 *   - limitations
 *   - future_work
 *
 * Strictly extractive: classifies genuine sentences present in source texts; never invents content.
 */

import { tokenizeText, computeTermCounts } from './textPreprocessing.js';

function extractStructuralCues(text) {
  const cues = [];
  if (/\b\d+(?:\.\d+)?%|\b(p\s*[<>=]\s*0?\.\d+|auroc|f1|rmse|bleu|speedup|fold)\b/i.test(text)) {
    cues.push('__CUE_METRIC_NUM__');
  }
  if (/\b(aim|goal|objective|purpose|investigate|propose|present|seek|establish|construct)\b/i.test(text)) {
    cues.push('__CUE_OBJECTIVE_VERB__');
  }
  if (/\b(bottleneck|challenge|suffer|prohibitive|hinder|fail|unresolved|lack|degrade|unable|scarcity|expensive)\b/i.test(text)) {
    cues.push('__CUE_PROBLEM_WORD__');
  }
  if (/\b(limitation|drawback|restricted|constrained|assume|assumes|cannot|lacks|sensitive|validated|overlook|exceeds)\b/i.test(text)) {
    cues.push('__CUE_LIMITATION_WORD__');
  }
  if (/\b(future|next step|remain|open direction|plan to|further investigation|upcoming|promising avenue|left for|extend)\b/i.test(text)) {
    cues.push('__CUE_FUTURE_WORD__');
  }
  if (/\b(trained|employed|formulate|recorded|sampled|assayed|implemented|applied|synthesized|via|using|epochs|hz)\b/i.test(text)) {
    cues.push('__CUE_METHOD_WORD__');
  }
  return cues;
}

export class SentenceRoleClassifier {
  constructor(l2 = 0.003) {
    this.l2 = l2;
    this.roles = [];
    this.idf = {};
    this.vocab = [];
    this.weights = {};
    this.bias = {};
    this.metadata = {
      model_name: 'ResearchScholar-SentenceRoleSoftmax',
      version: '1.1.0',
      trained: false,
      train_samples: 0,
      vocab_size: 0
    };
  }

  _extractTokens(text) {
    const base = tokenizeText(text, { removeStopwords: false, stem: true, includeBigrams: true });
    const cues = extractStructuralCues(text);
    return [...base, ...cues, ...cues]; // double cue weighting
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

  train(samples, { epochs = 220, lr = 1.4 } = {}) {
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new Error('Sentence role samples are required to fit SentenceRoleClassifier.');
    }

    const roleSet = new Set();
    const docFreq = Object.create(null);

    for (const s of samples) {
      roleSet.add(s.role);
      const tokens = this._extractTokens(s.text);
      for (const tok of new Set(tokens)) {
        docFreq[tok] = (docFreq[tok] || 0) + 1;
      }
    }

    const totalDocs = samples.length;
    this.roles = Array.from(roleSet).sort();
    this.vocab = Object.keys(docFreq)
      .filter(tok => docFreq[tok] >= 2 || !tok.includes('_'))
      .sort();
    this.idf = Object.create(null);

    for (const tok of this.vocab) {
      this.idf[tok] = Math.log((totalDocs + 1) / ((docFreq[tok] || 0) + 1)) + 1;
    }

    this.weights = {};
    this.bias = {};
    for (const role of this.roles) {
      this.weights[role] = Object.create(null);
      this.bias[role] = 0;
    }

    const dataset = samples.map(s => ({
      x: this._featurize(s.text),
      y: s.role
    }));

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = {};
      const gradB = {};
      for (const role of this.roles) {
        gradW[role] = Object.create(null);
        gradB[role] = 0;
      }

      for (const { x, y } of dataset) {
        const logits = {};
        let maxLogit = -Infinity;
        for (const role of this.roles) {
          let z = this.bias[role];
          const wRole = this.weights[role];
          for (const tok in x) {
            if (wRole[tok] !== undefined) z += wRole[tok] * x[tok];
          }
          logits[role] = z;
          if (z > maxLogit) maxLogit = z;
        }

        const probs = {};
        let sumExp = 0;
        for (const role of this.roles) {
          const e = Math.exp(logits[role] - maxLogit);
          probs[role] = e;
          sumExp += e;
        }

        for (const role of this.roles) {
          const p = probs[role] / sumExp;
          const target = role === y ? 1 : 0;
          const err = p - target;
          gradB[role] += err;
          const gW = gradW[role];
          for (const tok in x) {
            gW[tok] = (gW[tok] || 0) + err * x[tok];
          }
        }
      }

      const n = dataset.length;
      for (const role of this.roles) {
        this.bias[role] -= lr * (gradB[role] / n);
        const wRole = this.weights[role];
        const gRole = gradW[role];
        for (const tok in wRole) {
          wRole[tok] *= (1 - lr * this.l2);
        }
        for (const tok in gRole) {
          wRole[tok] = (wRole[tok] || 0) - lr * (gRole[tok] / n);
        }
      }
    }

    for (const role of this.roles) {
      const compact = Object.create(null);
      for (const [tok, val] of Object.entries(this.weights[role])) {
        if (Math.abs(val) > 0.015) compact[tok] = Number(val.toFixed(4));
      }
      this.weights[role] = compact;
      this.bias[role] = Number(this.bias[role].toFixed(4));
    }

    this.metadata = {
      model_name: 'ResearchScholar-SentenceRoleSoftmax',
      version: '1.1.0',
      trained: true,
      train_samples: totalDocs,
      vocab_size: this.vocab.length,
      num_roles: this.roles.length,
      l2: this.l2,
      epochs
    };

    return this;
  }

  predict(sentenceText) {
    if (!this.metadata.trained || this.roles.length === 0 || !sentenceText || sentenceText.trim().length < 15) {
      return { role: 'other', confidence: 0, probabilities: {}, trained: this.metadata.trained };
    }

    const x = this._featurize(sentenceText);
    const matchedTokens = Object.keys(x);
    if (matchedTokens.length === 0) {
      return { role: 'other', confidence: 0, probabilities: {}, trained: true };
    }

    const logits = {};
    let maxLogit = -Infinity;
    for (const role of this.roles) {
      let z = this.bias[role] || 0;
      const wRole = this.weights[role] || {};
      for (const tok of matchedTokens) {
        if (wRole[tok] !== undefined) z += wRole[tok] * x[tok];
      }
      logits[role] = z;
      if (z > maxLogit) maxLogit = z;
    }

    const expScores = {};
    let sumExp = 0;
    for (const role of this.roles) {
      const e = Math.exp(logits[role] - maxLogit);
      expScores[role] = e;
      sumExp += e;
    }

    const probabilities = {};
    let bestRole = this.roles[0];
    let bestProb = -1;
    for (const role of this.roles) {
      const p = sumExp > 0 ? expScores[role] / sumExp : 1 / this.roles.length;
      probabilities[role] = Number(p.toFixed(4));
      if (p > bestProb) {
        bestProb = p;
        bestRole = role;
      }
    }

    return {
      role: bestRole,
      confidence: Number(bestProb.toFixed(4)),
      probabilities,
      trained: true
    };
  }

  evaluate(testSamples) {
    if (!Array.isArray(testSamples) || testSamples.length === 0) {
      return { accuracy: 0, macroF1: 0, total: 0, correct: 0, perRole: {} };
    }

    let correct = 0;
    const stats = {};
    for (const r of this.roles) {
      stats[r] = { tp: 0, fp: 0, fn: 0 };
    }

    for (const s of testSamples) {
      const pred = this.predict(s.text).role;
      const actual = s.role;
      if (!stats[actual]) stats[actual] = { tp: 0, fp: 0, fn: 0 };
      if (!stats[pred]) stats[pred] = { tp: 0, fp: 0, fn: 0 };

      if (pred === actual) {
        correct++;
        stats[actual].tp++;
      } else {
        stats[pred].fp++;
        stats[actual].fn++;
      }
    }

    const perRole = {};
    let f1Sum = 0;
    let roleCount = 0;
    for (const [role, c] of Object.entries(stats)) {
      if (c.tp + c.fp + c.fn === 0) continue;
      const prec = c.tp + c.fp > 0 ? c.tp / (c.tp + c.fp) : 0;
      const rec = c.tp + c.fn > 0 ? c.tp / (c.tp + c.fn) : 0;
      const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
      perRole[role] = {
        precision: Number(prec.toFixed(4)),
        recall: Number(rec.toFixed(4)),
        f1: Number(f1.toFixed(4))
      };
      f1Sum += f1;
      roleCount++;
    }

    return {
      accuracy: Number((correct / testSamples.length).toFixed(4)),
      macroF1: Number((roleCount > 0 ? f1Sum / roleCount : 0).toFixed(4)),
      correct,
      total: testSamples.length,
      perRole
    };
  }

  toJSON() {
    return {
      metadata: this.metadata,
      l2: this.l2,
      roles: this.roles,
      idf: this.idf,
      vocab: this.vocab,
      weights: this.weights,
      bias: this.bias
    };
  }

  static fromJSON(json) {
    const model = new SentenceRoleClassifier(json?.l2 ?? 0.003);
    model.metadata = json?.metadata || model.metadata;
    model.roles = json?.roles || [];
    model.idf = json?.idf || {};
    model.vocab = json?.vocab || [];
    model.weights = json?.weights || {};
    model.bias = json?.bias || {};
    return model;
  }
}
