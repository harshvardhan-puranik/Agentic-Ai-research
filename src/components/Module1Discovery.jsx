import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Database,
  Bookmark,
  FileCode,
  Check,
  Copy,
  Download,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Code
} from 'lucide-react';
import SearchWorkspace from './SearchWorkspace.jsx';
import SearchResults from './SearchResults.jsx';
import SavedPapersView from './SavedPapersView.jsx';
import PaperDetailsModal from './PaperDetailsModal.jsx';
import { executeAcademicSearch } from '../services/academicApi.js';
import { copyToClipboard } from '../utils/clipboard.js';

export default function Module1Discovery({
  onSearchStarted,
  onSendToModule2,
  onNavigateToModule2,
  showToast = () => {}
}) {
  const [subView, setSubView] = useState('workspace'); // 'workspace', 'results', 'saved'
  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showOutput1Modal, setShowOutput1Modal] = useState(false);
  const [savedPapers, setSavedPapers] = useState(() => {
    try {
      const saved = localStorage.getItem('researchscholar_saved_papers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [copied, setCopied] = useState(false);

  // Agent State
  const [agentPhase, setAgentPhase] = useState('READY'); // 'READY', 'EXPANDING', 'SEARCHING', 'RANKING', 'COMPLETE'

  const handleSearch = async (formValues) => {
    setIsLoading(true);
    setAgentPhase('EXPANDING');
    if (onSearchStarted) onSearchStarted();

    try {
      const result = await executeAcademicSearch(formValues);
      setSearchData(result);
      setAgentPhase('COMPLETE');
      setSubView('results');

      if (result.papers && result.papers.length > 0) {
        // AUTOMATIC HANDOFF TO MODULE 2 ONLY WHEN GENUINE PAPERS WERE FOUND
        if (onSendToModule2 && result.output1) {
          onSendToModule2(result.output1);
        }
        showToast(`Discovered ${result.papers.length} genuine papers from ${(result.stats?.sourcesSucceeded || []).join(', ') || 'academic sources'}!`, 'success');
      } else {
        showToast('No genuine papers found matching this query across queried academic databases.', 'warning');
      }
    } catch (err) {
      console.error('Search error:', err);
      showToast(`Search failed: ${err.message}`, 'error');
      setAgentPhase('READY');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOutput1Json = async () => {
    if (!searchData?.output1) return;
    await copyToClipboard(JSON.stringify(searchData.output1, null, 2));
    setCopied(true);
    showToast('Copied Output 1 JSON to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOutput1Json = () => {
    if (!searchData?.output1) return;
    const blob = new Blob([JSON.stringify(searchData.output1, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResearchScholar_Output1_${searchData.output1.project_id || 'discovery'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Output 1 JSON.', 'success');
  };

  const handleToggleSavePaper = (paper, tagsArray, userNote) => {
    if (!paper || !paper.paper_id) return;
    const hasNotesOrTags = tagsArray !== undefined || userNote !== undefined;
    const exists = savedPapers.some(p => p.paper_id === paper.paper_id);
    let updated;
    let toastMsg;
    let toastType;

    if (exists && !hasNotesOrTags) {
      updated = savedPapers.filter(p => p.paper_id !== paper.paper_id);
      toastMsg = 'Paper removed from saved bookshelf.';
      toastType = 'info';
    } else if (exists && hasNotesOrTags) {
      updated = savedPapers.map(p =>
        p.paper_id === paper.paper_id
          ? { ...p, tags: tagsArray ?? p.tags, notes: userNote ?? p.notes }
          : p
      );
      toastMsg = 'Updated saved paper notes and tags.';
      toastType = 'success';
    } else {
      const enrichedPaper = hasNotesOrTags
        ? { ...paper, tags: tagsArray || [], notes: userNote || '' }
        : paper;
      updated = [...savedPapers, enrichedPaper];
      toastMsg = 'Paper saved to your collection.';
      toastType = 'success';
    }

    setSavedPapers(updated);
    try {
      localStorage.setItem('researchscholar_saved_papers', JSON.stringify(updated));
    } catch (e) {}
    showToast(toastMsg, toastType);
  };

  const handleRemoveSavedPaper = (paperIdOrObj) => {
    const targetId = typeof paperIdOrObj === 'string' ? paperIdOrObj : paperIdOrObj?.paper_id;
    if (!targetId) return;
    const updated = savedPapers.filter(p => p.paper_id !== targetId);
    setSavedPapers(updated);
    try {
      localStorage.setItem('researchscholar_saved_papers', JSON.stringify(updated));
    } catch (e) {}
    showToast('Paper removed from saved bookshelf.', 'info');
  };

  const savedIdsSet = new Set(savedPapers.map(p => p.paper_id));

  const handleSearchNewTopic = () => {
    setSubView('workspace');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const workspaceEl = document.getElementById('scholar-paper-discovery-workspace');
        if (workspaceEl) {
          const headerEl = document.querySelector('header');
          const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 96;
          const subNavOffset = 56;
          const targetTop = workspaceEl.getBoundingClientRect().top + window.scrollY - headerHeight - subNavOffset;
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });
        }
        const topicInput = document.getElementById('research-topic');
        if (topicInput && typeof topicInput.focus === 'function') {
          topicInput.focus({ preventScroll: true });
        }
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2A24] pb-24">
      {/* Module 1 Header Banner */}
      <section className="bg-gradient-to-r from-[#123D32] via-[#176B50] to-[#123D32] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#245D4B] shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-mono text-emerald-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>STEP 1: DISCOVERY AGENT</span>
                <span>•</span>
                <span>FEDERATED SCHOLARLY SEARCH</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Module 1: Research Paper Discovery
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl leading-relaxed font-sans">
                Enter your research topic. The Discovery Agent searches real academic indexes (OpenAlex, arXiv, Semantic Scholar, Crossref), eliminates duplicates using mathematical distance metrics, and <strong className="text-white font-semibold">automatically passes papers directly to Module 2</strong>.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSearchNewTopic}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#0E3027] text-xs px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
              >
                <Search className="w-4 h-4 text-[#0E3027]" />
                <span>Search New Topic</span>
              </button>

              {searchData?.papers?.length > 0 && onNavigateToModule2 && (
                <button
                  onClick={onNavigateToModule2}
                  className="bg-[#0D2D25] hover:bg-[#15463A] text-emerald-200 border border-emerald-500/50 text-xs px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Go to Module 2</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          </div>

          {/* Simple Pipeline Breadcrumb */}
          <div className="mt-6 bg-[#0E3027]/90 border border-[#2B7A63] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-200">
              <span className="bg-emerald-400 text-[#123D32] font-bold px-2 py-0.5 rounded text-[11px]">
                1. Discovery Active
              </span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="text-emerald-300/80">2. Analysis (Automatic)</span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="text-emerald-300/80">3. Gap Identification (Automatic)</span>
            </div>

            <div className="text-[11px] font-mono text-emerald-300">
              {searchData ? `${searchData.papers?.length} papers found • Auto-sent to Module 2` : 'Ready for search'}
            </div>
          </div>
        </div>
      </section>

      {/* Sub-view switcher */}
      <div className="bg-white border-b border-[#D7E8DC] relative z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <button
              onClick={() => setSubView('workspace')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subView === 'workspace'
                  ? 'bg-[#123D32] text-white font-semibold'
                  : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Form</span>
            </button>

            <button
              onClick={() => setSubView('results')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subView === 'results'
                  ? 'bg-[#123D32] text-white font-semibold'
                  : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Discovered Papers</span>
              {searchData?.papers?.length > 0 && (
                <span className="bg-emerald-100 text-[#123D32] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {searchData.papers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubView('saved')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                subView === 'saved'
                  ? 'bg-[#123D32] text-white font-semibold'
                  : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Papers</span>
              {savedPapers.length > 0 && (
                <span className="bg-emerald-100 text-[#123D32] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {savedPapers.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-emerald-800 font-medium">
            100% Automated Pipeline: No Manual Copy/Paste
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Automatic Handoff Notification Banner */}
        {searchData?.papers?.length > 0 && subView === 'results' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  {searchData.papers.length} Papers Discovered &amp; Automatically Transferred to Module 2
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  The Discovery Agent completed retrieval. Module 2 (Paper Analysis) is already loaded and ready.
                </p>
              </div>
            </div>

            {onNavigateToModule2 && (
              <button
                onClick={onNavigateToModule2}
                className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm self-start sm:self-auto flex-shrink-0"
              >
                <span>Open Module 2: Paper Analysis</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            )}
          </div>
        )}

        {subView === 'workspace' && (
          <SearchWorkspace
            onSearch={handleSearch}
            isLoading={isLoading}
            initialValues={searchData?.queryExpansion}
          />
        )}

        {subView === 'results' && (
          <SearchResults
            searchData={searchData}
            onOpenPaperDetails={(paper) => setSelectedPaper(paper)}
            onSavePaper={handleToggleSavePaper}
            savedPaperIds={savedIdsSet}
            onQuickCopy={handleCopyOutput1Json}
            copied={copied}
            onGoToOutput={() => setShowOutput1Modal(true)}
            onBackToWorkspace={handleSearchNewTopic}
          />
        )}

        {subView === 'saved' && (
          <SavedPapersView
            savedPapers={savedPapers}
            onOpenPaperDetails={(paper) => setSelectedPaper(paper)}
            onRemovePaper={handleRemoveSavedPaper}
            onExportSavedAsOutput1={(customOutput) => {
              if (onSendToModule2) onSendToModule2(customOutput);
              if (onNavigateToModule2) onNavigateToModule2();
              showToast(`Transferred ${customOutput.papers?.length || 0} saved paper(s) to Module 2.`, 'success');
            }}
            onGoToWorkspace={handleSearchNewTopic}
          />
        )}
      </main>

      {/* Paper Details Modal */}
      {selectedPaper && (
        <PaperDetailsModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onSave={handleToggleSavePaper}
          isSaved={savedIdsSet.has(selectedPaper.paper_id)}
        />
      )}

      {/* Output 1 JSON Review, Copy & Download Modal */}
      {showOutput1Modal && searchData?.output1 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-[#176B50]" />
                <h3 className="text-sm font-bold text-[#123D32]">Output 1 JSON Manifest (Schema v1.0.0)</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyOutput1Json}
                  className="bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={handleDownloadOutput1Json}
                  className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowOutput1Modal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="mt-3 bg-[#0D2D25] text-emerald-200 p-4 rounded-lg font-mono text-xs overflow-auto flex-1">
              {JSON.stringify(searchData.output1, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
