import React, { useState } from 'react';
import {
  Cpu,
  Table,
  Search,
  ArrowRight,
  Code,
  Upload,
  CheckCircle,
  FileCode,
  RefreshCw,
  Copy,
  Check,
  Download,
  AlertTriangle
} from 'lucide-react';
import AnalysisWorkspace from './AnalysisWorkspace.jsx';
import PaperComparisonMatrix from './PaperComparisonMatrix.jsx';
import PdfUploadCenter from './PdfUploadCenter.jsx';
import EvidenceExplorer from './EvidenceExplorer.jsx';
import PasteInputWorkspace from './PasteInputWorkspace.jsx';
import { validateOutput1Payload } from '../utils/paperAnalysisEngine.js';
import { copyToClipboard } from '../utils/clipboard.js';

export default function Module2Analysis({
  importedPayload,
  onImportPayload,
  customInstructions = '',
  setCustomInstructions = () => {},
  uploadedPdfs = {},
  onPdfUploaded = () => {},
  onRemovePdf = () => {},
  analyses = [],
  synthesis = null,
  output2Payload = null,
  isAnalyzing = false,
  isSynthesizing = false,
  module2Error = null,
  onExecuteAnalysis,
  onSendToModule3,
  onNavigateToModule1,
  onNavigateToModule3,
  showToast = () => {}
}) {
  const [activeSubTab, setActiveSubTab] = useState('analyses'); // 'analyses', 'pdfs', 'evidence', 'matrix', 'import'
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedOutput2, setCopiedOutput2] = useState(false);

  const output1Validation = importedPayload ? validateOutput1Payload(importedPayload) : { valid: false, errors: [] };
  const hasPapers = output1Validation.valid;
  const hasAnalyses = Array.isArray(analyses) && analyses.length > 0 && Boolean(output2Payload);
  const uploadedCount = Object.keys(uploadedPdfs).length;

  const handleCopyOutput2 = async () => {
    if (!output2Payload) return;
    await copyToClipboard(JSON.stringify(output2Payload, null, 2));
    setCopiedOutput2(true);
    showToast('Copied Output 2 JSON to clipboard.', 'success');
    setTimeout(() => setCopiedOutput2(false), 2000);
  };

  const handleDownloadOutput2 = () => {
    if (!output2Payload) return;
    const blob = new Blob([JSON.stringify(output2Payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResearchScholar_Output2_${output2Payload.project_id || 'analysis'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Output 2 JSON.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2A24] pb-24">
      {/* Module 2 Header Banner */}
      <section className="bg-gradient-to-r from-[#123D32] via-[#176B50] to-[#123D32] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#245D4B] shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-mono text-emerald-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>STEP 2: EXTRACTION &amp; GROUNDING AGENT</span>
                <span>•</span>
                <span>PDF PARSING &amp; IN-HOUSE NLP ENGINE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Module 2: Research Paper Analysis
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl leading-relaxed font-sans">
                Retrieves open-access PDFs and researcher uploads, parses real page-by-page sections, grounds claims in verbatim excerpts, and <strong className="text-white font-semibold">automatically feeds Module 3</strong>.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              {hasPapers && (
                <button
                  disabled={isAnalyzing}
                  onClick={onExecuteAnalysis}
                  className="bg-[#0D2D25] hover:bg-[#15463A] border border-emerald-500/40 text-emerald-100 text-xs px-3.5 py-2.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Analyzing Papers...' : (hasAnalyses ? 'Re-Run Analysis' : 'Analyze Papers')}</span>
                </button>
              )}

              {hasAnalyses && onNavigateToModule3 && (
                <button
                  onClick={onNavigateToModule3}
                  className="bg-emerald-500 hover:bg-emerald-400 text-[#0E3027] text-xs px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <span>Proceed to Module 3 (Gap Identification)</span>
                  <ArrowRight className="w-4 h-4 text-[#0E3027]" />
                </button>
              )}
            </div>
          </div>

          {/* Simple Pipeline Breadcrumb */}
          <div className="mt-6 bg-[#0E3027]/90 border border-[#2B7A63] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-200">
              <span className="text-emerald-300/80">1. Discovery Completed</span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="bg-emerald-400 text-[#123D32] font-bold px-2 py-0.5 rounded text-[11px]">
                2. Analysis Active
              </span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="text-emerald-300/80">3. Gap Identification (Automatic)</span>
            </div>

            <div className="text-[11px] font-mono text-emerald-300">
              {hasAnalyses ? `${analyses.length} papers analyzed • Auto-synced to Module 3` : 'Ready to analyze'}
            </div>
          </div>
        </div>
      </section>

      {/* Sub-navigation tabs */}
      {hasPapers && (
        <div className="bg-white border-b border-[#D7E8DC] relative z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <button
                onClick={() => setActiveSubTab('analyses')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'analyses'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Paper Analyses</span>
                {analyses.length > 0 && (
                  <span className="bg-emerald-100 text-[#123D32] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {analyses.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('pdfs')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'pdfs'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDFs</span>
                {uploadedCount > 0 && (
                  <span className="bg-emerald-100 text-[#123D32] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {uploadedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('evidence')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'evidence'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Evidence Explorer</span>
              </button>

              <button
                onClick={() => setActiveSubTab('matrix')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'matrix'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Comparison Matrix</span>
              </button>

              <button
                onClick={() => setActiveSubTab('import')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'import'
                    ? 'bg-[#123D32] text-white font-semibold'
                    : 'text-[#2D4A3E] hover:bg-[#E8F1EA]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Output 1 Input</span>
              </button>

              <button
                onClick={() => setShowJsonModal(!showJsonModal)}
                className="text-[#2D4A3E] hover:bg-[#E8F1EA] px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Code className="w-3.5 h-3.5 text-gray-500" />
                <span>View Output 2 Data</span>
              </button>
            </div>

            <div className="text-xs text-emerald-800 font-medium">
              Topic: <span className="font-bold">{importedPayload.research_topic}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Validation Error Banner */}
        {module2Error && (
          <div className="mb-5 bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 flex items-start space-x-3 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px]">Module 2 Input / Execution Error</div>
              <p className="mt-0.5">{module2Error}</p>
            </div>
          </div>
        )}

        {/* Active Loading Progress Banner */}
        {(isAnalyzing || isSynthesizing) && (
          <div className="mb-5 bg-[#0E3027] text-emerald-100 rounded-xl p-4 flex items-center justify-between text-xs shadow-sm border border-emerald-500/40">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin flex-shrink-0" />
              <span>
                {isAnalyzing
                  ? 'Module 2 is retrieving open-access PDFs, parsing sections, and verifying verbatim evidence excerpts...'
                  : 'Module 3 is synchronizing cross-paper research gaps from validated Output 2...'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-300 uppercase">Processing</span>
          </div>
        )}

        {/* EMPTY STATE */}
        {!hasPapers && activeSubTab !== 'import' && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#D7E8DC] shadow-xs max-w-2xl mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-[#176B50]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#123D32]">
              No Papers Discovered Yet
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
              Module 2 receives papers <strong className="font-semibold text-gray-800">automatically</strong> from Module 1. Run paper discovery on your research topic or paste Output 1 JSON manually.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {onNavigateToModule1 && (
                <button
                  onClick={onNavigateToModule1}
                  className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-2 cursor-pointer shadow"
                >
                  <span>Go to Module 1: Paper Discovery</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              )}
              <button
                onClick={() => setActiveSubTab('import')}
                className="bg-white border border-[#D1DFD6] hover:bg-[#F8FAF9] text-[#123D32] text-xs px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-[#176B50]" />
                <span>Paste Output 1 JSON</span>
              </button>
            </div>
          </div>
        )}

        {/* AUTOMATIC HANDOFF BANNER TO MODULE 3 */}
        {hasAnalyses && activeSubTab === 'analyses' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  {analyses.length} Papers Analyzed &amp; Automatically Transferred to Module 3
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Full-text coverage: {synthesis?.full_text_coverage || 'Computed'}. Upload additional PDFs anytime in the Upload PDFs tab and click Re-Run Analysis for page-level extraction.
                </p>
              </div>
            </div>

            {onNavigateToModule3 && (
              <button
                onClick={onNavigateToModule3}
                className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm self-start sm:self-auto flex-shrink-0"
              >
                <span>Proceed to Module 3: Gap Identification</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            )}
          </div>
        )}

        {/* Paper Analyses Tab */}
        {hasPapers && activeSubTab === 'analyses' && (
          <AnalysisWorkspace
            analyses={analyses}
            synthesis={synthesis}
            researchTopic={importedPayload?.research_topic || 'Academic Research Topic'}
            projectId={importedPayload?.project_id || 'rs-proj-xxxx'}
            isAnalyzing={isAnalyzing}
            onReRunAnalysis={onExecuteAnalysis}
            onNavigateToOutput={onNavigateToModule3}
            onNavigateToEvidence={() => setActiveSubTab('evidence')}
            onNavigateToMatrix={() => setActiveSubTab('matrix')}
            onNavigateToPdf={() => setActiveSubTab('pdfs')}
          />
        )}

        {/* PDF Upload Center Tab */}
        {hasPapers && activeSubTab === 'pdfs' && (
          <PdfUploadCenter
            importedPapers={importedPayload?.papers || []}
            uploadedPdfs={uploadedPdfs}
            onPdfUploaded={onPdfUploaded}
            onRemovePdf={onRemovePdf}
            onNavigateToAnalysis={() => {
              setActiveSubTab('analyses');
              if (onExecuteAnalysis) onExecuteAnalysis();
            }}
          />
        )}

        {/* Evidence Explorer Tab */}
        {hasPapers && activeSubTab === 'evidence' && (
          <EvidenceExplorer
            analyses={analyses}
            onNavigateToOutput={onNavigateToModule3}
          />
        )}

        {/* Comparison Matrix Tab */}
        {hasPapers && activeSubTab === 'matrix' && (
          <PaperComparisonMatrix
            analyses={analyses}
            researchTopic={importedPayload?.research_topic || 'Academic Research Topic'}
            onNavigateToOutput={onNavigateToModule3}
          />
        )}

        {/* Manual Output 1 JSON Import Tab */}
        {activeSubTab === 'import' && (
          <PasteInputWorkspace
            importedPayload={importedPayload}
            onImportSuccess={(payload) => {
              if (onImportPayload) onImportPayload(payload);
              showToast(`Imported Output 1 with ${payload.papers?.length || 0} papers.`, 'success');
            }}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            onStartAnalysis={() => {
              setActiveSubTab('analyses');
              if (onExecuteAnalysis) onExecuteAnalysis();
            }}
            isAnalyzing={isAnalyzing}
            onNavigateToPdf={() => setActiveSubTab('pdfs')}
          />
        )}

        {/* Optional Raw JSON inspection modal with Copy & Download */}
        {showJsonModal && output2Payload && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
                <h3 className="text-sm font-bold text-[#123D32]">Output 2 Manifest (Automatic Handoff Data)</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyOutput2}
                    className="bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedOutput2 ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOutput2 ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadOutput2}
                    className="bg-[#123D32] hover:bg-[#176B50] text-white text-xs px-3 py-1 rounded-md font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setShowJsonModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <pre className="mt-3 bg-[#0D2D25] text-emerald-200 p-4 rounded-lg font-mono text-xs overflow-auto flex-1">
                {JSON.stringify(output2Payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
