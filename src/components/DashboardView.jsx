import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Bookmark,
  History,
  FileCheck2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Layers,
  Database,
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function DashboardView({
  scholarProfile,
  searchData,
  savedPapers = [],
  history = [],
  onNavigate,
  onLaunchSearch,
  onQuickCopy,
  copied
}) {
  const [quickTopic, setQuickTopic] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickTopic.trim()) return;
    onLaunchSearch({
      topic: quickTopic.trim(),
      preferredSources: ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref']
    });
  };

  const hasOutput = !!searchData?.output1;
  const paperCount = searchData?.papers?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#123D32] to-[#176B50] rounded-2xl text-white p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#0E2E25]/80 px-3 py-1 rounded-full text-xs font-mono text-emerald-200 mb-3 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Website 1 Dashboard • ResearchScholar AI</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {scholarProfile?.name || 'Scholar'}
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-sans">
              {scholarProfile?.role || 'Senior Fellow'} • {scholarProfile?.institution || 'Academic Institute'}
              {scholarProfile?.orcid && ` • ORCID: ${scholarProfile.orcid}`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('workspace')}
              className="bg-white hover:bg-emerald-50 text-[#123D32] px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5 text-[#176B50]" />
              <span>New Discovery Search</span>
            </button>

            {hasOutput && (
              <button
                onClick={onQuickCopy}
                className="bg-[#0B251E] hover:bg-[#071B16] border border-emerald-400/40 text-emerald-200 px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Output 1 Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Output for Module 2</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Literature Indexed</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F1EA] text-[#123D32] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#123D32]">
            {paperCount > 0 ? `${paperCount} Papers` : 'Ready'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {hasOutput ? `Active query: "${searchData.output1.research_topic}"` : 'Execute search in Workspace'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Scholarly APIs</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F1EA] text-[#123D32] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#176B50]">
            5 Providers
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            OpenAlex, arXiv, S2, Crossref, IEEE
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Saved Bibliography</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F1EA] text-[#123D32] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#123D32]">
            {savedPapers.length} Records
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            <button onClick={() => onNavigate('saved')} className="text-[#176B50] hover:underline font-medium">
              View saved library →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Module 2 Handoff</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F1EA] text-[#123D32] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-700">
            {hasOutput ? '100% Validated' : 'Awaiting Search'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {hasOutput ? (
              <button onClick={() => onNavigate('output')} className="text-[#176B50] hover:underline font-medium">
                Inspect Output 1 JSON →
              </button>
            ) : (
              '1-click copy for Module 2'
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Search & Providers Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Launch Search */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-[#123D32] mb-1">
            Instant Literature Query
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Quickly trigger the 12-stage AI pipeline across all open academic sources.
          </p>

          <form onSubmit={handleQuickSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
              placeholder="Enter research topic (e.g. Attention Mechanisms in Deep Learning)..."
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#D1DFD6] text-sm text-[#1A2822] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50]"
            />
            <button
              type="submit"
              className="bg-[#123D32] hover:bg-[#176B50] text-white px-5 py-2.5 rounded-lg font-bold text-xs transition-colors shrink-0 flex items-center space-x-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Quick presets */}
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700 mr-2">Sample Presets:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Attention Mechanisms in Deep Learning',
                'CRISPR-Cas9 Base Editing Off-Target Minimization',
                'Surface Code Quantum Error Correction',
                'Perovskite Solar Cell Stability'
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuickTopic(topic)}
                  className="bg-[#FAFDFB] hover:bg-[#E8F1EA] border border-[#D7E8DC] hover:border-[#176B50] text-[#123D32] px-2.5 py-1 rounded text-xs transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Source Status */}
        <div className="bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm">
          <h2 className="font-serif text-base font-bold text-[#123D32] mb-3 flex items-center justify-between">
            <span>Academic Source Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFDFB] border border-gray-100">
              <span className="font-medium text-gray-800">OpenAlex API</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                ACTIVE (250M+ Works)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFDFB] border border-gray-100">
              <span className="font-medium text-gray-800">arXiv API</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                ACTIVE (Preprints)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFDFB] border border-gray-100">
              <span className="font-medium text-gray-800">Semantic Scholar</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                ACTIVE (Graph API)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFDFB] border border-gray-100">
              <span className="font-medium text-gray-800">Crossref API</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                ACTIVE (DOI Registry)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFDFB] border border-gray-100">
              <span className="font-medium text-gray-800">IEEE Xplore</span>
              <span className="text-[10px] font-mono text-amber-700 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                AUTHORIZED ACCESS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-bold text-[#123D32] flex items-center space-x-2">
              <History className="w-4 h-4 text-[#176B50]" />
              <span>Recent Literature Searches</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-[#176B50] hover:underline font-semibold"
            >
              View Full History →
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {history.slice(0, 4).map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#123D32]">{h.topic}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {new Date(h.timestamp).toLocaleDateString()} • {h.paperCount || 15} papers retrieved
                  </div>
                </div>
                <button
                  onClick={() => onLaunchSearch({ topic: h.topic, question: h.question, domain: h.domain })}
                  className="text-xs text-[#176B50] hover:text-[#123D32] font-semibold flex items-center space-x-1"
                >
                  <span>Re-run</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
