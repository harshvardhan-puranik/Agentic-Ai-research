import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Printer,
  Code,
  GitCompare,
  RefreshCw
} from 'lucide-react';
import {
  validateOutput2Payload,
  normalizeObservations,
  clusterObservations,
  detectContradictionsAndTensions,
  formulateCandidateGaps,
  buildFinalGapReport,
  generateDocxBlob,
  generateMarkdownReport
} from '../utils/researchGapEngine.js';
import { copyToClipboard } from '../utils/clipboard.js';

export default function Module3GapAnalyzer({
  importedData = null,
  output3Data = null,
  isSynthesizing = false,
  gapError = null,
  onReRunGapAnalysis,
  onNavigateToModule2,
  showToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('gaps'); // 'gaps', 'compare', 'report'
  const [expandedGapId, setExpandedGapId] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const output2Validation = importedData ? validateOutput2Payload(importedData) : { valid: false, errors: [] };
  const hasData = output2Validation.valid;

  // Deterministic grounded baseline only used when App.jsx hasn't populated output3Data yet
  const deterministicResult = useMemo(() => {
    if (!hasData) {
      return { clusters: [], tensions: [], candidateGaps: [], finalReport: null };
    }
    const norm = normalizeObservations(importedData.analyses);
    const cls = clusterObservations(norm, importedData.analyses);
    const tns = detectContradictionsAndTensions(importedData.analyses, norm);
    const gps = formulateCandidateGaps(cls, norm, importedData.analyses, importedData.research_topic, tns);
    const rpt = buildFinalGapReport(importedData, gps, cls, tns, norm);
    return { clusters: cls, tensions: tns, candidateGaps: gps, finalReport: rpt };
  }, [importedData, hasData]);

  const activeResult = output3Data || deterministicResult;
  const { tensions, candidateGaps, finalReport } = activeResult;

  useEffect(() => {
    if (candidateGaps && candidateGaps.length > 0) {
      setExpandedGapId(prev =>
        candidateGaps.some(g => g.gap_id === prev) ? prev : candidateGaps[0].gap_id
      );
    } else {
      setExpandedGapId(null);
    }
  }, [candidateGaps]);

  const formatEvidenceLocation = (ev) => {
    const pagePart = ev && typeof ev.page === 'number' && ev.page > 0 ? `Page ${ev.page}` : 'Abstract / Unpaginated';
    return `${pagePart}, ${ev?.section || 'Body'}`;
  };

  const getStrengthBadgeClasses = (gap) => {
    if (gap.is_speculative || gap.evidence_strength === 'speculative') {
      return 'bg-purple-100 text-purple-900 border border-purple-200';
    }
    if (gap.evidence_strength === 'strong') {
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    }
    if (gap.evidence_strength === 'moderate') {
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    }
    return 'bg-amber-100 text-amber-900 border border-amber-200';
  };

  // Export handlers
  const handleDownloadDocx = () => {
    if (!finalReport) return;
    const blob = generateDocxBlob(finalReport);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResearchScholar_Output3_GapReport_${finalReport.project_id}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Word DOCX report.', 'success');
  };

  const handleCopyMarkdown = async () => {
    if (!finalReport) return;
    const md = generateMarkdownReport(finalReport);
    await copyToClipboard(md);
    setCopiedSection('markdown');
    showToast('Copied full Markdown report to clipboard.', 'success');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJson = async () => {
    if (!finalReport) return;
    await copyToClipboard(JSON.stringify(finalReport, null, 2));
    setCopiedSection('json');
    showToast('Copied Output 3 JSON report to clipboard.', 'success');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadJson = () => {
    if (!finalReport) return;
    const blob = new Blob([JSON.stringify(finalReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResearchScholar_Output3_GapReport_${finalReport.project_id || 'report'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Output 3 JSON report.', 'success');
  };

  const sufficiency = finalReport?.evidence_sufficiency;
  const comparative = finalReport?.comparative_findings;

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2A24] pb-24">
      {/* Module 3 Header Banner */}
      <section className="bg-gradient-to-r from-[#123D32] via-[#176B50] to-[#123D32] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#245D4B] shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-mono text-emerald-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>STEP 3: GAP IDENTIFICATION AGENT</span>
                <span>•</span>
                <span>EVIDENCE-BASED REASONING</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Module 3: Research Gap Identification
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl leading-relaxed font-sans">
                Compares actual findings from Module 2 across objectives, methods, datasets, metrics, results, limitations, and tensions to formulate <strong className="text-white font-semibold">traceable research gaps and the Final Report</strong>.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              {hasData && onReRunGapAnalysis && (
                <button
                  disabled={isSynthesizing}
                  onClick={onReRunGapAnalysis}
                  className="bg-[#0D2D25] hover:bg-[#15463A] border border-emerald-500/40 text-emerald-100 text-xs px-3.5 py-2.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Re-Synthesize Gaps'}</span>
                </button>
              )}
              {hasData && (
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-[#0E3027] text-xs px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <FileText className="w-4 h-4 text-[#0E3027]" />
                  <span>View Final Gap Report</span>
                </button>
              )}
            </div>
          </div>

          {/* Pipeline Breadcrumb */}
          <div className="mt-6 bg-[#0E3027]/90 border border-[#2B7A63] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-200">
              <span className="text-emerald-300/80">1. Discovery Completed</span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="text-emerald-300/80">2. Analysis Completed</span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="bg-emerald-400 text-[#123D32] font-bold px-2 py-0.5 rounded text-[11px]">
                3. Gap Identification Active
              </span>
            </div>

            <div className="text-[11px] font-mono text-emerald-300">
              {hasData
                ? `${candidateGaps.length} item(s) formulated from ${importedData.analyses?.length} papers (${finalReport?.analysis_engine || 'Grounded Comparator'})`
                : 'Waiting for Module 2'}
            </div>
          </div>
        </div>
      </section>

      {/* Sub-navigation tabs */}
      {hasData && (
        <div className="bg-white border-b border-[#D7E8DC] relative z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('gaps')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'gaps'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>1. Identified Research Gaps</span>
                <span className="bg-emerald-100 text-[#123D32] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {candidateGaps.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'compare'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>2. Comparative Analysis &amp; Tensions</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'report'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Final Report &amp; Export</span>
              </button>

              <button
                onClick={() => setShowJsonModal(!showJsonModal)}
                className="text-[#2D4A3E] hover:bg-[#E8F1EA] px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Code className="w-3.5 h-3.5 text-gray-500" />
                <span>View Raw Output 3 JSON</span>
              </button>
            </div>

            <div className="text-xs text-emerald-800 font-medium">
              Topic: <span className="font-bold">{importedData.research_topic}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Validation Error Banner */}
        {gapError && (
          <div className="mb-5 bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 flex items-start space-x-3 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px]">Module 3 Input / Synthesis Error</div>
              <p className="mt-0.5">{gapError}</p>
            </div>
          </div>
        )}

        {/* Active Synthesis Progress Banner */}
        {isSynthesizing && (
          <div className="mb-5 bg-[#0E3027] text-emerald-100 rounded-xl p-4 flex items-center justify-between text-xs shadow-sm border border-emerald-500/40">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin flex-shrink-0" />
              <span>Comparing Module 2 paper findings across all 10 analytical dimensions and verifying citations...</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-300 uppercase">Synthesizing</span>
          </div>
        )}

        {/* EMPTY / GATED STATE */}
        {!hasData && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#D7E8DC] shadow-xs max-w-2xl mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-[#176B50]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#123D32]">
              Waiting for Analyzed Papers
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
              Module 3 compares papers analyzed in Module 2 to identify genuine research gaps and build your final report. Analyze papers in Module 2 first.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {onNavigateToModule2 && (
                <button
                  onClick={onNavigateToModule2}
                  className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-2 cursor-pointer shadow"
                >
                  <span>Go to Module 2: Paper Analysis</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sufficiency Notice Banner (when insufficient or limited evidence) */}
        {hasData && sufficiency && (!sufficiency.is_sufficient || sufficiency.sufficiency_level === 'limited') && (
          <div className={`mb-5 rounded-xl border p-4 flex items-start space-x-3 text-xs ${
            !sufficiency.is_sufficient
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-[11px]">
                Corpus Evidence Status: {sufficiency.sufficiency_level}
              </div>
              <p>{sufficiency.message}</p>
              <p className="font-medium opacity-90">{sufficiency.recommendation}</p>
            </div>
          </div>
        )}

        {/* TAB 1: IDENTIFIED RESEARCH GAPS */}
        {hasData && activeTab === 'gaps' && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase bg-[#E8F1EA] text-[#123D32] px-2 py-0.5 rounded font-semibold">
                  Evidence-Grounded Synthesis • {finalReport?.gap_breakdown?.evidence_supported_count || 0} Evidence-Supported, {finalReport?.gap_breakdown?.speculative_opportunities_count || 0} Speculative
                </span>
                <h2 className="text-lg font-serif font-bold text-[#123D32] mt-1">
                  Identified Research Gaps &amp; Opportunities ({candidateGaps.length})
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Synthesized from {importedData.analyses?.length} analyzed paper(s) on "{importedData.research_topic}". Missing metadata ("Not reported") is excluded from gap claims.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('report')}
                className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs self-start md:self-auto"
              >
                <span>Generate Final Report</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </div>

            {candidateGaps.length === 0 ? (
              <div className="bg-white rounded-xl border border-amber-200 p-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-base font-serif font-bold text-[#123D32]">
                  Insufficient Evidence for Cross-Paper Research Gaps
                </h3>
                <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed">
                  {sufficiency?.message || 'The analyzed papers did not report sufficient explicit limitations, problem statements, or experimental evidence. More research papers or full-text PDFs are needed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidateGaps.map((gap) => {
                  const isExpanded = expandedGapId === gap.gap_id;
                  return (
                    <div
                      key={gap.gap_id}
                      className="bg-white rounded-xl border border-[#D7E8DC] hover:border-[#176B50] shadow-xs overflow-hidden transition-all"
                    >
                      {/* Clickable Header */}
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedGapId(isExpanded ? null : gap.gap_id)}
                        className="w-full text-left p-5 flex items-start justify-between cursor-pointer hover:bg-[#FAFDFB] transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded font-bold bg-[#E8F1EA] text-[#123D32]">
                              {gap.gap_id.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              gap.is_speculative
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            }`}>
                              {gap.is_speculative ? 'Speculative Opportunity' : 'Evidence-Supported Gap'}
                            </span>
                            <span className="text-xs font-semibold text-gray-600">{gap.gap_type}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStrengthBadgeClasses(gap)}`}>
                              {gap.evidence_strength_label || gap.evidence_strength}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-[#123D32]">{gap.title}</h3>
                          <p className="text-xs text-gray-700 leading-relaxed">{gap.description || gap.summary}</p>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="hidden sm:inline text-xs text-gray-500 font-mono">
                            {(gap.supporting_papers || []).length} paper(s) • {(gap.supporting_evidence || []).length} excerpt(s)
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Drawer */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-[#FCFDFC] space-y-4 text-xs">
                          {/* Evidence Strength Rationale */}
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <span className="font-bold text-[#123D32] uppercase text-[11px] block mb-0.5">
                              Evidence Strength Rating ({gap.evidence_strength_label || gap.evidence_strength}):
                            </span>
                            <p className="text-gray-700">{gap.evidence_strength_rationale}</p>
                          </div>

                          {/* Why Gap Exists & Significance */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-bold text-gray-800 uppercase text-[11px] mb-1">Why This Gap Exists</h4>
                              <p className="text-gray-700 leading-relaxed">{gap.why_gap_exists}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-bold text-gray-800 uppercase text-[11px] mb-1">Research Significance</h4>
                              <p className="text-gray-700 leading-relaxed">{gap.research_significance}</p>
                            </div>
                          </div>

                          {/* Supporting Papers & Relevant Limitations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-bold text-gray-800 uppercase text-[11px] mb-1">
                                Supporting Papers ({(gap.supporting_papers || []).length})
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {(gap.supporting_papers || []).map((sp, i) => (
                                  <li key={i}>
                                    <strong className="font-mono text-[#123D32]">{sp.paper_id}</strong>: {sp.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-bold text-gray-800 uppercase text-[11px] mb-1">
                                Relevant Limitations Extracted
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {(gap.relevant_limitations || []).map((lim, i) => (
                                  <li key={i}>{lim}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Supporting Evidence Excerpts */}
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Supporting Verbatim Evidence ({(gap.supporting_evidence || []).length})</span>
                            </h4>
                            <div className="space-y-2">
                              {(gap.supporting_evidence || []).map((ev, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-l-[#176B50] border border-gray-200">
                                  <p className="italic text-gray-800 text-xs font-serif">"{ev.excerpt}"</p>
                                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                                    <span>
                                      <strong>{ev.paper_id}</strong> ({ev.paper_title}) • {formatEvidenceLocation(ev)}
                                    </span>
                                    <span className="font-mono text-emerald-700 font-semibold">
                                      ✓ {ev.verification_status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Methodology, Direction, RQs & Objectives */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="bg-[#FAFDFB] p-3 rounded-lg border border-emerald-200">
                              <span className="font-bold text-[#123D32] block mb-1">Potential Methodology:</span>
                              <p className="text-gray-800 text-[11px] leading-relaxed">{gap.potential_methodology}</p>
                            </div>
                            <div className="bg-[#FAFDFB] p-3 rounded-lg border border-emerald-200">
                              <span className="font-bold text-[#123D32] block mb-1">Future Research Direction:</span>
                              <p className="text-gray-800 text-[11px] leading-relaxed">
                                {gap.future_research_direction || (gap.future_directions || []).join('; ')}
                              </p>
                            </div>
                            <div className="bg-[#FAFDFB] p-3 rounded-lg border border-emerald-200">
                              <span className="font-bold text-[#123D32] block mb-1">Possible Research Questions:</span>
                              <p className="font-mono text-gray-800 text-[11px]">
                                {(gap.proposed_research_questions || []).join(' ')}
                              </p>
                            </div>
                            <div className="bg-[#FAFDFB] p-3 rounded-lg border border-emerald-200">
                              <span className="font-bold text-[#123D32] block mb-1">Suggested Objectives:</span>
                              <p className="text-gray-800 text-[11px]">
                                {(gap.proposed_objectives || []).join(' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPARATIVE ANALYSIS & TENSIONS */}
        {hasData && activeTab === 'compare' && comparative && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#123D32]">
                  10-Dimension Comparative Paper Synthesis
                </h2>
                <p className="text-xs text-gray-600">
                  Cross-paper comparison derived strictly from Module 2 extracted fields on "{importedData.research_topic}".
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-[#F8FAF9] rounded-lg border border-[#D7E8DC]">
                  <h3 className="font-bold text-[#123D32] mb-1">1. Research Objectives Comparison</h3>
                  <p className="text-gray-700 mb-2">{comparative.objectives_comparison?.summary}</p>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {(comparative.objectives_comparison?.per_paper || []).map(p => (
                      <li key={p.paper_id}><strong>{p.paper_id}:</strong> {p.objective}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#F8FAF9] rounded-lg border border-[#D7E8DC]">
                  <h3 className="font-bold text-[#123D32] mb-1">2. Methodologies &amp; Algorithms</h3>
                  <p className="text-gray-700 mb-2">{comparative.methodologies_and_algorithms_comparison?.summary}</p>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {(comparative.methodologies_and_algorithms_comparison?.per_paper || []).map(p => (
                      <li key={p.paper_id}><strong>{p.paper_id}:</strong> {p.algorithms.join(', ')}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#F8FAF9] rounded-lg border border-[#D7E8DC]">
                  <h3 className="font-bold text-[#123D32] mb-1">3. Datasets Comparison</h3>
                  <p className="text-gray-700 mb-2">{comparative.datasets_comparison?.summary}</p>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {(comparative.datasets_comparison?.datasets_reported || []).map((d, i) => (
                      <li key={i}><strong>{d.paper_id}:</strong> {d.name} ({d.domain})</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#F8FAF9] rounded-lg border border-[#D7E8DC]">
                  <h3 className="font-bold text-[#123D32] mb-1">4. Evaluation Metrics Comparison</h3>
                  <p className="text-gray-700 mb-2">{comparative.evaluation_metrics_comparison?.summary}</p>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {(comparative.evaluation_metrics_comparison?.per_paper || []).map(p => (
                      <li key={p.paper_id}><strong>{p.paper_id}:</strong> {p.metrics.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAF9] rounded-lg border border-[#D7E8DC] text-xs">
                <h3 className="font-bold text-[#123D32] mb-1">5. Reported Results Comparison</h3>
                <p className="text-gray-700 mb-2">{comparative.reported_results_comparison?.summary}</p>
                <div className="space-y-1.5 text-[11px]">
                  {(comparative.reported_results_comparison?.per_paper || []).map(p => (
                    <div key={p.paper_id} className="bg-white p-2 rounded border border-gray-200">
                      <strong className="text-[#123D32]">{p.paper_id}</strong> ({p.document_status}): {p.reported_performance !== 'Not reported' ? p.reported_performance : (p.reported_results[0] || 'Not reported')}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contradictory Findings & Methodological Limitations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs space-y-2">
                <h3 className="text-sm font-serif font-bold text-[#123D32]">
                  6–7. Contradictory Findings &amp; Cross-Paper Tensions ({tensions.length})
                </h3>
                {tensions.length === 0 ? (
                  <p className="text-gray-600">No direct cross-paper empirical contradictions detected in current corpus.</p>
                ) : (
                  tensions.map(t => (
                    <div key={t.id} className="p-3 bg-[#FAFDFB] rounded-lg border border-gray-200 space-y-1">
                      <div className="font-bold text-[#123D32]">{t.topic}</div>
                      <p className="text-gray-700">• {t.observationA}</p>
                      <p className="text-gray-700">• {t.observationB}</p>
                      <p className="text-[11px] font-mono text-emerald-800">Papers: {(t.paperIds || []).join(', ')}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs space-y-2">
                <h3 className="text-sm font-serif font-bold text-[#123D32]">
                  8–10. Underexplored Areas &amp; Future Opportunities
                </h3>
                <ul className="space-y-1.5 text-gray-700">
                  {(comparative.underexplored_research_areas || []).map((u, idx) => (
                    <li key={idx} className="p-2 bg-[#FAFDFB] rounded border border-gray-200">
                      <span className="font-semibold text-[#123D32]">[{u.basis}]</span> {u.area}
                    </li>
                  ))}
                  {(comparative.future_research_opportunities || []).length === 0 && (comparative.underexplored_research_areas || []).length === 0 && (
                    <li className="text-gray-600">No explicit future directions reported in the analyzed text.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINAL REPORT & EXPORT */}
        {hasData && activeTab === 'report' && finalReport && (
          <div className="space-y-6">
            {/* Export Toolbar */}
            <div className="bg-white rounded-xl border border-[#D7E8DC] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#176B50]" />
                <div>
                  <h2 className="text-sm font-bold text-[#123D32]">Output 3: Final Research Gap Report</h2>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {finalReport.project_id} • Traceable &amp; Export-Ready
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadDocx}
                  className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download DOCX</span>
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedSection === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'markdown' ? 'Copied MD!' : 'Copy Markdown'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Scholarly Report Document */}
            <article className="bg-white rounded-xl border border-[#D7E8DC] shadow-md p-6 sm:p-10 max-w-4xl mx-auto font-serif text-[#1D2A24] space-y-8 leading-relaxed">
              <div className="border-b-2 border-[#123D32] pb-6">
                <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-2">
                  <span>RESEARCHSCHOLAR AI • FINAL REPORT (OUTPUT 3)</span>
                  <span>{new Date(finalReport.report_timestamp).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#123D32] leading-tight font-serif">
                  {finalReport.report_title}
                </h1>
                <p className="text-xs font-sans text-gray-600 mt-2">
                  <strong>Project ID:</strong> <code className="font-mono text-emerald-800">{finalReport.project_id}</code> | <strong>Corpus Size:</strong> {finalReport.corpus_coverage.totalPapers} Papers ({finalReport.corpus_coverage.fullTextCount} full-text, {finalReport.corpus_coverage.abstractOnlyCount} abstract-only)
                </p>
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-sans font-bold text-[#123D32] uppercase tracking-wide border-b border-gray-200 pb-1">
                  1. Executive Summary
                </h2>
                <p className="text-sm text-gray-800 leading-relaxed text-justify font-serif">
                  {finalReport.executive_summary}
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-sans font-bold text-[#123D32] uppercase tracking-wide border-b border-gray-200 pb-1">
                  2. Inquiry &amp; Evidence Grounding Policy
                </h2>
                <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#D7E8DC] text-xs font-sans space-y-1">
                  <div><strong>Primary Inquiry:</strong> {finalReport.research_scope.primary_inquiry}</div>
                  <div><strong>Sufficiency Status:</strong> {finalReport.evidence_sufficiency?.message}</div>
                  <div className="text-emerald-900 font-semibold pt-1">
                    {finalReport.research_scope.anti_hallucination_guarantee}
                  </div>
                </div>
              </section>

              <section className="space-y-4 font-sans">
                <h2 className="text-base font-bold text-[#123D32] uppercase tracking-wide border-b border-gray-200 pb-1">
                  3. Evidence-Grounded Research Gaps &amp; Speculative Opportunities
                </h2>

                {finalReport.candidate_research_gaps.length === 0 ? (
                  <p className="text-xs text-gray-700">{finalReport.evidence_sufficiency?.message}</p>
                ) : (
                  <div className="space-y-4">
                    {finalReport.candidate_research_gaps.map((gap, i) => (
                      <div key={gap.gap_id} className="p-4 bg-[#FAFDFB] border border-[#176B50]/30 rounded-lg space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[#123D32] text-sm">
                            3.{i + 1} [{gap.gap_id.toUpperCase()}] {gap.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStrengthBadgeClasses(gap)}`}>
                            {gap.evidence_strength_label || gap.evidence_strength}
                          </span>
                        </div>

                        <p className="text-gray-700 leading-relaxed font-serif text-xs">
                          {gap.description || gap.summary}
                        </p>

                        <p className="text-[11px] text-gray-600">
                          <strong>Rating Rationale:</strong> {gap.evidence_strength_rationale}
                        </p>

                        {gap.supporting_evidence && gap.supporting_evidence.length > 0 && (
                          <div className="bg-white p-3 rounded border border-gray-200 space-y-1">
                            <span className="font-bold text-emerald-900 text-[11px] block uppercase">
                              Verified Grounded Excerpt:
                            </span>
                            <blockquote className="italic text-gray-700 font-serif border-l-2 border-[#176B50] pl-2.5">
                              "{gap.supporting_evidence[0]?.excerpt}"
                            </blockquote>
                            <div className="text-[10px] text-gray-500 text-right">
                              — {gap.supporting_evidence[0]?.paper_id} ({gap.supporting_evidence[0]?.paper_title}), {formatEvidenceLocation(gap.supporting_evidence[0])}
                            </div>
                          </div>
                        )}

                        <div className="text-[#123D32] pt-1 space-y-1">
                          <div><strong>Potential Methodology:</strong> {gap.potential_methodology}</div>
                          <div><strong>Target RQ:</strong> <em>{(gap.proposed_research_questions || []).join('; ')}</em></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-2 font-sans text-xs">
                <h2 className="text-base font-bold text-[#123D32] uppercase tracking-wide border-b border-gray-200 pb-1">
                  4. Overall Conclusion
                </h2>
                <p className="text-sm text-gray-800 leading-relaxed font-serif">
                  {finalReport.overall_conclusion || finalReport.conclusion}
                </p>
              </section>

              <section className="space-y-2 font-sans text-xs text-gray-700">
                <h2 className="text-base font-bold text-[#123D32] uppercase tracking-wide border-b border-gray-200 pb-1">
                  5. References &amp; Empirical Traceability
                </h2>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  {finalReport.references.map((ref) => (
                    <li key={ref.index}>
                      {ref.citation_text} <span className="font-mono text-emerald-800">[{ref.verified_evidence_citations} verified citations | {ref.document_status}]</span>
                    </li>
                  ))}
                </ol>
              </section>
            </article>
          </div>
        )}

        {/* Raw JSON inspection modal with Copy & Download */}
        {showJsonModal && finalReport && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
                <h3 className="text-sm font-bold text-[#123D32]">Output 3 JSON Manifest (Final Report)</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyJson}
                    className="bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedSection === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'json' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setShowJsonModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <pre className="mt-3 bg-[#0D2D25] text-emerald-200 p-4 rounded-lg font-mono text-xs overflow-auto flex-1">
                {JSON.stringify(finalReport, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
