import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Trash2,
  BookOpen,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Search,
  Tag,
  Filter,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { generateBibTeX } from '../utils/storage.js';
import { buildModule2Output } from '../utils/academicSearchEngine.js';

export default function SavedPapersView({
  savedPapers,
  onRemovePaper,
  onOpenPaperDetails,
  onExportSavedAsOutput1,
  onGoToWorkspace
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    savedPapers.forEach(p => {
      (p.tags || []).forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [savedPapers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return savedPapers.filter(paper => {
      const matchesSearch = !searchQuery.trim() ||
        (paper.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paper.authors || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paper.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag === 'ALL' || (paper.tags || []).includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [savedPapers, searchQuery, selectedTag]);

  // Selection toggle
  const toggleSelectPaper = (id) => {
    const next = new Set(selectedPaperIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPaperIds(next);
  };

  const handleSelectAll = () => {
    if (selectedPaperIds.size === filteredPapers.length) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(filteredPapers.map(p => p.paper_id)));
    }
  };

  const handleExportSelectedOutput1 = () => {
    const papersToExport = savedPapers.filter(p =>
      selectedPaperIds.size === 0 || selectedPaperIds.has(p.paper_id)
    );
    if (papersToExport.length === 0) return;

    const customOutput = buildModule2Output({
      topic: 'Saved Scholar Library Collection',
      papers: papersToExport,
      sourcesQueried: ['Saved Library Index']
    });

    onExportSavedAsOutput1(customOutput);
  };

  const handleCopyAllBibtex = async () => {
    const papersToExport = savedPapers.filter(p =>
      selectedPaperIds.size === 0 || selectedPaperIds.has(p.paper_id)
    );
    const bibtexStr = papersToExport.map(p => generateBibTeX(p)).join('\n\n');
    try {
      await navigator.clipboard.writeText(bibtexStr);
      setCopiedBibtex(true);
      setTimeout(() => setCopiedBibtex(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (savedPapers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#123D32] mb-2">
          Your Saved Library is Empty
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          Discover academic papers in the Search Workspace and click "Save Paper" to build your curated research collection.
        </p>
        <button
          onClick={onGoToWorkspace}
          className="bg-[#123D32] hover:bg-[#176B50] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Discover Literature
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#176B50] uppercase tracking-wider font-mono">
            <Bookmark className="w-4 h-4" />
            <span>Personal Bibliography Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D32] mt-1">
            Saved Research Library ({savedPapers.length} Papers)
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSelectedOutput1}
            className="flex items-center space-x-1.5 bg-[#123D32] hover:bg-[#176B50] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export {selectedPaperIds.size > 0 ? `Selected (${selectedPaperIds.size})` : 'All'} for Module 2</span>
          </button>

          <button
            onClick={handleCopyAllBibtex}
            className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors"
          >
            {copiedBibtex ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>BibTeX Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy BibTeX</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#D7E8DC] p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved titles, authors, or research notes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D1DFD6] text-xs"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-[#D1DFD6] text-xs bg-white text-gray-700"
            >
              <option value="ALL">All Tags</option>
              {allTags.map((tag, i) => (
                <option key={i} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSelectAll}
          className="text-xs text-gray-600 hover:text-[#123D32] font-semibold flex items-center space-x-1"
        >
          {selectedPaperIds.size === filteredPapers.length ? (
            <CheckSquare className="w-3.5 h-3.5 text-[#176B50]" />
          ) : (
            <Square className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span>{selectedPaperIds.size === filteredPapers.length ? 'Deselect All' : 'Select All'}</span>
        </button>
      </div>

      {/* Saved Papers List */}
      <div className="space-y-3">
        {filteredPapers.map((paper) => {
          const isSelected = selectedPaperIds.has(paper.paper_id);

          return (
            <div
              key={paper.paper_id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all flex items-start space-x-3.5 ${
                isSelected ? 'border-[#176B50] ring-1 ring-[#176B50] bg-[#FAFDFB]' : 'border-[#D7E8DC] hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleSelectPaper(paper.paper_id)}
                className="mt-1 text-gray-400 hover:text-[#176B50]"
                aria-label={`Select ${paper.title}`}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#176B50]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] font-bold bg-[#E8F1EA] text-[#123D32] px-1.5 py-0.2 rounded">
                    {paper.source}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {paper.year}
                  </span>
                  {paper.doi && (
                    <span className="text-[11px] font-mono text-gray-500 truncate max-w-xs">
                      doi:{paper.doi}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-base font-bold text-[#123D32] hover:underline cursor-pointer">
                  <button
                    onClick={() => onOpenPaperDetails(paper)}
                    className="text-left font-serif"
                  >
                    {paper.title}
                  </button>
                </h3>

                <p className="text-xs text-gray-600 mt-0.5">
                  {(paper.authors || []).join(', ')}
                </p>

                {/* Tags & Notes */}
                {(paper.tags?.length > 0 || paper.notes) && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-[11px]">
                    {paper.tags?.map((t, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-mono">
                        #{t}
                      </span>
                    ))}
                    {paper.notes && (
                      <span className="italic text-gray-600 font-sans">
                        Note: "{paper.notes}"
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-1.5 shrink-0 self-start">
                <button
                  onClick={() => onOpenPaperDetails(paper)}
                  className="p-1.5 rounded hover:bg-[#E8F1EA] text-gray-600 hover:text-[#123D32]"
                  title="View Details"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemovePaper(paper.paper_id)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-700 transition-colors"
                  title="Remove from Library"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
