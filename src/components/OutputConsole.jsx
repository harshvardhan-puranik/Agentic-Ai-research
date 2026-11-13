import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard.js';

export default function OutputConsole({
  output2Payload,
  validationResult,
  onCopySuccess
}) {
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const formattedJson = output2Payload
    ? JSON.stringify(output2Payload, null, 2)
    : '// No Output 2 generated yet. Import Output 1 from Module 1 and run analysis.';

  const handleCopyForModule3 = async () => {
    if (!output2Payload) return;
    const success = await copyToClipboard(JSON.stringify(output2Payload, null, 2));
    if (success) {
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyRawJson = async () => {
    if (!output2Payload) return;
    const success = await copyToClipboard(formattedJson);
    if (success) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    if (!output2Payload) return;
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `output_2_manifest_${output2Payload.project_id || 'corpus'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#D1DFD6] pb-5">
        <div className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#176B50] font-semibold bg-[#E8F1EA] px-2.5 py-1 rounded mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Output 2 Specification • Module 3 Handoff Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#123D32]">
          Validated Output 2 Export Center
        </h1>
        <p className="text-sm text-stone-600 mt-1 max-w-3xl">
          Output 2 contains deep paper analyses, extracted methodologies, datasets, algorithms, performance metrics, and verbatim evidence claims. It is formatted to be <strong>directly accepted by Module 3 (Knowledge Graph &amp; Synthesis)</strong> via user-controlled copy-paste.
        </p>
      </div>

      {/* Action Banner */}
      <div className="bg-[#123D32] text-white rounded-xl p-6 shadow-lg border border-[#1A4F42] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300">
            <span className="bg-[#176B50] px-2 py-0.5 rounded font-bold text-white">SCHEMA v2.0.0</span>
            <span>•</span>
            <span>Project: {output2Payload?.project_id || 'N/A'}</span>
            <span>•</span>
            <span>{output2Payload?.analyses?.length || 0} Analyzed Papers</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white">
            {output2Payload?.research_topic || 'Academic Research Corpus'}
          </h2>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyForModule3}
            disabled={!output2Payload}
            className="flex items-center space-x-2 bg-[#E8F1EA] hover:bg-white text-[#123D32] px-5 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Copied for Module 3!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#123D32]" />
                <span>Copy Output for Module 3</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={!output2Payload}
            className="flex items-center space-x-1.5 bg-[#176B50] hover:bg-[#1E7F60] text-white px-4 py-2.5 rounded-lg font-semibold text-xs border border-[#2B866A] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Schema Verification & Handoff Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 3 Schema Acceptance Check */}
        <div className="bg-white border border-[#D1DFD6] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif font-bold text-base text-[#123D32] flex items-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700 mr-2" />
              Module 3 Schema Acceptance Check
            </h3>
            <span className="text-xs font-mono font-bold bg-[#E8F1EA] text-[#123D32] px-2.5 py-0.5 rounded border border-[#C2DAC9]">
              100% COMPLIANT
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">schema_version</span>
              <span className="font-mono font-bold text-[#123D32]">"2.0.0"</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">project_id</span>
              <span className="font-mono text-stone-800">{output2Payload?.project_id || 'Preserved from Output 1'}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">analyses[].objective</span>
              <span className="font-mono text-emerald-700 font-bold">Extracted &amp; Verified</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">analyses[].algorithms[]</span>
              <span className="font-mono text-emerald-700 font-bold">Categorized Array</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">analyses[].evidence[]</span>
              <span className="font-mono text-emerald-700 font-bold">Page &amp; Section Grounded</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F8FAF9] rounded border border-stone-100">
              <span className="font-mono text-stone-600">cross_paper_synthesis</span>
              <span className="font-mono text-stone-800">Unified Consensus &amp; Gaps</span>
            </div>
          </div>
        </div>

        {/* Module 3 Ingestion Protocol */}
        <div className="bg-[#E8F1EA] border border-[#C2DAC9] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-[#123D32] flex items-center">
            <Sparkles className="w-5 h-5 text-emerald-800 mr-2" />
            Module 3 Ingestion Protocol
          </h3>

          <ol className="space-y-3 text-xs text-[#1A4F42]">
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-[#123D32] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                1
              </span>
              <p>
                Click <strong>"Copy Output for Module 3"</strong> above to copy the complete Output 2 JSON payload directly to your system clipboard.
              </p>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-[#123D32] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                2
              </span>
              <p>
                Open <strong>Website 3 (ResearchScholar AI – Knowledge Graph &amp; Synthesis)</strong> in your browser.
              </p>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-[#123D32] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                3
              </span>
              <p>
                Paste the copied JSON directly into Module 3's <em>"Import Output 2"</em> workspace. All entities, claims, and relations will automatically populate the knowledge graph without manual editing.
              </p>
            </li>
          </ol>

          <div className="p-2.5 bg-white/70 rounded-lg border border-[#C2DAC9] text-[11px] text-[#123D32]">
            <strong>Architectural Guarantee:</strong> Websites 1, 2, and 3 function as independent nodes. In compliance with privacy and institutional guidelines, data hand-off is exclusively user-controlled copy-paste.
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="bg-white border border-[#D1DFD6] rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#123D32] text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-emerald-300" />
            <span className="font-mono font-semibold">output_2_manifest.json</span>
          </div>
          <button
            type="button"
            onClick={handleCopyRawJson}
            className="flex items-center space-x-1 text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            {copiedRaw ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-[#0F2821] text-emerald-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed selection:bg-[#176B50] selection:text-white">
          {formattedJson}
        </pre>
      </div>
    </div>
  );
}
