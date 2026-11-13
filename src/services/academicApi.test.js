import test from 'node:test';
import assert from 'node:assert/strict';
import { reconstructOpenAlexAbstract, executeAcademicSearch } from './academicApi.js';
import { validateModule2Schema } from '../utils/academicSearchEngine.js';

test('reconstructOpenAlexAbstract accurately reconstructs text from inverted index', () => {
  const invertedIndex = {
    'Transformers': [0],
    'are': [1],
    'highly': [2],
    'effective': [3],
    'for': [4],
    'reasoning': [5]
  };

  const reconstructed = reconstructOpenAlexAbstract(invertedIndex);
  assert.equal(reconstructed, 'Transformers are highly effective for reasoning');
});

test('executeAcademicSearch executes pipeline, deduplicates, and produces valid Module 2 Output', async () => {
  const result = await executeAcademicSearch({
    topic: 'Attention Mechanisms in Deep Learning',
    question: 'How do self-attention mechanisms scale?',
    domain: 'Computer Science',
    keywords: ['attention', 'transformer'],
    yearRange: [2016, 2026],
    preferredSources: ['arXiv', 'OpenAlex'],
    papersRequired: 5
  });

  assert.ok(result.papers.length > 0);
  assert.ok(result.output1);
  assert.equal(result.output1.schema_version, '1.0.0');
  assert.equal(result.output1.research_topic, 'Attention Mechanisms in Deep Learning');

  // Verify Module 2 schema acceptance
  const validation = validateModule2Schema(result.output1);
  assert.equal(validation.valid, true, `Validation failed with errors: ${validation.errors.join(', ')}`);
  assert.ok(validation.paperCount >= 1);

  // Check each paper format
  const firstPaper = result.papers[0];
  assert.ok(firstPaper.paper_id.startsWith('rs-paper-'));
  assert.ok(firstPaper.title);
  assert.ok(Array.isArray(firstPaper.authors));
  assert.ok(typeof firstPaper.relevance_score === 'number');
  assert.ok(firstPaper.relevance_explanation);
  assert.ok(firstPaper.verified_source_url);
});

test('executeAcademicSearch retrieves genuine biomedical papers without hardcoded deep learning fallbacks', async () => {
  const result = await executeAcademicSearch({
    topic: 'CRISPR Cas9 Gene Editing Mechanisms',
    question: 'What are the molecular repair pathways following Cas9 cleavage?',
    domain: 'Biomedicine & Health Sciences',
    preferredSources: ['OpenAlex', 'arXiv', 'Crossref'],
    papersRequired: 3
  });

  assert.ok(result.papers.length > 0, 'Should retrieve genuine papers for CRISPR');
  assert.equal(result.stats.usedVerifiedFallback, false, 'Must NOT use hardcoded fallback papers');
  
  // Verify genuine paper attributes
  for (const paper of result.papers) {
    assert.ok(paper.title && paper.title.length > 5, 'Title must be non-empty');
    assert.ok(Array.isArray(paper.authors) && paper.authors.length > 0, 'Authors must be an array');
    assert.ok(paper.verified_source_url.startsWith('http'), 'Source URL must be valid HTTP');
    assert.ok(['OpenAlex', 'arXiv', 'Crossref', 'Semantic Scholar'].includes(paper.source), 'Source must be recognized');
    // Ensure it is NOT about attention mechanisms
    const lowerTitle = paper.title.toLowerCase();
    assert.ok(!lowerTitle.includes('attention is all you need'), 'Must not return hardcoded Attention paper for CRISPR query');
  }

  // Check search metadata
  assert.ok(Array.isArray(result.output1.search_metadata.sources_succeeded));
  assert.ok(result.output1.search_metadata.sources_succeeded.length > 0);
  assert.equal(result.output1.search_metadata.retrieval_status, 'success');
});

test('executeAcademicSearch handles obscure/empty queries without inventing fake papers', async () => {
  const result = await executeAcademicSearch({
    topic: 'xyzqzzqkjhg12345nonexistenttopic987654',
    preferredSources: ['OpenAlex', 'arXiv'],
    papersRequired: 5
  });

  assert.equal(result.papers.length, 0, 'Must return 0 papers for nonexistent query');
  assert.equal(result.stats.usedVerifiedFallback, false, 'Must not inject fake papers');
  assert.equal(result.output1.papers.length, 0);
});
