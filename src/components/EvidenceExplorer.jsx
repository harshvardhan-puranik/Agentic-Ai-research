import React, { useState } from 'react';
import {
  CheckCircle,
  Search,
  Filter,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard.js';

export default function EvidenceExplorer({ analyses = [], onNavigateToOutput }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paperFilter, setPaperFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Flatten all evidence claims across papers
  const allEvidence = analyses.flatMap((paper) =>
    (paper.evidence || []).map((ev, index) => ({
      ...ev,
      evidenceId: `${paper.paper_id}-ev-${index}`,
      paperTitle: paper.title,
      paperAuthors: paper.authors,
      paperYear: paper.year,
      paperDoi: paper.doi
    }))
  );

  const filteredEvidence = allEvidence.filter((item) => {
    if (paperFilter !== 'ALL' && item.paper_id !== paperFilter) return false;
    if (statusFilter !== 'ALL' && item.verification_status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const text = `${item.excerpt} ${item.section} ${item.paperTitle}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const handleCopyClaim = async (item) => {
    const pageLabel = typeof item.page === 'number' ? `Page ${item.page}` : 'Abstract Only';
    const text = `"${item.excerpt}" — [${item.paperTitle} (${item.paperYear}), ${pageLabel}, Section: ${item.section}, Status: ${item.evidence_status || item.verification_status}]`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(item.evidenceId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#D1DFD6] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#176B50] font-semibold bg-[#E8F1EA] px-2.5 py-1 rounded mb-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verifiable Evidence Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#123D32]">
            Evidence Explorer &amp; Claim Grounding
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Every analytical claim in Module 2 is grounded in original paper passages with page mapping and verification status.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToOutput}
          className="flex items-center space-x-1.5 bg-[#123D32] hover:bg-[#176B50] text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer self-start md:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-300" />
          <span>Output 2 Console (Module 3)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#D1DFD6] rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claim text, sections, concepts..."
            className="w-full pl-9 pr-3 py-2 border border-[#D1DFD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B50] bg-white text-[#1D2A24]"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={paperFilter}
            onChange={(e) => setPaperFilter(e.target.value)}
            className="w-full py-2 px-3 border border-[#D1DFD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B50] bg-white text-[#1D2A24]"
          >
            <option value="ALL">All Papers ({analyses.length})</option>
            {analyses.map((p) => (
              <option key={p.paper_id} value={p.paper_id}>
                {p.paper_id}: {p.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-[#D1DFD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B50] bg-white text-[#1D2A24]"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="verified">Verified (Direct Full-Text PDF)</option>
            <option value="abstract_only">Abstract-Only (No PDF)</option>
            <option value="inferred">Inferred</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between text-xs text-stone-600 px-1 font-mono">
        <span>Showing {filteredEvidence.length} of {allEvidence.length} Grounded Excerpts</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5"></span>
            Full-Text Verified: {allEvidence.filter((e) => e.verification_status === 'verified').length}
          </span>
          <span className="flex items-center text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
            Abstract-Only: {allEvidence.filter((e) => e.verification_status === 'abstract_only' || e.verification_status === 'inferred').length}
          </span>
        </div>
      </div>

      {/* Evidence Cards List */}
      <div className="space-y-4">
        {filteredEvidence.length === 0 ? (
          <div className="bg-white border border-[#D1DFD6] rounded-xl p-8 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-600">No evidence passages match your filters.</p>
            <p className="text-xs text-stone-400">Try adjusting your search query or reset the dropdowns.</p>
          </div>
        ) : (
          filteredEvidence.map((item) => {
            const isCopied = copiedId === item.evidenceId;
            return (
              <div
                key={item.evidenceId}
                className="bg-white border border-[#D1DFD6] rounded-xl p-5 shadow-sm space-y-3 hover:border-[#176B50] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono font-bold text-emerald-800 bg-[#E8F1EA] px-2 py-0.5 rounded">
                      {item.paper_id}
                    </span>
                    <span className="font-semibold text-stone-800 font-serif">
                      {item.paperTitle} ({item.paperYear})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {item.finding && (
                      <span className="text-[11px] font-semibold text-[#123D32] bg-[#E8F1EA] px-2 py-0.5 rounded">
                        {item.finding}
                      </span>
                    )}
                    <span className="text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {typeof item.page === 'number' ? `Page ${item.page}` : 'Abstract Only'} • {item.section}
                    </span>
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
                </div>

                <blockquote className="text-xs sm:text-sm text-stone-800 italic bg-[#FAFCFA] p-3 rounded-lg border border-[#E0ECE4] leading-relaxed font-serif">
                  "{item.excerpt}"
                </blockquote>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-stone-500 font-mono">
                    {item.paperDoi ? `doi:${item.paperDoi}` : 'Canonical Registry Link'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyClaim(item)}
                    className="flex items-center space-x-1.5 text-xs text-[#176B50] hover:text-[#123D32] bg-[#E8F1EA] hover:bg-[#D7E8DC] px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied Evidence Note</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Claim &amp; Citation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
