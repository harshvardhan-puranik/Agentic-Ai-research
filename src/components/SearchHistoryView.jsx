import React from 'react';
import {
  History,
  Trash2,
  ArrowRight,
  Search,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function SearchHistoryView({
  history = [],
  onRerunSearch,
  onClearHistory,
  onGoToWorkspace
}) {
  if (!history || history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#123D32] mb-2">
          No Search History Recorded
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          Past literature searches and discovery sessions will be recorded here for 1-click re-execution.
        </p>
        <button
          onClick={onGoToWorkspace}
          className="bg-[#123D32] hover:bg-[#176B50] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Formulate Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#176B50] uppercase tracking-wider font-mono">
            <History className="w-4 h-4" />
            <span>Search Audit Log</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D32] mt-1">
            Historical Discovery Queries ({history.length})
          </h1>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1.5 text-xs text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-[#D7E8DC] hover:border-[#176B50] p-4 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center space-x-2 text-[11px] text-gray-500 mb-1">
                <span className="flex items-center font-mono">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.domain && (
                  <>
                    <span>•</span>
                    <span className="bg-[#E8F1EA] text-[#123D32] px-1.5 py-0.2 rounded font-mono font-semibold">
                      {item.domain}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="font-mono text-emerald-800 font-semibold">
                  {item.paperCount || 15} papers retrieved
                </span>
              </div>

              <h2 className="font-serif text-base font-bold text-[#123D32]">
                {item.topic}
              </h2>

              {item.question && (
                <p className="text-xs text-gray-600 italic font-serif mt-0.5">
                  "{item.question}"
                </p>
              )}

              {item.sources && (
                <div className="text-[10px] text-gray-500 font-mono mt-1">
                  Sources: {item.sources.join(', ')}
                </div>
              )}
            </div>

            <button
              onClick={() => onRerunSearch(item)}
              className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#123D32] text-[#123D32] hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Re-run Discovery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
