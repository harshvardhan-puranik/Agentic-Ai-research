import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Plus,
  X,
  Database,
  Calendar,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Key,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { expandSearchTerms } from '../utils/academicSearchEngine.js';

const DOMAIN_OPTIONS = [
  'All Academic Domains',
  'Computer Science / Artificial Intelligence',
  'Biomedicine & Health Sciences',
  'Physics & Astronomy',
  'Materials Science & Chemistry',
  'Environmental & Climate Sciences',
  'Mathematics & Statistics',
  'Economics & Quantitative Finance',
  'Social & Cognitive Sciences',
  'Engineering & Robotics'
];

const SOURCE_OPTIONS = [
  { id: 'OpenAlex', name: 'OpenAlex API', desc: 'Global scholarly index with full inverted abstracts & OA links', default: true },
  { id: 'arXiv', name: 'arXiv API', desc: 'Direct STEM preprints, PDF repository links & arXiv IDs', default: true },
  { id: 'Semantic Scholar', name: 'Semantic Scholar', desc: 'Citation graphs, influential counts & OA locator', default: true },
  { id: 'Crossref', name: 'Crossref API', desc: 'Official DOI registry, metadata authority & peer-review venues', default: true },
  { id: 'IEEE Xplore', name: 'IEEE Xplore', desc: 'Authorized institutional index (Key optional; fallback to open indexes)', default: false }
];

export default function SearchWorkspace({ onSearch, isLoading, initialValues }) {
  // Form State
  const [topic, setTopic] = useState(initialValues?.topic || '');
  const [question, setQuestion] = useState(initialValues?.question || '');
  const [domain, setDomain] = useState(initialValues?.domain || 'All Academic Domains');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState(initialValues?.keywords || []);
  const [yearStart, setYearStart] = useState(initialValues?.yearRange?.[0] || 2018);
  const [yearEnd, setYearEnd] = useState(initialValues?.yearRange?.[1] || 2026);
  const [sources, setSources] = useState(initialValues?.preferredSources || ['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref']);
  const [papersRequired, setPapersRequired] = useState(initialValues?.papersRequired || 15);
  const [inclusionInput, setInclusionInput] = useState(initialValues?.inclusionTerms?.join(', ') || '');
  const [exclusionInput, setExclusionInput] = useState(initialValues?.exclusionTerms?.join(', ') || '');
  const [enableAiExpansion, setEnableAiExpansion] = useState(true);
  const [ieeeApiKey, setIeeeApiKey] = useState('');
  const [showIeeeKeyInput, setShowIeeeKeyInput] = useState(false);
  const [previewExpansion, setPreviewExpansion] = useState(null);

  // Sync initialValues if changed
  useEffect(() => {
    if (initialValues) {
      if (initialValues.topic) setTopic(initialValues.topic);
      if (initialValues.question) setQuestion(initialValues.question);
      if (initialValues.domain) setDomain(initialValues.domain);
      if (initialValues.keywords) setKeywords(initialValues.keywords);
    }
  }, [initialValues]);

  // Live Query Expansion Preview when typing topic
  useEffect(() => {
    if (topic.trim().length >= 3 && enableAiExpansion) {
      const exp = expandSearchTerms(topic, question, domain === 'All Academic Domains' ? '' : domain, keywords);
      setPreviewExpansion(exp);
    } else {
      setPreviewExpansion(null);
    }
  }, [topic, question, domain, keywords, enableAiExpansion]);

  // Keyword tags handling
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleKeyDownKeyword = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (tag) => {
    setKeywords(keywords.filter(k => k !== tag));
  };

  // Toggle Source Checkbox
  const toggleSource = (sourceId) => {
    if (sources.includes(sourceId)) {
      // Must keep at least one
      if (sources.length > 1) {
        setSources(sources.filter(s => s !== sourceId));
      }
    } else {
      setSources([...sources, sourceId]);
      if (sourceId === 'IEEE Xplore') {
        setShowIeeeKeyInput(true);
      }
    }
  };

  const handleReset = () => {
    setTopic('');
    setQuestion('');
    setDomain('All Academic Domains');
    setKeywords([]);
    setKeywordInput('');
    setYearStart(2018);
    setYearEnd(2026);
    setSources(['OpenAlex', 'arXiv', 'Semantic Scholar', 'Crossref']);
    setPapersRequired(15);
    setInclusionInput('');
    setExclusionInput('');
    setPreviewExpansion(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const inclusionTerms = inclusionInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const exclusionTerms = exclusionInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSearch({
      topic: topic.trim(),
      question: question.trim() || undefined,
      domain: domain === 'All Academic Domains' ? undefined : domain,
      keywords,
      yearRange: [parseInt(yearStart, 10), parseInt(yearEnd, 10)],
      preferredSources: sources,
      papersRequired: parseInt(papersRequired, 10),
      inclusionTerms,
      exclusionTerms,
      enableAiExpansion,
      ieeeApiKey: ieeeApiKey.trim() || undefined
    });
  };

  return (
    <div id="scholar-paper-discovery-workspace" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-40">
      {/* Workspace Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#176B50] uppercase tracking-wider font-mono">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Research Search Formulation</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D32] mt-1">
          Scholarly Paper Discovery Workspace
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          Define your research scope below. <strong>Only the research topic is required.</strong> All other parameters are optional preferences.
          Our in-house scholarly NLP models will automatically expand keywords, classify your domain, and execute multi-source academic queries.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Inputs Card */}
        <div className="bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm">
          <h2 className="font-serif text-base font-bold text-[#123D32] mb-4 pb-2 border-b border-[#E8F1EA] flex items-center justify-between">
            <span>Primary Research Objectives</span>
            <span className="text-[11px] font-sans font-normal text-gray-500">
              * Research topic is mandatory
            </span>
          </h2>

          <div className="space-y-4">
            {/* 1. Research Topic (REQUIRED) */}
            <div>
              <label htmlFor="research-topic" className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                Research Topic <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="research-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Attention Mechanisms in Deep Learning, CRISPR Gene Editing..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1DFD6] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50] text-sm text-[#1A2822] placeholder:text-gray-400 bg-[#FDFEFE]"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                The core subject or phenomenon under academic investigation.
              </p>
            </div>

            {/* 2. Research Question (Optional) */}
            <div>
              <label htmlFor="research-question" className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                Research Question <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="research-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How do linear attention mechanisms scale context length without quadratic memory?"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1DFD6] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50] text-sm text-[#1A2822] placeholder:text-gray-400 bg-[#FDFEFE]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Specific hypothesis, mechanism, or inquiry for fine-grained semantic alignment.
              </p>
            </div>

            {/* 3. Domain & Keywords Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Research Domain */}
              <div>
                <label htmlFor="research-domain" className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                  Research Domain <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <select
                  id="research-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#D1DFD6] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50] text-sm text-[#1A2822] bg-[#FDFEFE]"
                >
                  {DOMAIN_OPTIONS.map((dom, i) => (
                    <option key={i} value={dom}>{dom}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Helps disambiguate terminology across scientific faculties.
                </p>
              </div>

              {/* Keywords Tag Input */}
              <div>
                <label className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                  Keywords <span className="text-gray-400 font-normal lowercase">(optional tags)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeyDownKeyword}
                    placeholder="Type keyword and press Enter..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[#D1DFD6] focus:border-[#176B50] focus:ring-1 focus:ring-[#176B50] text-sm text-[#1A2822] bg-[#FDFEFE]"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {/* Keywords tags */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center space-x-1 bg-[#E8F1EA] text-[#123D32] border border-[#C5DDD0] px-2 py-0.5 rounded text-xs"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-red-700 ml-1"
                          aria-label={`Remove keyword ${kw}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Query Expansion Preview Box */}
        {previewExpansion && (
          <div className="bg-[#E8F1EA]/80 border border-[#B8D3C2] rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#176B50]" />
                <span className="text-xs font-bold text-[#123D32] uppercase tracking-wider font-mono">
                  Autonomous Query Expansion & Synonyms
                </span>
              </div>
              <span className="text-[10px] bg-[#123D32] text-white px-2 py-0.5 rounded font-mono">
                {previewExpansion.classifiedDomain}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-[#123D32] block mb-1">Generated Scholarly Concepts:</span>
                <div className="flex flex-wrap gap-1">
                  {previewExpansion.generatedKeywords.map((k, i) => (
                    <span key={i} className="bg-white border border-[#C8DCB8] text-[#1A382A] px-2 py-0.5 rounded text-[11px]">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#123D32] block mb-1">Boolean Multi-Source Search Strings:</span>
                <div className="space-y-1 font-mono text-[11px] text-gray-700">
                  {previewExpansion.searchQueries.slice(0, 2).map((q, i) => (
                    <div key={i} className="bg-white/80 px-2 py-1 rounded border border-[#D0E2D6] truncate" title={q}>
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Parameters & Filters Card */}
        <div className="bg-white rounded-xl border border-[#D7E8DC] p-6 shadow-sm">
          <h2 className="font-serif text-base font-bold text-[#123D32] mb-4 pb-2 border-b border-[#E8F1EA]">
            Scholarly Filters & Source Selection
          </h2>

          <div className="space-y-5">
            {/* Preferred Academic Sources */}
            <div>
              <label className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-2">
                Preferred Academic Sources <span className="text-gray-400 font-normal lowercase">(select providers)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SOURCE_OPTIONS.map((src) => {
                  const isChecked = sources.includes(src.id);
                  return (
                    <button
                      type="button"
                      key={src.id}
                      onClick={() => toggleSource(src.id)}
                      className={`flex items-start space-x-2.5 p-3 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'border-[#176B50] bg-[#E8F1EA]/60 text-[#123D32]'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#176B50]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{src.name}</div>
                        <div className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">{src.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional IEEE Xplore Key Input */}
              {sources.includes('IEEE Xplore') && (
                <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-amber-900 flex items-center">
                      <Key className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      IEEE Xplore Institutional API Key (Optional)
                    </span>
                  </div>
                  <input
                    type="password"
                    value={ieeeApiKey}
                    onChange={(e) => setIeeeApiKey(e.target.value)}
                    placeholder="Enter your authorized IEEE API key..."
                    className="w-full px-3 py-1.5 rounded border border-amber-300 text-xs bg-white"
                  />
                  <p className="text-[10px] text-amber-800 mt-1">
                    If omitted, system retrieves open-access IEEE literature via Crossref and OpenAlex.
                  </p>
                </div>
              )}
            </div>

            {/* Publication Year Range & Papers Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Year Range */}
              <div>
                <label className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Publication Year Window</span>
                  <span className="font-mono text-emerald-800 font-semibold">{yearStart} – {yearEnd}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1980"
                    max="2026"
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded border border-[#D1DFD6] text-xs text-center font-mono"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    min="1980"
                    max="2026"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded border border-[#D1DFD6] text-xs text-center font-mono"
                  />
                </div>
              </div>

              {/* Number of Papers Required */}
              <div>
                <label className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Number of Papers Required</span>
                  <span className="font-mono text-emerald-800 font-semibold">{papersRequired} Papers</span>
                </label>
                <div className="flex items-center space-x-2">
                  {[5, 10, 15, 20, 30].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setPapersRequired(num)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                        papersRequired === num
                          ? 'bg-[#123D32] text-white shadow-sm'
                          : 'bg-[#F0F5F2] hover:bg-[#E2EBE5] text-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inclusion / Exclusion Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="inc-terms" className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                  Inclusion Terms <span className="text-gray-400 font-normal lowercase">(comma-separated)</span>
                </label>
                <input
                  id="inc-terms"
                  type="text"
                  value={inclusionInput}
                  onChange={(e) => setInclusionInput(e.target.value)}
                  placeholder="e.g. empirical evaluation, benchmark"
                  className="w-full px-3 py-2 rounded-lg border border-[#D1DFD6] text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">Must be present in title or abstract.</p>
              </div>

              <div>
                <label htmlFor="exc-terms" className="block text-xs font-bold text-[#123D32] uppercase tracking-wider mb-1">
                  Exclusion Terms <span className="text-gray-400 font-normal lowercase">(comma-separated)</span>
                </label>
                <input
                  id="exc-terms"
                  type="text"
                  value={exclusionInput}
                  onChange={(e) => setExclusionInput(e.target.value)}
                  placeholder="e.g. quantum, survey only"
                  className="w-full px-3 py-2 rounded-lg border border-[#D1DFD6] text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">Papers containing these terms will be filtered out.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit & Reset Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 text-xs text-gray-600 hover:text-[#123D32] px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferences</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#123D32] hover:bg-[#176B50] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Executing Multi-Source Discovery Pipeline...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute Discovery & Generate Output 1</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
