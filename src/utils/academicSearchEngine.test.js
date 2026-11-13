import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTitle,
  normalizeDoi,
  normalizeAuthors,
  deduplicatePapers,
  filterPapers,
  expandSearchTerms,
  calculateRelevanceScore,
  validateModule2Schema,
  buildModule2Output
} from './academicSearchEngine.js';

test('normalizeTitle cleans punctuation, casing and extra spaces', () => {
  const raw = '  Attention Is All You Need! A Novel Transformer: Architecture?  ';
  const norm = normalizeTitle(raw);
  assert.equal(norm, 'attention is all you need a novel transformer architecture');
});

test('normalizeDoi extracts clean DOI substring', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1145/3318464.3389700'), '10.1145/3318464.3389700');
  assert.equal(normalizeDoi('doi: 10.1038/s41586-020-2649-2 '), '10.1038/s41586-020-2649-2');
  assert.equal(normalizeDoi('invalid-doi-format'), null);
});

test('normalizeAuthors handles strings, arrays, OpenAlex objects, and Crossref objects', () => {
  const openAlexAuthors = [
    { author: { display_name: 'Vaswani, Ashish' } },
    { author: { display_name: 'Noam Shazeer' } }
  ];
  const names = normalizeAuthors(openAlexAuthors);
  assert.deepEqual(names, ['Vaswani, Ashish', 'Noam Shazeer']);

  const crossrefAuthors = [
    { given: 'Geoffrey', family: 'Hinton' }
  ];
  assert.deepEqual(normalizeAuthors(crossrefAuthors), ['Geoffrey Hinton']);

  assert.deepEqual(normalizeAuthors('Alice Smith and Bob Jones'), ['Alice Smith', 'Bob Jones']);
});

test('deduplicatePapers removes duplicate DOIs and near-identical titles', () => {
  const papers = [
    {
      paper_id: 'p1',
      title: 'Attention Is All You Need',
      doi: '10.5555/3295222.3295349',
      year: 2017
    },
    {
      paper_id: 'p2',
      title: 'Attention Is All You Need (Extended Edition)',
      doi: '10.5555/3295222.3295349', // duplicate DOI
      year: 2017
    },
    {
      paper_id: 'p3',
      title: 'Attention Is All You Need', // duplicate title
      doi: null,
      year: 2017
    },
    {
      paper_id: 'p4',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      doi: '10.18653/v1/N19-1423',
      year: 2019
    }
  ];

  const deduped = deduplicatePapers(papers);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].paper_id, 'p1');
  assert.equal(deduped[1].paper_id, 'p4');
});

test('filterPapers enforces year range, inclusion, and exclusion rules', () => {
  const papers = [
    { title: 'Deep Neural Networks in Healthcare', year: 2023, abstract: 'Explores hospital diagnosis...' },
    { title: 'Early Neural Networks', year: 2010, abstract: 'Historical survey...' },
    { title: 'Quantum Neural Networks', year: 2024, abstract: 'Hardware qubits and gates...' },
    { title: 'Computer Vision Healthcare Survey', year: 2022, abstract: 'Vision transformers for MRI...' }
  ];

  // Year filter
  const modern = filterPapers(papers, { yearRange: [2020, 2025] });
  assert.equal(modern.length, 3);

  // Exclusion filter
  const noQuantum = filterPapers(papers, { exclusionTerms: ['quantum'] });
  assert.equal(noQuantum.length, 3);
  assert.ok(!noQuantum.some(p => p.title.includes('Quantum')));

  // Inclusion filter
  const healthcareOnly = filterPapers(papers, { inclusionTerms: ['healthcare'] });
  assert.equal(healthcareOnly.length, 2);
});

test('expandSearchTerms produces keywords, synonyms and Boolean query variations', () => {
  const expansion = expandSearchTerms(
    'Transformer Architectures for Long-Context Reasoning',
    'How do linear attention mechanisms scale context length?',
    'Computer Science / AI',
    ['efficiency', 'scaling']
  );

  assert.ok(expansion.generatedKeywords.length >= 3);
  assert.ok(expansion.searchQueries.length >= 2);
  assert.ok(expansion.searchQueries.some(q => q.includes('AND') || q.includes('Transformer')));
});

test('calculateRelevanceScore gives high scores to matching titles and abstracts', () => {
  const paper = {
    title: 'Linear Attention Mechanisms for Efficient Long-Context Transformers',
    abstract: 'We scale context lengths up to 1M tokens using novel linear attention formulations with sub-quadratic complexity.',
    keywords: ['linear attention', 'long context', 'transformers'],
    year: 2024,
    citation_count: 320
  };

  const score = calculateRelevanceScore(paper, {
    topic: 'Long-Context Transformer Attention',
    question: 'How to scale attention mechanisms linearly?'
  });

  assert.ok(score >= 0.85);
  assert.ok(score <= 1.0);
});

test('validateModule2Schema detects valid and invalid Output 1 objects', () => {
  const invalidOutput = {
    schema_version: '1.0.0',
    // missing project_id and research_topic
  };
  const resInvalid = validateModule2Schema(invalidOutput);
  assert.equal(resInvalid.valid, false);
  assert.ok(resInvalid.errors.length >= 2);

  const samplePapers = [
    {
      paper_id: 'rs-paper-001',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer'],
      year: 2017,
      doi: '10.5555/3295222.3295349',
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
      source: 'arXiv',
      verified_source_url: 'https://arxiv.org/abs/1706.03762',
      open_access_status: 'gold',
      full_text_status: 'available',
      pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
      relevance_score: 0.98,
      relevance_explanation: 'Foundational paper introducing the Transformer architecture.'
    }
  ];

  const validOutput = buildModule2Output({
    topic: 'Transformer Attention',
    question: 'What is self-attention?',
    papers: samplePapers
  });

  const resValid = validateModule2Schema(validOutput);
  assert.equal(resValid.valid, true);
  assert.equal(resValid.errors.length, 0);
  assert.equal(resValid.paperCount, 1);
});
