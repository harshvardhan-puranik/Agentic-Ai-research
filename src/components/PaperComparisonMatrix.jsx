import React, { useState } from 'react';
import {
  Table,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileText,
  Filter
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard.js';

export default function PaperComparisonMatrix({
  analyses = [],
  researchTopic,
  onNavigateToOutput
}) {
  const [copied, setCopied] = useState(false);

  const handleExportCsv = () => {
    if (!analyses || analyses.length === 0) return;

    const headers = [
      'Paper ID',
      'Title',
      'Authors',
      'Year',
      'DOI',
      'Objective',
      'Methodology',
      'Algorithms',
      'Dataset',
      'Metrics',
      'Results',
      'Limitations'
    ];

    const rows = analyses.map((p) => [
      `"${p.paper_id}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(p.authors) ? p.authors.join('; ') : '').replace(/"/g, '""')}"`,
      p.year || '',
      `"${p.doi || ''}"`,
      `"${(p.objective || '').replace(/"/g, '""')}"`,
      `"${(p.methodology || '').replace(/"/g, '""')}"`,
      `"${(p.algorithms || []).join('; ').replace(/"/g, '""')}"`,
      `"${(p.dataset?.name || '').replace(/"/g, '""')}"`,
      `"${(p.metrics || []).join('; ').replace(/"/g, '""')}"`,
      `"${(p.reported_results || []).join('; ').replace(/"/g, '""')}"`,
      `"${(p.limitations || []).join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `comparison_matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = async () => {
    let md = `### Scholarly Comparison Matrix: ${researchTopic}\n\n`;
    md += `| Paper | Objective | Architecture & Algorithms | Dataset | Reported Results |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    analyses.forEach((p) => {
      const titleShort = (p.title || '').slice(0, 35) + '...';
      const algos = (p.algorithms || []).slice(0, 2).join(', ');
      const dataset = p.dataset?.name || 'Benchmark';
      const result = (p.reported_results?.[0] || 'Enhanced accuracy').slice(0, 50) + '...';
      md += `| **${p.paper_id}** (${p.year})<br>${titleShort} | ${(p.objective || '').slice(0, 60)}... | ${algos} | ${dataset} | ${result} |\n`;
    });

    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!analyses || analyses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E8F1EA] text-[#176B50] flex items-center justify-center mx-auto">
          <Table className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#123D32]">
          Comparison Matrix Empty
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Import and analyze papers to generate a side-by-side methodological comparison matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#D1DFD6] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#176B50] font-semibold bg-[#E8F1EA] px-2.5 py-1 rounded mb-2">
            <Table className="w-3.5 h-3.5" />
            <span>Multi-Paper Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#123D32]">
            Paper Comparison Matrix
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Side-by-side comparative breakdown of theoretical objectives, proposed architectures, evaluation datasets, and empirical results.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 bg-[#E8F1EA] hover:bg-[#D7E8DC] text-[#123D32] px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied Markdown</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown Table</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-[#176B50] hover:bg-[#123D32] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToOutput}
            className="flex items-center space-x-1.5 bg-[#123D32] hover:bg-[#176B50] text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Output 2 Console (Module 3)</span>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-[#D1DFD6] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#123D32] text-white font-serif">
                <th className="p-3.5 border-b border-[#1A4F42] w-[180px] font-bold">Paper Identity</th>
                <th className="p-3.5 border-b border-[#1A4F42] w-[220px] font-bold">Research Objective</th>
                <th className="p-3.5 border-b border-[#1A4F42] w-[220px] font-bold">Methodology &amp; Algorithms</th>
                <th className="p-3.5 border-b border-[#1A4F42] w-[180px] font-bold">Dataset</th>
                <th className="p-3.5 border-b border-[#1A4F42] w-[240px] font-bold">Reported Results &amp; Metrics</th>
                <th className="p-3.5 border-b border-[#1A4F42] w-[200px] font-bold">Limitations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {analyses.map((p, idx) => (
                <tr key={p.paper_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAF9]'}>
                  {/* Paper Identity */}
                  <td className="p-3.5 align-top space-y-1">
                    <span className="font-mono font-bold text-emerald-800 bg-[#E8F1EA] px-1.5 py-0.5 rounded text-[10px] block w-fit">
                      {p.paper_id}
                    </span>
                    <h4 className="font-serif font-bold text-stone-900 line-clamp-2">
                      {p.title}
                    </h4>
                    <div className="text-[11px] text-stone-500">
                      <span>{Array.isArray(p.authors) ? p.authors[0] : 'Author'} et al.</span>
                      <span> ({p.year})</span>
                    </div>
                    {p.doi && (
                      <span className="text-[10px] font-mono text-stone-400 block truncate max-w-[150px]">
                        doi:{p.doi}
                      </span>
                    )}
                  </td>

                  {/* Objective */}
                  <td className="p-3.5 align-top text-stone-800 leading-relaxed font-serif">
                    <p className="line-clamp-4">{p.objective}</p>
                  </td>

                  {/* Methodology & Algorithms */}
                  <td className="p-3.5 align-top space-y-2">
                    <p className="text-stone-700 leading-relaxed line-clamp-3">{p.methodology}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.algorithms?.slice(0, 3).map((a, i) => (
                        <span key={i} className="bg-[#E8F1EA] text-[#123D32] px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Dataset */}
                  <td className="p-3.5 align-top space-y-1">
                    <strong className="text-stone-900 block font-semibold">{p.dataset?.name}</strong>
                    <span className="text-stone-500 text-[11px] block">{p.dataset?.size}</span>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1 py-0.5 rounded block w-fit">
                      {p.dataset?.domain}
                    </span>
                  </td>

                  {/* Results & Metrics */}
                  <td className="p-3.5 align-top space-y-2">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {p.metrics?.slice(0, 3).map((m, i) => (
                        <span key={i} className="bg-stone-200 text-stone-800 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                    <ul className="text-stone-800 space-y-1 list-disc list-inside line-clamp-3">
                      {p.reported_results?.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </td>

                  {/* Limitations */}
                  <td className="p-3.5 align-top text-stone-600 space-y-1">
                    <ul className="space-y-1 list-disc list-inside line-clamp-3 text-amber-900">
                      {p.limitations?.slice(0, 2).map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
