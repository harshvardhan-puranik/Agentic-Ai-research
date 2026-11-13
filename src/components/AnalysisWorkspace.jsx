import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  BookOpen,
  Tag,
  Database,
  BarChart2,
  AlertCircle,
  HelpCircle,
  Table,
  Check
} from 'lucide-react';

export default function AnalysisWorkspace({
  analyses = [],
  synthesis,
  researchTopic,
  projectId,
  isAnalyzing,
  onReRunAnalysis,
  onNavigateToOutput,
  onNavigateToEvidence,
  onNavigateToMatrix,
  onNavigateToPdf
}) {
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'methods', 'data', 'results', 'limits', 'evidence', 'uncertainties'

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center mx-auto shadow-inner animate-spin">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#176B50] font-bold bg-[#E8F1EA] px-3 py-1 rounded">
            17-Stage Pipeline Running
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#123D32]">
            Analyzing Literature &amp; Grounding Claims
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Parsing headings, extracting methodologies, mapping mathematical algorithms, and verifying claim citations against original text excerpts...
          </p>
        </div>
        <div className="max-w-md mx-auto bg-stone-200 h-2 rounded-full overflow-hidden">
          <div className="bg-[#176B50] h-full w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center mx-auto">
          <Cpu className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#123D32]">
          No Papers Analyzed Yet
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Import Output 1 JSON from Module 1 to trigger the autonomous 17-stage paper analysis pipeline.
        </p>
      </div>
    );
  }

  const currentPaper = analyses[selectedPaperIndex] || analyses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="border-b border-[#D1DFD6] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 uppercase font-semibold mb-1">
            <span>Project {projectId}</span>
            <span>•</span>
            <span>{analyses.length} Papers Analyzed</span>
            <span>•</span>
            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Output 2 Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#123D32]">
            {researchTopic}
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            type="button"
            onClick={onNavigateToMatrix}
            className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Comparison Matrix</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToEvidence}
            className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Evidence Explorer</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToOutput}
            className="flex items-center space-x-1.5 bg-[#123D32] hover:bg-[#176B50] text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Output 2 Console (Module 3)</span>
          </button>
        </div>
      </div>

      {/* Synthesis Metric Highlights */}
      {synthesis && (
        <div className="bg-[#E8F1EA] border border-[#C2DAC9] rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#123D32] tracking-wider flex items-center">
              <Sparkles className="w-4 h-4 text-emerald-700 mr-1.5" />
              Cross-Paper Synthesis Overview
            </span>
            <span className="text-xs font-mono text-[#1A4F42] bg-white px-2 py-0.5 rounded border border-[#C2DAC9]">
              Full-Text Coverage: {synthesis.full_text_coverage}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#1A4F42] leading-relaxed">
            {synthesis.synthesized_consensus}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-white/80 p-2.5 rounded-lg border border-[#C2DAC9]">
              <span className="font-bold text-[#123D32] block mb-1">Primary Paradigms Identified:</span>
              <div className="flex flex-wrap gap-1">
                {synthesis.primary_algorithmic_paradigms.map((p, i) => (
                  <span key={i} className="bg-[#E8F1EA] text-[#123D32] px-2 py-0.5 rounded text-[11px] font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-[#C2DAC9]">
              <span className="font-bold text-[#123D32] block mb-1">Primary Evaluation Metrics:</span>
              <div className="flex flex-wrap gap-1">
                {synthesis.dominant_evaluation_metrics.map((m, i) => (
                  <span key={i} className="bg-[#E8F1EA] text-[#123D32] px-2 py-0.5 rounded text-[11px] font-mono">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Layout: Paper List on Left, Deep Tabs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Paper Selector Sidebar */}
        <div className="lg:col-span-4 bg-white border border-[#D1DFD6] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h3 className="font-serif font-bold text-sm text-[#123D32]">
              Analyzed Papers ({analyses.length})
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">Select to Inspect</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {analyses.map((paper, idx) => {
              const isSelected = idx === selectedPaperIndex;
              return (
                <button
                  key={paper.paper_id}
                  onClick={() => setSelectedPaperIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F1EA] border-[#176B50] shadow-sm ring-1 ring-[#176B50]'
                      : 'bg-[#F8FAF9] border-[#E0ECE4] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-[#123D32]">{paper.paper_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        paper.document_status === 'full_text'
                          ? 'bg-emerald-100 text-emerald-800'
                          : paper.document_status === 'scanned_pdf'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {paper.document_status === 'full_text'
                        ? 'Full Text PDF'
                        : paper.document_status === 'scanned_pdf'
                        ? 'Scanned PDF'
                        : 'Abstract Only'}
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-xs text-[#123D32] line-clamp-2">
                    {paper.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-1">
                    <span>{Array.isArray(paper.authors) ? paper.authors[0] : 'Author'} et al.</span>
                    <span>•</span>
                    <span>{paper.year}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">
                      {(paper.algorithms || []).filter(a => a !== 'Not reported').length} Algorithms
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Deep Inspection Details */}
        <div className="lg:col-span-8 bg-white border border-[#D1DFD6] rounded-xl p-6 shadow-sm space-y-6">
          {/* Header of Selected Paper */}
          <div className="border-b border-stone-200 pb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-[#123D32] text-white px-2 py-0.5 rounded font-bold">
                {currentPaper.paper_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-xs ${
                  currentPaper.document_status === 'full_text'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentPaper.document_status === 'scanned_pdf'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentPaper.analysis_scope_label || (currentPaper.document_status === 'full_text' ? 'Full Text Analyzed' : 'Abstract-Only Analysis')}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-600 font-semibold">{currentPaper.source || 'OpenAlex'}</span>
              {currentPaper.document_status !== 'full_text' && onNavigateToPdf && (
                <button
                  type="button"
                  onClick={onNavigateToPdf}
                  className="ml-auto text-[11px] bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-2.5 py-0.5 rounded font-sans font-semibold cursor-pointer"
                >
                  + Upload Full PDF
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#123D32] leading-snug">
              {currentPaper.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
              <span className="font-medium text-stone-800">
                {Array.isArray(currentPaper.authors) ? currentPaper.authors.join(', ') : 'Authors'}
              </span>
              <span>•</span>
              <span>Published {currentPaper.year}</span>
              {currentPaper.doi && currentPaper.doi !== 'N/A' && (
                <>
                  <span>•</span>
                  <a
                    href={`https://doi.org/${currentPaper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-700 hover:underline flex items-center"
                  >
                    <span>doi:{currentPaper.doi}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap border-b border-stone-200 gap-1 text-xs">
            {[
              { id: 'overview', label: 'Objective & Problem' },
              { id: 'methods', label: 'Methodology & Algorithms' },
              { id: 'data', label: 'Datasets & Preprocessing' },
              { id: 'results', label: 'Reported Results & Metrics' },
              { id: 'limits', label: 'Limitations & Future Work' },
              { id: 'evidence', label: `Grounded Evidence (${currentPaper.evidence?.length || 0})` },
              { id: 'uncertainties', label: `Gaps & Missing (${currentPaper.uncertainties?.length || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 font-semibold rounded-t-md transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#176B50] text-[#123D32] bg-[#E8F1EA]'
                    : 'text-stone-600 hover:text-[#123D32] hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="space-y-4 pt-1">
            {/* Tab 1: Objective & Problem */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {currentPaper.ai_interpretation && (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-700 flex flex-col gap-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-[#123D32]">
                        {currentPaper.ai_interpretation.is_ai_generated ? 'In-House Research Intelligence Synthesis' : 'Extractive Verbatim Mode (In-House NLP)'}
                      </span>
                      <span className="text-stone-500">{currentPaper.ai_interpretation.scope}</span>
                    </div>
                    <p className="text-stone-600">{currentPaper.ai_interpretation.note}</p>
                  </div>
                )}

                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#176B50] tracking-wider block">
                    Core Research Objective
                  </span>
                  <p className="text-sm text-stone-800 leading-relaxed font-serif">
                    {currentPaper.objective || 'Not reported'}
                  </p>
                </div>

                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-amber-800 tracking-wider block">
                    Underlying Problem Statement &amp; Bottlenecks
                  </span>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {currentPaper.problem_statement || 'Not reported'}
                  </p>
                </div>

                <div className="bg-[#E8F1EA] border border-[#C2DAC9] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Key Authorship Conclusion
                  </span>
                  <p className="text-xs sm:text-sm text-[#1A4F42] leading-relaxed">
                    {currentPaper.conclusion || 'Not reported'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Methodology & Algorithms */}
            {activeTab === 'methods' && (
              <div className="space-y-4">
                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#176B50] tracking-wider block">
                    Methodological Architecture
                  </span>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {currentPaper.methodology}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Extracted Algorithms &amp; Computational Mechanisms ({currentPaper.algorithms?.length || 0})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentPaper.algorithms?.map((algo, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#FAFCFA] border border-[#D1DFD6] rounded-lg text-xs space-y-1 hover:border-[#176B50] transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-[#123D32]">{algo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Datasets & Preprocessing */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-3">
                  <span className="font-bold text-xs uppercase font-mono text-[#176B50] tracking-wider block">
                    Evaluation Corpus &amp; Datasets
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded border border-stone-200">
                      <span className="text-stone-500 block text-[11px]">Dataset Name</span>
                      <strong className="text-[#123D32] text-sm">{currentPaper.dataset?.name}</strong>
                    </div>
                    <div className="bg-white p-3 rounded border border-stone-200">
                      <span className="text-stone-500 block text-[11px]">Size / Samples</span>
                      <span className="text-stone-800">{currentPaper.dataset?.size}</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-stone-200">
                      <span className="text-stone-500 block text-[11px]">Domain</span>
                      <span className="text-stone-800">{currentPaper.dataset?.domain}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Preprocessing &amp; Augmentation Pipeline
                  </span>
                  <ul className="text-xs text-stone-700 space-y-1.5 list-disc list-inside">
                    {currentPaper.preprocessing?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 4: Results & Metrics */}
            {activeTab === 'results' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#176B50] tracking-wider block">
                    Evaluation Metrics
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentPaper.metrics?.map((m, i) => (
                      <span
                        key={i}
                        className="bg-[#E8F1EA] text-[#123D32] font-semibold text-xs px-3 py-1 rounded-full border border-[#C2DAC9]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Reported Performance Summary
                  </span>
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                    {currentPaper.reported_performance || 'Not reported'}
                  </p>
                </div>

                <div className="bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Reported Empirical Results &amp; Findings
                  </span>
                  <ul className="text-xs sm:text-sm text-stone-800 space-y-2 list-disc list-inside">
                    {currentPaper.reported_results?.map((res, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {res}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 5: Limitations & Future Work */}
            {activeTab === 'limits' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-amber-900 tracking-wider block">
                    Acknowledged Limitations
                  </span>
                  <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside">
                    {currentPaper.limitations?.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#E8F1EA] border border-[#C2DAC9] rounded-lg p-4 space-y-2">
                  <span className="font-bold text-xs uppercase font-mono text-[#123D32] tracking-wider block">
                    Proposed Future Work &amp; Open Questions
                  </span>
                  <ul className="text-xs text-[#1A4F42] space-y-1.5 list-disc list-inside">
                    {currentPaper.future_work?.map((fw, idx) => (
                      <li key={idx}>{fw}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 6: Grounded Evidence */}
            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                  <span>Verbatim claim excerpts verified against original paper passages:</span>
                  <button
                    type="button"
                    onClick={onNavigateToEvidence}
                    className="text-[#176B50] font-semibold hover:underline flex items-center cursor-pointer"
                  >
                    <span>View all in Evidence Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>

                {currentPaper.evidence?.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#F8FAF9] border border-[#D1DFD6] rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-200 px-1.5 py-0.5 rounded">
                          {typeof item.page === 'number' ? `Page ${item.page}` : 'Abstract Only'}
                        </span>
                        <span className="font-semibold text-[#123D32]">{item.finding || item.section}</span>
                        {item.finding && item.section && (
                          <span className="text-stone-500 font-mono text-[10px]">({item.section})</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          item.verification_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.evidence_status || item.verification_status}
                      </span>
                    </div>
                    <blockquote className="italic text-stone-700 bg-white p-2.5 rounded border border-stone-200 leading-relaxed font-serif">
                      "{item.excerpt}"
                    </blockquote>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 7: Uncertainties & Gaps */}
            {activeTab === 'uncertainties' && (
              <div className="space-y-3">
                <span className="text-xs text-stone-600 block">
                  Audited fields where the paper does not disclose complete empirical or architectural specifications:
                </span>

                {currentPaper.uncertainties && currentPaper.uncertainties.length > 0 ? (
                  <div className="space-y-2">
                    {currentPaper.uncertainties.map((u, i) => (
                      <div
                        key={i}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs flex items-start space-x-2 text-stone-800"
                      >
                        <AlertCircle className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
                        <span>{u}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>No unconfirmed fields detected for this document.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
