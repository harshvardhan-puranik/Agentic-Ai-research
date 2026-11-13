import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Layers,
  FileCheck,
  ShieldCheck,
  Trash2,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import { validatePdfFile } from '../utils/paperAnalysisEngine.js';

export default function PdfUploadCenter({
  importedPapers = [],
  uploadedPdfs = {},
  onPdfUploaded,
  onRemovePdf,
  onNavigateToAnalysis
}) {
  const [selectedPaperId, setSelectedPaperId] = useState(
    importedPapers.length > 0 ? importedPapers[0].paper_id : ''
  );

  React.useEffect(() => {
    if ((!selectedPaperId || !importedPapers.some(p => p.paper_id === selectedPaperId)) && importedPapers.length > 0) {
      setSelectedPaperId(importedPapers[0].paper_id);
    }
  }, [importedPapers, selectedPaperId]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file) => {
    setUploadError(null);
    if (!file) return;

    // Validate type, size, extension
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    if (!selectedPaperId) {
      setUploadError('Please select which paper this PDF corresponds to.');
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const response = await axios.post('/api/pdf/parse', {
            base64Data,
            filename: file.name
          });

          if (response.data.success) {
            onPdfUploaded(selectedPaperId, {
              filename: file.name,
              filesize: file.size,
              extractionStatus: response.data.extractionStatus || 'full_text',
              isScanned: Boolean(response.data.isScanned),
              warning: response.data.warning || null,
              pageCount: response.data.pageCount || 1,
              sectionCount: response.data.sectionCount || 0,
              sections: response.data.sections || [],
              pages: response.data.pages || [],
              text: response.data.text || response.data.textSnippet || '',
              uploadedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          setUploadError(err.response?.data?.error || err.message || 'Failed to parse PDF document.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(err.message);
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#D1DFD6] pb-5">
        <div className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#176B50] font-semibold bg-[#E8F1EA] px-2.5 py-1 rounded mb-2">
          <Upload className="w-3.5 h-3.5" />
          <span>Full-Text Document Ingestion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#123D32]">
          Supplementary PDF Upload Center
        </h1>
        <p className="text-sm text-stone-600 mt-1 max-w-3xl">
          If an imported paper is behind publisher paywalls or only has an abstract in open registries, upload its authorized PDF here. We validate binary signatures (%PDF-) and extract structured text sections preserving page numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Dropzone & Paper Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#D1DFD6] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <label htmlFor="paper-select" className="block text-xs font-bold uppercase tracking-wider text-[#123D32] mb-1.5">
                Target Imported Paper *
              </label>
              <select
                id="paper-select"
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full text-xs p-2.5 border border-[#D1DFD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B50] bg-white text-[#1D2A24]"
              >
                {importedPapers.length === 0 ? (
                  <option value="">No papers imported yet. Import Output 1 first.</option>
                ) : (
                  importedPapers.map((p) => {
                    const hasPdf = Boolean(uploadedPdfs[p.paper_id]);
                    return (
                      <option key={p.paper_id} value={p.paper_id}>
                        {p.paper_id}: {p.title.slice(0, 70)}... {hasPdf ? '✓ (PDF Linked)' : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-[#176B50] bg-[#E8F1EA]'
                  : 'border-[#D1DFD6] bg-[#FAFCFA] hover:border-[#176B50]'
              }`}
            >
              <input
                id="pdf-upload-file"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="pdf-upload-file"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-[#123D32] block">
                    {isUploading ? 'Validating and Parsing PDF...' : 'Drag and drop academic PDF here'}
                  </span>
                  <span className="text-xs text-stone-500 block">
                    or click to browse your local device (max 35MB)
                  </span>
                </div>
                <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-emerald-800 bg-[#E8F1EA] px-2.5 py-1 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verifies %PDF- magic signature &amp; page hierarchy</span>
                </div>
              </label>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Ethics & Publisher Policy Reminder */}
          <div className="bg-[#E8F1EA] border border-[#C2DAC9] rounded-xl p-4 text-xs text-[#123D32] space-y-1">
            <span className="font-bold block flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-700 mr-1.5" />
              Institutional Fair Use &amp; Anti-Scraping Policy
            </span>
            <p className="text-[#1A4F42] leading-relaxed">
              ResearchScholar AI never bypasses paywalls, exploits proxy authentication, or scrapes closed institutional servers. Full text is parsed exclusively from legal open-access repositories (arXiv, Unpaywall, OpenAlex Gold OA) or through direct researcher-uploaded documents.
            </p>
          </div>
        </div>

        {/* Right Column: Uploaded Documents Repository */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#D1DFD6] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-base text-[#123D32]">
                Uploaded Full-Text Documents
              </h3>
              <span className="bg-[#E8F1EA] text-[#123D32] px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                {Object.keys(uploadedPdfs).length} Attached
              </span>
            </div>

            {Object.keys(uploadedPdfs).length === 0 ? (
              <div className="text-center py-8 text-stone-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs">No supplementary PDFs uploaded yet.</p>
                <p className="text-[11px] text-stone-400">
                  Papers with open-access URLs already have full text available.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(uploadedPdfs).map(([paperId, pdf]) => {
                  const paper = importedPapers.find((p) => p.paper_id === paperId);
                  return (
                    <div
                      key={paperId}
                      className="p-3 bg-[#F8FAF9] border border-[#E0ECE4] rounded-lg text-xs space-y-2 hover:border-[#176B50] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {paperId}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemovePdf(paperId)}
                          className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif font-semibold text-[#123D32] line-clamp-1">
                        {paper ? paper.title : pdf.filename}
                      </h4>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-stone-500 font-mono">
                        <span>{pdf.filename}</span>
                        <span>•</span>
                        <span>{(pdf.filesize / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span>{pdf.pageCount || 1} Pages</span>
                        <span>•</span>
                        <span>{pdf.sectionCount || 0} Sections</span>
                      </div>
                      {pdf.isScanned && pdf.warning && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                          {pdf.warning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {importedPapers.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToAnalysis}
                  className="w-full flex items-center justify-center space-x-2 bg-[#123D32] hover:bg-[#176B50] text-white py-2.5 px-4 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  <span>Proceed to Analysis Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
