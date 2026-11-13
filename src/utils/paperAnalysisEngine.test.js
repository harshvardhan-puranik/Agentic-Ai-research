import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOutput1Payload,
  validatePdfFile,
  identifySectionHeadings,
  chunkDocumentWithPages,
  retrieveRelevantChunks,
  findActualPageForExcerpt,
  analyzePaperRecord,
  generateCrossPaperSynthesis,
  buildModule3Output,
  validateModule3Schema,
  NOT_REPORTED,
  SAMPLE_OUTPUT_1
} from './paperAnalysisEngine.js';

test('validateOutput1Payload validates compliant Output 1 JSON correctly', () => {
  const result = validateOutput1Payload(SAMPLE_OUTPUT_1);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.paperCount, 5);
  assert.equal(result.project_id, 'rs-proj-mwd1ajtz');
  assert.equal(result.research_topic, 'Attention Mechanisms in Deep Learning');
});

test('validateOutput1Payload catches missing required fields', () => {
  const invalidPayload = { schema_version: '1.0.0' };
  const result = validateOutput1Payload(invalidPayload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('project_id')));
  assert.ok(result.errors.some(e => e.includes('research_topic')));
  assert.ok(result.errors.some(e => e.includes('papers')));
});

test('validatePdfFile enforces PDF MIME, extension and size limits', () => {
  const validFile = { name: 'paper.pdf', type: 'application/pdf', size: 1024 * 500 };
  assert.equal(validatePdfFile(validFile).valid, true);

  const nonPdfFile = { name: 'paper.docx', type: 'application/msword', size: 1024 * 500 };
  assert.equal(validatePdfFile(nonPdfFile).valid, false);

  const oversizedFile = { name: 'large.pdf', type: 'application/pdf', size: 40 * 1024 * 1024 };
  assert.equal(validatePdfFile(oversizedFile).valid, false);
});

test('identifySectionHeadings preserves real page numbers across multi-page documents', () => {
  const pages = [
    { pageNumber: 1, text: 'Abstract\nWe investigate quantum error correction in superconducting qubits.' },
    { pageNumber: 2, text: '1. Introduction\nDecoherence remains the key challenge in quantum processors.\n3. Methodology\nWe employ surface code stabilizer measurements.' },
    { pageNumber: 3, text: '4. Results\nOur experiments achieve a logical error rate of 0.14% per cycle.\nLimitations\nCryogenic wiring overhead limits qubit scaling.' }
  ];

  const sections = identifySectionHeadings(pages);
  const intro = sections.find(s => s.heading === 'Introduction');
  const methods = sections.find(s => s.heading === 'Methodology & Proposed Architecture');
  const results = sections.find(s => s.heading === 'Results & Findings');
  const limits = sections.find(s => s.heading === 'Limitations');

  assert.equal(intro?.page, 2);
  assert.equal(methods?.page, 2);
  assert.equal(results?.page, 3);
  assert.equal(limits?.page, 3);
});

test('chunkDocumentWithPages and retrieveRelevantChunks select relevant pages from large docs', () => {
  const pages = Array.from({ length: 12 }, (_, idx) => ({
    pageNumber: idx + 1,
    text:
      idx === 4
        ? 'Methodology\nWe train a Surface Code Decoder using a Graph Neural Network on 50,000 syndrome samples.'
        : idx === 8
        ? 'Results\nThe decoder achieves 99.2% logical fidelity and reduces inference latency to 1.4 microseconds.\nLimitations\nPerformance degrades under correlated leakage noise.'
        : `Background filler paragraph on page ${idx + 1} discussing historical literature context.`
  }));

  const chunks = chunkDocumentWithPages(pages, 1000, 100);
  assert.equal(chunks.length, 12);

  const relevant = retrieveRelevantChunks(chunks, 'surface code decoder accuracy limitations', 4);
  assert.equal(relevant.length, 4);
  const selectedPages = relevant.map(c => c.startPage);
  assert.ok(selectedPages.includes(5), 'Must retrieve methodology page 5');
  assert.ok(selectedPages.includes(9), 'Must retrieve results & limitations page 9');
});

test('analyzePaperRecord does NOT invent datasets, accuracy numbers, or page numbers when missing', () => {
  const sparsePaper = {
    paper_id: 'rs-sparse-001',
    title: 'Theoretical Remarks on Ceramic Catalysis',
    authors: ['A. Researcher'],
    year: 2025,
    abstract: 'This conceptual note discusses thermal stability mechanisms in porous ceramic catalysts without reporting experimental benchmarks.',
    open_access_status: 'gold',
    pdf_url: 'https://example.org/unavailable.pdf' // even with pdf_url, no actual fullText/pages parsed!
  };

  const analysis = analyzePaperRecord(sparsePaper);

  // Must honestly mark abstract_only since no PDF pages were extracted
  assert.equal(analysis.document_status, 'abstract_only');
  assert.equal(analysis.analysis_status, 'completed_abstract_only');

  // Must NEVER invent results, datasets, algorithms, or limitations
  assert.equal(analysis.dataset.name, NOT_REPORTED);
  assert.deepEqual(analysis.algorithms, [NOT_REPORTED]);
  assert.deepEqual(analysis.metrics, [NOT_REPORTED]);
  assert.deepEqual(analysis.reported_results, [NOT_REPORTED]);
  assert.equal(analysis.reported_performance, NOT_REPORTED);
  assert.deepEqual(analysis.limitations, [NOT_REPORTED]);

  // Must NEVER fabricate page numbers when abstract-only
  assert.ok(analysis.evidence.length >= 1);
  assert.equal(analysis.evidence[0].page, null);
  assert.equal(analysis.evidence[0].evidence_status, 'verbatim_abstract');
});

test('analyzePaperRecord grounds full-text PDF claims to exact actual page numbers', () => {
  const pages = [
    {
      pageNumber: 1,
      text: 'Abstract\nIn this paper, we propose a Transformer decoder for clinical ECG classification.'
    },
    {
      pageNumber: 2,
      text: 'Methodology\nWe train our model on the MIMIC-IV dataset containing 42,000 samples using binary cross-entropy loss.'
    },
    {
      pageNumber: 3,
      text: 'Results\nOur approach achieves 94.6% accuracy and 0.91 ROC-AUC on held-out patient cohorts.\nLimitations\nThe dataset is restricted to single-center ICU recordings.\nFuture Work\nFuture research will validate across multi-center ambulatory telemetry.'
    }
  ];

  const fullPaper = {
    paper_id: 'rs-full-001',
    title: 'Transformer Decoding for Clinical ECG Classification',
    authors: ['Jane Doe'],
    year: 2025,
    abstract: 'In this paper, we propose a Transformer decoder for clinical ECG classification.',
    pages,
    fullText: pages.map(p => p.text).join('\n\n')
  };

  const analysis = analyzePaperRecord(fullPaper);
  assert.equal(analysis.document_status, 'full_text');
  assert.equal(analysis.analysis_status, 'completed_full_text');
  assert.ok(analysis.algorithms.includes('Transformer'));
  assert.equal(analysis.dataset.name, 'MIMIC-III / MIMIC-IV');
  assert.ok(analysis.metrics.some(m => m.includes('Accuracy')));
  assert.ok(analysis.reported_performance.includes('94.6%'));

  // Verify exact page-level evidence mapping
  const resultEv = analysis.evidence.find(e => e.finding === 'Experimental Results');
  const limitEv = analysis.evidence.find(e => e.finding === 'Limitations');
  assert.equal(resultEv?.page, 3);
  assert.equal(limitEv?.page, 3);
  assert.equal(resultEv?.evidence_status, 'verbatim_full_text');
  assert.equal(findActualPageForExcerpt('achieves 94.6% accuracy', pages), 3);
});

test('buildModule3Output generates compliant Output 2 schema accepted by Module 3', () => {
  const analyses = SAMPLE_OUTPUT_1.papers.map(p => analyzePaperRecord(p));
  const synthesis = generateCrossPaperSynthesis(analyses, SAMPLE_OUTPUT_1.research_topic);
  const output2 = buildModule3Output(SAMPLE_OUTPUT_1, analyses, synthesis);

  assert.equal(output2.schema_version, '2.0.0');
  assert.equal(output2.project_id, SAMPLE_OUTPUT_1.project_id);
  assert.equal(output2.research_topic, SAMPLE_OUTPUT_1.research_topic);
  assert.equal(output2.analyses.length, 5);

  const validation = validateModule3Schema(output2);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
  assert.equal(validation.analysisCount, 5);
});

test('analyzePaperRecord preserves inline colon section content (Limitations:, Future Work:) and validateOutput1Payload rejects duplicates', () => {
  const pages = [
    { pageNumber: 1, text: '1. Introduction\nIn this paper we study federated medical imaging using FedAvg on CheXpert dataset.' },
    { pageNumber: 2, text: '4. Results\nOur method achieves 89.3% AUROC.\nLimitations: High communication overhead limits edge deployment.\nFuture Work: Future research will investigate gradient compression.' }
  ];
  const a = analyzePaperRecord({
    paper_id: 'rs-colon-1',
    title: 'Federated Study',
    abstract: 'Federated study abstract.',
    pages,
    fullText: pages.map(p => p.text).join('\n')
  });
  assert.ok(a.limitations.some(l => l.includes('High communication overhead')));
  assert.ok(a.future_work.some(f => f.includes('gradient compression')));
  const limEv = a.evidence.find(e => e.finding === 'Limitations');
  assert.equal(limEv?.page, 2);

  const dup = validateOutput1Payload({
    schema_version: '1.0.0',
    project_id: 'p1',
    research_topic: 'Topic',
    papers: [
      { paper_id: 'rs-paper-001', title: 'A' },
      { paper_id: 'rs-paper-001', title: 'B' }
    ]
  });
  assert.equal(dup.valid, false);
  assert.ok(dup.errors.some(e => e.toLowerCase().includes('duplicate')));
});
