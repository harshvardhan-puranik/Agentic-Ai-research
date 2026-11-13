import React from 'react';
import {
  History,
  Trash2,
  Cpu,
  ArrowRight,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export default function AnalysisHistoryView({
  history = [],
  onLoadRun,
  onClearHistory,
  onNavigateToImport
}) {
  if (!history || history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center mx-auto">
          <History className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#123D32]">
          No Historical Analysis Runs
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Whenever you import Output 1 from Module 1 and run the 17-step pipeline, an auditable record is preserved in your workspace history.
        </p>
        <button
          type="button"
          onClick={onNavigateToImport}
          className="inline-flex items-center space-x-2 bg-[#123D32] hover:bg-[#176B50] text-white py-2.5 px-4 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
        >
          <span>Open Import Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#D1DFD6] pb-4 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#176B50] font-semibold bg-[#E8F1EA] px-2.5 py-1 rounded mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#123D32]">
            Historical Analysis Runs ({history.length})
          </h1>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="flex items-center space-x-1.5 text-xs text-stone-500 hover:text-red-700 bg-white hover:bg-red-50 border border-stone-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Runs List */}
      <div className="space-y-3">
        {history.map((run, idx) => (
          <div
            key={run.id || idx}
            className="bg-white border border-[#D1DFD6] rounded-xl p-5 shadow-sm hover:border-[#176B50] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono font-bold text-emerald-800 bg-[#E8F1EA] px-2 py-0.5 rounded">
                  {run.project_id || 'rs-proj-xxxx'}
                </span>
                <span className="text-stone-400">•</span>
                <span className="text-stone-500 text-[11px] font-mono">
                  {new Date(run.timestamp).toLocaleString()}
                </span>
                <span className="text-stone-400">•</span>
                <span className="font-semibold text-emerald-700">
                  {run.analyses?.length || 0} Papers Analyzed
                </span>
              </div>

              <h3 className="font-serif font-bold text-base text-[#123D32]">
                {run.research_topic}
              </h3>

              {run.research_question && (
                <p className="text-xs text-stone-600 italic">
                  "{run.research_question}"
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onLoadRun(run)}
              className="flex items-center space-x-1.5 bg-[#176B50] hover:bg-[#123D32] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex-shrink-0 self-start sm:self-auto"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-300" />
              <span>Inspect Run</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
