import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  ShieldCheck,
  Unlock,
  Lock
} from 'lucide-react';
import { generateBibTeX } from '../utils/storage.js';
import { copyTextToClipboard } from '../utils/clipboard.js';

export default function PaperDetailsModal({
  paper,
  onClose,
  onSave,
  isSaved = false
}) {
  const [citationFormat, setCitationFormat] = useState('bibtex'); // 'bibtex' | 'apa' | 'ieee' | 'mla'
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [userTags, setUserTags] = useState('Core Literature');

  if (!paper) return null;

  // Format citations
  const authorsStr = (paper.authors || []).join(', ');
  const firstAuthor = paper.authors?.[0] || 'Unknown Author';
  const year = paper.year || 2024;
  const title = paper.title || 'Untitled';
  const venue = paper.venue || paper.source || 'Academic Publication';

  let citationText = '';
  if (citationFormat === 'bibtex') {
    citationText = generateBibTeX(paper);
  } else if (citationFormat === 'apa') {
    citationText = `${firstAuthor} et al. (${year}). ${title}. ${venue}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}`;
  } else if (citationFormat === 'ieee') {
    citationText = `${firstAuthor} et al., "${title}," ${venue}, ${year}.${paper.doi ? ` doi: ${paper.doi}.` : ''}`;
  } else if (citationFormat === 'mla') {
    citationText = `${firstAuthor}, et al. "${title}." ${venue}, ${year}.${paper.doi ? ` DOI: ${paper.doi}` : ''}`;
  }

  const handleCopyCitation = async () => {
    const ok = await copyTextToClipboard(citationText);
    if (ok) {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2500);
    }
  };

  const handleSaveWithNotes = () => {
    const tagsArray = userTags.split(',').map(t => t.trim()).filter(Boolean);
    onSave(paper, tagsArray, userNote);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#D7E8DC] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-[#123D32] text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-mono bg-[#176B50] px-2 py-0.5 rounded text-emerald-200 font-bold">
                {paper.paper_id}
              </span>
              <span>•</span>
              <span className="text-emerald-200">{paper.source}</span>
              {paper.open_access_status && paper.open_access_status !== 'closed' && (
                <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  {paper.open_access_status} Open Access
                </span>
              )}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold mt-2 text-white leading-snug">
              {paper.title}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-[#1A4F42] transition-colors ml-4"
            aria-label="Close paper details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-gray-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAFDFB] p-4 rounded-xl border border-[#E8F1EA]">
            <div>
              <span className="text-gray-400 text-[11px] uppercase font-bold block mb-0.5">Authors</span>
              <span className="font-medium text-[#1A2822]">
                {(paper.authors || []).join(' • ')}
              </span>
            </div>

            <div>
              <span className="text-gray-400 text-[11px] uppercase font-bold block mb-0.5">Publication Venue & Year</span>
              <span className="font-medium text-[#1A2822]">
                {paper.venue || 'Academic Index'} ({paper.year})
              </span>
            </div>

            {paper.doi && (
              <div>
                <span className="text-gray-400 text-[11px] uppercase font-bold block mb-0.5">Digital Object Identifier (DOI)</span>
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-800 hover:underline flex items-center"
                >
                  <span>doi:{paper.doi}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-emerald-700" />
                </a>
              </div>
            )}

            <div>
              <span className="text-gray-400 text-[11px] uppercase font-bold block mb-0.5">Citation Impact</span>
              <span className="font-mono font-bold text-[#176B50]">
                {paper.citation_count ? `${paper.citation_count.toLocaleString()} citations` : 'Indexed'}
              </span>
            </div>
          </div>

          {/* AI Relevance Explanation */}
          <div className="bg-[#E8F1EA]/70 border border-[#C5DDD0] rounded-xl p-4">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#176B50] mb-1 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Semantic Relevance Rationale ({Math.round((paper.relevance_score || 0.85) * 100)}% Match)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#1A382A] leading-relaxed font-sans">
              {paper.relevance_explanation}
            </p>
          </div>

          {/* Full Abstract */}
          <div>
            <h2 className="font-serif text-base font-bold text-[#123D32] mb-2">
              Abstract
            </h2>
            <div className="bg-[#F8FAF9] p-4 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans whitespace-pre-line">
              {paper.abstract || 'No abstract text available from the publisher index.'}
            </div>
          </div>

          {/* Citation Generator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-base font-bold text-[#123D32] flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-[#176B50]" />
                <span>Citation Exporter</span>
              </h2>
              <div className="flex items-center space-x-1">
                {['bibtex', 'apa', 'ieee', 'mla'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setCitationFormat(fmt)}
                    className={`px-2.5 py-1 rounded text-xs uppercase font-mono font-bold transition-colors ${
                      citationFormat === fmt
                        ? 'bg-[#123D32] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-[#12241E] rounded-xl p-3 border border-[#1A382E]">
              <pre className="font-mono text-xs text-emerald-100 overflow-x-auto whitespace-pre-wrap pr-16 max-h-36">
                {citationText}
              </pre>
              <button
                onClick={handleCopyCitation}
                className="absolute top-2.5 right-2.5 bg-[#176B50] hover:bg-[#1C7D5E] text-white px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1"
              >
                {copiedCitation ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Personal Researcher Notes */}
          <div className="bg-[#FAFDFB] p-4 rounded-xl border border-[#D7E8DC]">
            <h2 className="font-serif text-sm font-bold text-[#123D32] mb-2">
              Researcher Notes & Categorization
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={userTags}
                  onChange={(e) => setUserTags(e.target.value)}
                  placeholder="e.g. Core Literature, Methodology, Benchmark"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D1DFD6] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Personal Research Note</label>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Add qualitative observations, critique, or relevance to your paper..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D1DFD6] text-xs bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <a
              href={paper.verified_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#123D32] hover:underline"
            >
              <span>Visit Verified Publisher Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {paper.pdf_url && (
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveWithNotes}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
                isSaved
                  ? 'bg-[#176B50] text-white'
                  : 'bg-[#123D32] hover:bg-[#176B50] text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Saved in Library</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save with Notes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
