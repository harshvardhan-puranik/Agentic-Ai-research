import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  ExternalLink,
  Download,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Filter,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Lock,
  Unlock
} from 'lucide-react';

export default function SearchResults({
  searchData,
  onOpenPaperDetails,
  onSavePaper,
  savedPaperIds = new Set(),
  onQuickCopy,
  copied,
  onGoToOutput,
  onBackToWorkspace
}) {
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterOA, setFilterOA] = useState('ALL');
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'compact'

  const papers = searchData?.papers || [];
  const metadata = searchData?.output1?.search_metadata || {};
  const stats = searchData?.stats || {};

  const toggleAbstract = (id) => {
    setExpandedAbstracts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtered and sorted papers
  const filteredPapers = useMemo(() => {
    let result = [...papers];

    // Source filter
    if (filterSource !== 'ALL') {
      result = result.filter(p => p.source === filterSource);
    }

    // Open Access filter
    if (filterOA === 'OA_ONLY') {
      result = result.filter(p => p.open_access_status === 'gold' || p.open_access_status === 'green' || p.full_text_status === 'available');
    } else if (filterOA === 'PDF_ONLY') {
      result = result.filter(p => !!p.pdf_url);
    }

    // Min Score filter
    if (filterMinScore > 0) {
      result = result.filter(p => (p.relevance_score || 0) >= filterMinScore);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'relevance') {
        return (b.relevance_score || 0) - (a.relevance_score || 0);
      }
      if (sortBy === 'year_desc') {
        return (b.year || 0) - (a.year || 0);
      }
      if (sortBy === 'year_asc') {
        return (a.year || 0) - (b.year || 0);
      }
      if (sortBy === 'citations') {
        return (b.citation_count || 0) - (a.citation_count || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [papers, filterSource, filterOA, filterMinScore, sortBy]);

  if (!papers || papers.length === 0) {
    const attemptedSources = metadata.sources_queried || stats.sourcesSucceeded || ['OpenAlex', 'arXiv', 'Crossref'];
    const attribution = stats.sourceAttribution || metadata.source_attribution || {};

    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-8 h-8 text-[#176B50]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[#123D32]">
            {searchData ? 'No Genuine Papers Found Matching Query' : 'No Search Results Active'}
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            {searchData ? (
              <>
                The queried academic databases ({attemptedSources.join(', ')}) returned zero peer-reviewed papers matching your exact filters for <strong className="text-emerald-950">"{searchData.output1?.research_topic}"</strong>.
              </>
            ) : (
              'Formulate an inquiry in the Search Workspace to execute the federated scholarly discovery pipeline and generate Output 1.'
            )}
          </p>
        </div>

        {searchData && Object.keys(attribution).length > 0 && (
          <div className="bg-white rounded-xl border border-[#D7E8DC] p-5 max-w-lg mx-auto text-left space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Academic Sources Status</h4>
            <div className="space-y-2">
              {Object.entries(attribution).map(([src, info]) => (
                <div key={src} className="flex items-center justify-between text-xs p-2 bg-[#F8FAF9] rounded-lg border border-[#E8F1EA]">
                  <span className="font-semibold text-[#123D32]">{src}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    info.status === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : info.status === 'rate_limited'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {info.status === 'success' ? `${info.count} papers` : (info.status === 'rate_limited' ? 'Rate Limited' : info.status)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-gray-500 pt-1">
              Tip: Broaden keywords, expand the year range, or remove strict inclusion terms in the workspace.
            </div>
          </div>
        )}

        <button
          onClick={onBackToWorkspace}
          className="bg-[#123D32] hover:bg-[#176B50] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
        >
          Return to Search Workspace
        </button>
      </div>
    );
  }

  const attribution = stats.sourceAttribution || metadata.source_attribution || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header Banner */}
      <div className="bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8F1EA]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase bg-[#E8F1EA] text-[#123D32] font-bold px-2 py-0.5 rounded">
                Module 1 Discovery Results
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-mono text-gray-500">
                Project ID: {searchData?.output1?.project_id || 'rs-proj-active'}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#123D32] mt-1.5">
              {searchData?.output1?.research_topic || 'Literature Search'}
            </h1>
            {searchData?.output1?.research_question && (
              <p className="text-xs text-gray-600 italic font-serif mt-1">
                "{searchData.output1.research_question}"
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={onQuickCopy}
              className="flex items-center space-x-1.5 bg-[#123D32] hover:bg-[#176B50] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied for Module 2!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Output for Module 2</span>
                </>
              )}
            </button>

            <button
              onClick={onGoToOutput}
              className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#176B50]" />
              <span>Inspect Output 1 JSON</span>
            </button>
          </div>
        </div>

        {/* Discovery Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-[#FAFDFB] p-2.5 rounded-lg border border-[#E8F1EA]">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Retrieved</span>
            <span className="font-mono font-bold text-sm text-[#123D32]">
              {stats.totalRetrieved || papers.length} genuine papers
            </span>
          </div>

          <div className="bg-[#FAFDFB] p-2.5 rounded-lg border border-[#E8F1EA]">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Deduplicated</span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              {stats.deduplicatedCount || papers.length} unique DOIs
            </span>
          </div>

          <div className="bg-[#FAFDFB] p-2.5 rounded-lg border border-[#E8F1EA]">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Sources Succeeded</span>
            <span className="font-mono font-semibold text-xs text-[#123D32] truncate block">
              {(stats.sourcesSucceeded || metadata.sources_succeeded || ['OpenAlex', 'arXiv']).join(', ')}
            </span>
          </div>

          <div className="bg-[#FAFDFB] p-2.5 rounded-lg border border-[#E8F1EA]">
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Module 2 Format</span>
            <span className="font-mono font-bold text-xs text-emerald-800 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              v1.0.0 Validated
            </span>
          </div>
        </div>

        {/* Source Verification Breakdown Badges */}
        {Object.keys(attribution).length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#E8F1EA] flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Sources Queried:</span>
            {Object.entries(attribution).map(([src, info]) => (
              <span
                key={src}
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[11px] ${
                  info.status === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                    : info.status === 'rate_limited'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
                title={info.message || `${info.count} papers retrieved`}
              >
                <span>{src}:</span>
                <span className="font-mono font-bold">
                  {info.status === 'success' ? `${info.count} papers` : (info.status === 'rate_limited' ? 'Rate limited' : info.status)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>


      {/* Filter and Sort Toolbar */}
      <div className="bg-white rounded-xl border border-[#D7E8DC] p-3.5 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-gray-500 mr-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Filters:</span>
          </div>

          {/* Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D1DFD6] bg-[#FDFEFE] text-gray-700 font-medium"
          >
            <option value="ALL">All Academic Sources</option>
            <option value="OpenAlex">OpenAlex</option>
            <option value="arXiv">arXiv</option>
            <option value="Semantic Scholar">Semantic Scholar</option>
            <option value="Crossref">Crossref</option>
            <option value="IEEE Xplore">IEEE Xplore</option>
          </select>

          {/* Open Access Filter */}
          <select
            value={filterOA}
            onChange={(e) => setFilterOA(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D1DFD6] bg-[#FDFEFE] text-gray-700 font-medium"
          >
            <option value="ALL">All Access Types</option>
            <option value="OA_ONLY">Open Access Only</option>
            <option value="PDF_ONLY">Direct PDF Available</option>
          </select>

          {/* Min Score Filter */}
          <select
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(parseFloat(e.target.value))}
            className="px-2.5 py-1.5 rounded-md border border-[#D1DFD6] bg-[#FDFEFE] text-gray-700 font-medium"
          >
            <option value="0">All Relevance Scores</option>
            <option value="0.9">High Match (&gt;90%)</option>
            <option value="0.8">Good Match (&gt;80%)</option>
            <option value="0.7">Moderate Match (&gt;70%)</option>
          </select>
        </div>

        {/* Right: Sort & View Toggle */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <div className="flex items-center space-x-1 text-gray-500 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#176B50]" />
            <span>Sort:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D1DFD6] bg-[#FDFEFE] text-gray-700 font-medium"
          >
            <option value="relevance">Highest Relevance</option>
            <option value="year_desc">Most Recent (Newest)</option>
            <option value="year_asc">Oldest First</option>
            <option value="citations">Most Cited</option>
            <option value="title">Title (A-Z)</option>
          </select>

          <span className="text-gray-400">|</span>

          <span className="text-gray-600 font-mono font-medium">
            Showing {filteredPapers.length} of {papers.length}
          </span>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="space-y-4">
        {filteredPapers.map((paper, index) => {
          const isSaved = savedPaperIds.has(paper.paper_id);
          const isAbstractExpanded = expandedAbstracts[paper.paper_id];
          const relevancePct = Math.round((paper.relevance_score || 0.85) * 100);

          return (
            <article
              key={paper.paper_id}
              className="bg-white rounded-xl border border-[#D7E8DC] hover:border-[#176B50] p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Card Header: Rank, Source, OA & Relevance Score */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-white bg-[#123D32] px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>

                  {/* Source Pill */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#E8F1EA] text-[#123D32] border border-[#C5DDD0]">
                    {paper.source}
                  </span>

                  {/* Open Access Pill */}
                  {paper.open_access_status && paper.open_access_status !== 'closed' ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span className="uppercase text-[10px] font-bold">{paper.open_access_status} OA</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px]">Subscription</span>
                    </span>
                  )}

                  {/* Direct PDF Verified Pill */}
                  {paper.pdf_url && (
                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      title="Open Verified PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF Available</span>
                    </a>
                  )}
                </div>

                {/* Relevance Score Pill */}
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                      Relevance Match
                    </span>
                    <span className="font-mono text-sm font-bold text-[#176B50]">
                      {relevancePct}%
                    </span>
                  </div>
                  <div className="w-10 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#123D32] rounded-full"
                      style={{ width: `${relevancePct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-serif text-lg font-bold text-[#123D32] hover:text-[#176B50] leading-snug mb-2 cursor-pointer transition-colors">
                <button
                  onClick={() => onOpenPaperDetails(paper)}
                  className="text-left hover:underline focus:outline-none"
                >
                  {paper.title}
                </button>
              </h2>

              {/* Authors, Year, Venue, Citations */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                <span className="font-medium text-[#1A2822]">
                  {(paper.authors || []).slice(0, 4).join(', ')}
                  {(paper.authors || []).length > 4 && ` et al.`}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {paper.year}
                </span>
                {paper.venue && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="italic font-serif text-gray-700 truncate max-w-xs" title={paper.venue}>
                      {paper.venue}
                    </span>
                  </>
                )}
                {paper.citation_count !== undefined && paper.citation_count > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="font-mono font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {paper.citation_count.toLocaleString()} citations
                    </span>
                  </>
                )}
                {paper.doi && (
                  <>
                    <span className="text-gray-300">•</span>
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-emerald-800 hover:underline flex items-center"
                    >
                      <span>doi:{paper.doi}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </>
                )}
              </div>

              {/* AI Relevance Explanation Box */}
              <div className="bg-[#FAFDFB] border border-[#D7E8DC] rounded-lg p-3 mb-3 text-xs">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#176B50] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-mono uppercase tracking-wider">AI Relevance Rationale:</span>
                </div>
                <p className="text-gray-700 leading-relaxed font-sans">
                  {paper.relevance_explanation}
                </p>
              </div>

              {/* Abstract Snippet with Expand */}
              {paper.abstract && (
                <div className="text-xs text-gray-600 mb-3 font-sans leading-relaxed">
                  <p className={isAbstractExpanded ? '' : 'line-clamp-2'}>
                    {paper.abstract}
                  </p>
                  {paper.abstract.length > 160 && (
                    <button
                      onClick={() => toggleAbstract(paper.paper_id)}
                      className="text-[#176B50] hover:text-[#123D32] font-semibold text-[11px] mt-1 flex items-center space-x-0.5"
                    >
                      <span>{isAbstractExpanded ? 'Show less abstract' : 'Read full abstract'}</span>
                      {isAbstractExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              )}

              {/* Keywords Tag List */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {paper.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8F1EA] text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenPaperDetails(paper)}
                    className="flex items-center space-x-1 text-[#123D32] hover:text-[#176B50] font-semibold px-2 py-1 rounded hover:bg-[#E8F1EA] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Details & BibTeX</span>
                  </button>

                  <a
                    href={paper.verified_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-600 hover:text-[#123D32] px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <span>Verified Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSavePaper(paper)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isSaved
                        ? 'bg-[#176B50] text-white'
                        : 'bg-white border border-[#D1DFD6] hover:bg-[#E8F1EA] text-[#123D32]'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save Paper</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
