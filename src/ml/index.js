/**
 * In-House Research Intelligence Models Runtime Registry
 * Loads pre-trained, evaluated local model artifacts with zero external AI SDK dependencies.
 */

import { TRAINED_MODELS } from './models/trainedModels.js';
import { ResearchDomainClassifier } from './researchClassifier.js';
import { ScholarlyRelevanceRanker } from './relevanceRanker.js';
import { SentenceRoleClassifier } from './sentenceRoleClassifier.js';
import { buildTfIdfVectors, clusterObservationsByTfIdf } from './semanticClusterer.js';
import { tokenizeText, sparseCosineSimilarity } from './textPreprocessing.js';

let cachedDomainClassifier = null;
let cachedRelevanceRanker = null;
let cachedSentenceRoleClassifier = null;

export function getDomainClassifier() {
  if (!cachedDomainClassifier) {
    cachedDomainClassifier = ResearchDomainClassifier.fromJSON(TRAINED_MODELS.models.domain_classifier);
  }
  return cachedDomainClassifier;
}

export function getRelevanceRanker() {
  if (!cachedRelevanceRanker) {
    cachedRelevanceRanker = ScholarlyRelevanceRanker.fromJSON(TRAINED_MODELS.models.relevance_ranker);
  }
  return cachedRelevanceRanker;
}

export function getSentenceRoleClassifier() {
  if (!cachedSentenceRoleClassifier) {
    cachedSentenceRoleClassifier = SentenceRoleClassifier.fromJSON(TRAINED_MODELS.models.sentence_role_classifier);
  }
  return cachedSentenceRoleClassifier;
}

export function getTrainedModelsSummary() {
  return {
    pipeline_version: TRAINED_MODELS.pipeline_version,
    trained_at: TRAINED_MODELS.trained_at,
    seed: TRAINED_MODELS.seed,
    external_ai_dependencies: TRAINED_MODELS.external_ai_dependencies,
    evaluation_summary: TRAINED_MODELS.evaluation_summary,
    models: {
      domain_classifier: TRAINED_MODELS.models.domain_classifier.metadata,
      relevance_ranker: {
        ...TRAINED_MODELS.models.relevance_ranker.metadata,
        weights: TRAINED_MODELS.models.relevance_ranker.weights
      },
      sentence_role_classifier: TRAINED_MODELS.models.sentence_role_classifier.metadata
    }
  };
}

export {
  ResearchDomainClassifier,
  ScholarlyRelevanceRanker,
  SentenceRoleClassifier,
  buildTfIdfVectors,
  clusterObservationsByTfIdf,
  tokenizeText,
  sparseCosineSimilarity
};
