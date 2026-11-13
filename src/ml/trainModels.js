/**
 * Reproducible In-House Model Training & Evaluation Pipeline
 * Run via: node src/ml/trainModels.js
 *
 * Trains and evaluates:
 *   1. ResearchDomainClassifier (Stratified 75/25 split on DOMAIN_DATASET)
 *   2. ScholarlyRelevanceRanker (Pairwise/Pointwise LTR on RANKING_BENCHMARK; leave-one-query-out CV + full fit)
 *   3. SentenceRoleClassifier (Stratified 75/25 split on SENTENCE_ROLE_DATASET)
 *
 * Persists serialized artifacts & exact evaluation metrics to:
 *   - src/ml/models/trainedModels.json
 *   - src/ml/models/trainedModels.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DOMAIN_DATASET,
  RANKING_BENCHMARK,
  SENTENCE_ROLE_DATASET
} from './datasets/scholarlyCorpus.js';
import { stratifiedSplit } from './textPreprocessing.js';
import { ResearchDomainClassifier } from './researchClassifier.js';
import { ScholarlyRelevanceRanker } from './relevanceRanker.js';
import { SentenceRoleClassifier } from './sentenceRoleClassifier.js';

export function runTrainingPipeline({ seed = 42, persist = true } = {}) {
  const startedAt = new Date().toISOString();

  // --------------------------------------------------------------------------
  // 1. Train & Evaluate Research Domain Classifier (Stratified Hold-Out)
  // --------------------------------------------------------------------------
  const domainSplit = stratifiedSplit(DOMAIN_DATASET, d => d.domain, 0.25, seed);
  const domainHoldoutModel = new ResearchDomainClassifier(0.002);
  domainHoldoutModel.train(domainSplit.train);
  const domainHoldoutEval = domainHoldoutModel.evaluate(domainSplit.test);

  // Refit production classifier on full curated corpus after verified hold-out evaluation
  const domainProdModel = new ResearchDomainClassifier(0.002);
  domainProdModel.train(DOMAIN_DATASET);

  // --------------------------------------------------------------------------
  // 2. Train & Evaluate Paper Relevance Ranker (Leave-One-Query-Out CV)
  // --------------------------------------------------------------------------
  const loocvEvals = [];
  for (let i = 0; i < RANKING_BENCHMARK.length; i++) {
    const trainQueries = RANKING_BENCHMARK.filter((_, idx) => idx !== i);
    const heldOutQuery = [RANKING_BENCHMARK[i]];
    const cvRanker = new ScholarlyRelevanceRanker();
    cvRanker.train(trainQueries, { epochs: 350, lr: 0.08, l2: 0.005 });
    loocvEvals.push(cvRanker.evaluate(heldOutQuery));
  }

  const avgPairwiseAcc = Number(
    (loocvEvals.reduce((s, e) => s + e.pairwiseAccuracy, 0) / loocvEvals.length).toFixed(4)
  );
  const avgMrr = Number(
    (loocvEvals.reduce((s, e) => s + e.mrr, 0) / loocvEvals.length).toFixed(4)
  );
  const avgNdcg5 = Number(
    (loocvEvals.reduce((s, e) => s + e.ndcgAt5, 0) / loocvEvals.length).toFixed(4)
  );

  const rankerProdModel = new ScholarlyRelevanceRanker();
  rankerProdModel.train(RANKING_BENCHMARK, { epochs: 350, lr: 0.08, l2: 0.005 });

  // --------------------------------------------------------------------------
  // 3. Train & Evaluate Sentence Role Classifier (Stratified Hold-Out)
  // --------------------------------------------------------------------------
  const roleSplit = stratifiedSplit(SENTENCE_ROLE_DATASET, s => s.role, 0.25, seed);
  const roleHoldoutModel = new SentenceRoleClassifier(0.003);
  roleHoldoutModel.train(roleSplit.train);
  const roleHoldoutEval = roleHoldoutModel.evaluate(roleSplit.test);

  const roleProdModel = new SentenceRoleClassifier(0.003);
  roleProdModel.train(SENTENCE_ROLE_DATASET);

  const artifact = {
    pipeline_version: '1.0.0',
    trained_at: startedAt,
    seed,
    external_ai_dependencies: 'none',
    evaluation_summary: {
      domain_classifier: {
        split_type: '75/25 stratified hold-out',
        train_size: domainSplit.train.length,
        test_size: domainSplit.test.length,
        accuracy: domainHoldoutEval.accuracy,
        macro_f1: domainHoldoutEval.macroF1,
        full_corpus_size: DOMAIN_DATASET.length
      },
      relevance_ranker: {
        split_type: 'Leave-One-Query-Out Cross-Validation',
        queries: RANKING_BENCHMARK.length,
        pairwise_accuracy: avgPairwiseAcc,
        mrr: avgMrr,
        ndcg_at_5: avgNdcg5
      },
      sentence_role_classifier: {
        split_type: '75/25 stratified hold-out',
        train_size: roleSplit.train.length,
        test_size: roleSplit.test.length,
        accuracy: roleHoldoutEval.accuracy,
        macro_f1: roleHoldoutEval.macroF1,
        full_corpus_size: SENTENCE_ROLE_DATASET.length
      }
    },
    models: {
      domain_classifier: domainProdModel.toJSON(),
      relevance_ranker: rankerProdModel.toJSON(),
      sentence_role_classifier: roleProdModel.toJSON()
    }
  };

  if (persist) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const modelsDir = path.join(__dirname, 'models');
    fs.mkdirSync(modelsDir, { recursive: true });

    const jsonPath = path.join(modelsDir, 'trainedModels.json');
    const jsPath = path.join(modelsDir, 'trainedModels.js');

    fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2), 'utf8');
    fs.writeFileSync(
      jsPath,
      `// Auto-generated by src/ml/trainModels.js — reproducible in-house model artifact\nexport const TRAINED_MODELS = ${JSON.stringify(artifact)};\n`,
      'utf8'
    );
  }

  return artifact;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  const res = runTrainingPipeline({ seed: 42, persist: true });
  console.log('=== ResearchScholar In-House Model Training & Evaluation Complete ===');
  console.log(JSON.stringify(res.evaluation_summary, null, 2));
}
