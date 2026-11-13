import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOutput2Payload,
  normalizeObservations,
  clusterObservations,
  detectContradictionsAndTensions,
  formulateCandidateGaps,
  buildFinalGapReport,
  generateMarkdownReport,
  assessEvidenceSufficiency,
  SAMPLE_OUTPUT_2
} from './researchGapEngine.js';

const CRISPR_OUTPUT_2 = {
  schema_version: '2.0.0',
  project_id: 'rs-crispr-test',
  research_topic: 'CRISPR-Cas9 Gene Editing Specificity in Primary T Cells',
  research_question: 'What limits on-target efficiency vs off-target cleavage across delivery vectors?',
  analyses: [
    {
      paper_id: 'crispr-001',
      title: 'High-Fidelity Cas9 RNP Delivery in Primary Human T Cells',
      authors: ['A. Patel', 'B. Chen'],
      year: 2023,
      source: 'OpenAlex',
      document_status: 'full_text',
      objective: 'Maximize knockout efficiency while reducing off-target indels in primary T cells.',
      methodology: 'Electroporation of recombinant HiFi-Cas9 ribonucleoprotein complexes with GUIDE-seq profiling.',
      algorithms: ['GUIDE-seq Off-Target Profiling', 'HiFi-Cas9'],
      dataset: { name: 'Primary T-Cell Cohort', size: '24 donors', domain: 'Gene Editing' },
      evaluation_metrics: ['Editing Efficiency (%)', 'Off-Target Indel Frequency'],
      reported_results: ['Achieved 91.4% TRAC knockout with <0.1% off-target indels across 24 donors.'],
      reported_performance: '91.4% on-target efficiency',
      limitations: ['High electroporation cytotoxicity reduces post-editing cell viability below 65% in fragile patient samples.'],
      future_work: ['Evaluate non-viral lipid nanoparticles (LNPs) to preserve post-delivery viability.'],
      evidence: [
        {
          paper_id: 'crispr-001',
          finding: 'Limitations',
          page: 7,
          section: 'Discussion',
          excerpt: 'High electroporation cytotoxicity reduces post-editing cell viability below 65% in fragile patient samples.',
          evidence_status: 'verbatim_full_text',
          verification_status: 'verified'
        }
      ]
    },
    {
      paper_id: 'crispr-002',
      title: 'Lipid Nanoparticle Mediated CRISPR Delivery for Immunotherapy',
      authors: ['C. Rivera'],
      year: 2024,
      source: 'arXiv',
      document_status: 'full_text',
      objective: 'Replace electroporation with ionizable LNP delivery of Cas9 mRNA.',
      methodology: 'Formulated ionizable lipid nanoparticles encapsulating Cas9 mRNA and sgRNA.',
      algorithms: ['LNP mRNA Delivery'],
      dataset: { name: 'Ex Vivo PBMCs', size: '12 donors', domain: 'Gene Editing' },
      evaluation_metrics: ['Cell Viability (%)', 'Knockout Efficiency (%)'],
      reported_results: ['Preserved 88% cell viability but yielded lower knockout efficiency (64%) than RNP electroporation.'],
      reported_performance: '88% cell viability, 64% knockout',
      limitations: ['Prolonged mRNA expression increases off-target cleavage risk compared to transient RNP complexes.'],
      future_work: ['Combine direct RNP encapsulation inside biodegradable LNP shells to improve viability without off-target spikes.'],
      evidence: [
        {
          paper_id: 'crispr-002',
          finding: 'Limitations',
          page: 5,
          section: 'Limitations',
          excerpt: 'Prolonged mRNA expression increases off-target cleavage risk compared to transient RNP complexes.',
          evidence_status: 'verbatim_full_text',
          verification_status: 'verified'
        }
      ]
    }
  ]
};

test('validateOutput2Payload validates compliant Output 2 JSON correctly', () => {
  const result = validateOutput2Payload(SAMPLE_OUTPUT_2);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.coverage.totalPapers, 3);
  assert.equal(result.coverage.fullTextCount, 2);
  assert.equal(result.coverage.abstractOnlyCount, 1);
});

test('validateOutput2Payload detects missing fields or wrong schema_version', () => {
  const invalid = {
    schema_version: '1.0.0',
    project_id: 'test'
  };
  const result = validateOutput2Payload(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Expected "2.0.0"')));
});

test('normalizeObservations strips Not reported placeholders and preserves null pages for abstract-only items', () => {
  const normalized = normalizeObservations(SAMPLE_OUTPUT_2.analyses);
  assert.ok(!normalized.metrics.includes('Not reported'));
  assert.ok(!normalized.reportedResults.some(r => r.text === 'Not reported'));
  const absEvidence = normalized.evidenceBank.find(e => e.paper_id === 'demo-paper-003');
  assert.ok(absEvidence);
  assert.equal(absEvidence.page, null);
});

test('clusterObservations dynamically clusters domain-specific observations without unrelated Attention boilerplate', () => {
  const normalized = normalizeObservations(CRISPR_OUTPUT_2.analyses);
  const clusters = clusterObservations(normalized, CRISPR_OUTPUT_2.analyses);
  assert.ok(clusters.length >= 1);
  // Must NOT inject hardcoded quadratic memory or INT8 quantization boilerplate into a CRISPR corpus
  const combinedText = JSON.stringify(clusters).toLowerCase();
  assert.ok(!combinedText.includes('quadratic memory'));
  assert.ok(!combinedText.includes('int8'));
});

test('formulateCandidateGaps traces directly to real paper IDs, comparative findings, and distinguishes speculative opportunities', () => {
  const normalized = normalizeObservations(CRISPR_OUTPUT_2.analyses);
  const clusters = clusterObservations(normalized, CRISPR_OUTPUT_2.analyses);
  const tensions = detectContradictionsAndTensions(CRISPR_OUTPUT_2.analyses, normalized);
  const gaps = formulateCandidateGaps(clusters, normalized, CRISPR_OUTPUT_2.analyses, CRISPR_OUTPUT_2.research_topic, tensions);

  assert.ok(gaps.length >= 2);
  const validIds = new Set(['crispr-001', 'crispr-002']);

  gaps.forEach(g => {
    assert.ok(g.gap_id);
    assert.ok(g.title);
    assert.ok(g.description);
    assert.ok(g.why_gap_exists);
    assert.ok(g.research_significance);
    assert.ok(g.potential_methodology);
    assert.ok(['Strong evidence', 'Moderate evidence', 'Limited evidence', 'Speculative opportunity'].includes(g.evidence_strength_label));
    assert.ok(g.supporting_papers.length > 0);
    g.supporting_papers.forEach(sp => assert.ok(validIds.has(sp.paper_id)));
    assert.ok(g.supporting_evidence.length > 0);
    g.supporting_evidence.forEach(ev => {
      assert.ok(validIds.has(ev.paper_id));
      assert.equal(typeof ev.page, 'number');
    });
  });

  assert.ok(gaps.some(g => g.is_speculative === false));
  assert.ok(gaps.some(g => g.is_speculative === true && g.evidence_strength_label === 'Speculative opportunity'));
});

test('Insufficient evidence: sparse Not-reported papers do NOT fabricate gaps and flag more papers needed', () => {
  const sparseOutput2 = {
    schema_version: '2.0.0',
    project_id: 'rs-sparse',
    research_topic: 'Novel Ceramic Superconductors',
    analyses: [
      {
        paper_id: 'sparse-1',
        title: 'Brief Abstract Note 1',
        authors: ['X. Doe'],
        year: 2025,
        document_status: 'abstract_only',
        objective: 'Investigate ceramic superconductor synthesis.',
        methodology: 'Not reported',
        algorithms: ['Not reported'],
        dataset: { name: 'Not reported', size: 'Not reported', domain: 'Not reported' },
        evaluation_metrics: ['Not reported'],
        reported_results: ['Not reported'],
        limitations: ['Not reported'],
        future_work: ['Not reported'],
        evidence: []
      },
      {
        paper_id: 'sparse-2',
        title: 'Brief Abstract Note 2',
        authors: ['Y. Roe'],
        year: 2025,
        document_status: 'abstract_only',
        objective: 'Screen candidate oxides.',
        methodology: 'Not reported',
        algorithms: ['Not reported'],
        dataset: { name: 'Not reported', size: 'Not reported', domain: 'Not reported' },
        evaluation_metrics: ['Not reported'],
        reported_results: ['Not reported'],
        limitations: ['Not reported'],
        future_work: ['Not reported'],
        evidence: []
      }
    ]
  };

  const normalized = normalizeObservations(sparseOutput2.analyses);
  const clusters = clusterObservations(normalized, sparseOutput2.analyses);
  const tensions = detectContradictionsAndTensions(sparseOutput2.analyses, normalized);
  const gaps = formulateCandidateGaps(clusters, normalized, sparseOutput2.analyses, sparseOutput2.research_topic, tensions);
  const report = buildFinalGapReport(sparseOutput2, gaps, clusters, tensions, normalized);

  assert.equal(gaps.length, 0);
  assert.equal(report.evidence_sufficiency.is_sufficient, false);
  assert.equal(report.evidence_sufficiency.sufficiency_level, 'insufficient');
  assert.ok(report.evidence_sufficiency.message.toLowerCase().includes('more research papers'));
});

test('buildFinalGapReport compiles all 10 comparative dimensions and Output 3 schema with export support', () => {
  const normalized = normalizeObservations(CRISPR_OUTPUT_2.analyses);
  const clusters = clusterObservations(normalized, CRISPR_OUTPUT_2.analyses);
  const tensions = detectContradictionsAndTensions(CRISPR_OUTPUT_2.analyses, normalized);
  const gaps = formulateCandidateGaps(clusters, normalized, CRISPR_OUTPUT_2.analyses, CRISPR_OUTPUT_2.research_topic, tensions);
  const report = buildFinalGapReport(CRISPR_OUTPUT_2, gaps, clusters, tensions, normalized);

  assert.equal(report.schema_version, '3.0.0');
  assert.equal(report.research_topic, CRISPR_OUTPUT_2.research_topic);
  assert.equal(report.papers_analysed.length, 2);
  assert.ok(report.comparative_findings.objectives_comparison);
  assert.ok(report.comparative_findings.methodologies_and_algorithms_comparison);
  assert.ok(report.comparative_findings.datasets_comparison);
  assert.ok(report.comparative_findings.evaluation_metrics_comparison);
  assert.ok(report.comparative_findings.reported_results_comparison);
  assert.ok(Array.isArray(report.comparative_findings.recurring_limitations));
  assert.ok(Array.isArray(report.comparative_findings.contradictory_findings));
  assert.ok(Array.isArray(report.comparative_findings.underexplored_research_areas));
  assert.ok(Array.isArray(report.comparative_findings.methodological_limitations));
  assert.ok(Array.isArray(report.comparative_findings.future_research_opportunities));
  assert.ok(report.evidence_strength_ratings.length === gaps.length);
  assert.ok(report.overall_conclusion.length > 30);

  const md = generateMarkdownReport(report);
  assert.ok(md.includes('# Evidence-Grounded Research Gap Analysis: CRISPR-Cas9'));
  assert.ok(!md.includes('Page null'));
  assert.ok(!md.includes('quadratic memory'));
});
