import React from 'react';
import { ShieldCheck, BookOpen, Brain, Search, Cpu, ArrowUpRight } from 'lucide-react';

export default function Footer({ scholarProfile, onNavigate = () => {} }) {
  const scholarName = scholarProfile?.name || 'Example 1';
  const scholarRole = scholarProfile?.role || 'RESEARCHSCHOLAR';

  return (
    <footer className="bg-[#0B2821] text-emerald-100/80 border-t border-[#133E33] py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Scholar Session */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center space-x-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#176B50] border border-[#2B866A] flex items-center justify-center shadow-inner">
                <Brain className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-brand font-bold text-base tracking-wider text-white">
                  RESEARCH SCHOLAR
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-300 bg-[#0E3027] border border-emerald-500/40 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
            </div>

            {/* Active Scholar Credentials Pill */}
            <div className="inline-flex items-center space-x-2.5 bg-[#123D32] border border-[#1E624E] px-3 py-1.5 rounded-lg text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[#123D32] font-bold text-[11px]">
                {scholarName.charAt(0)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-100 font-medium">
                  Logged in as: <strong className="text-white">{scholarName}</strong>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase bg-[#0B2821] text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                  {scholarRole}
                </span>
              </div>
            </div>

            <p className="text-stone-300 leading-relaxed text-[11px] max-w-sm">
              <strong>Agentic AI Research Assistant</strong>. An autonomous 3-agent scholarly intelligence platform: <em>Agent 1 (Discovery)</em> retrieves and deduplicates papers; <em>Agent 2 (Analysis)</em> parses open-access PDFs and grounds claims; <em>Agent 3 (Research Gap Analyzer)</em> clusters observations and formulates evidence-graded research gaps.
            </p>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Hallucination &amp; Verifiable Grounding Policy</span>
            </div>
          </div>

          {/* Quick Module Navigation (3 TABS) */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="font-serif font-bold text-white uppercase tracking-wider text-[11px]">
              The 3 Research Modules
            </h4>
            <ul className="space-y-2 text-stone-300">
              <li>
                <button
                  onClick={() => onNavigate('module1')}
                  className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Module 1: Paper Discovery</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('module2')}
                  className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Module 2: Paper Analysis</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('module3')}
                  className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Module 3: Research Gap Identification</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Architectural Separation Notice */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="font-serif font-bold text-white uppercase tracking-wider text-[11px]">
              Independence Architecture
            </h4>
            <p className="text-stone-300 leading-relaxed text-[11px]">
              ResearchScholar AI is architected into three independently functioning nodes:
            </p>
            <div className="space-y-1.5 text-[11px] font-mono text-emerald-200">
              <div>• Module 1: Paper Discovery &amp; Search (Output 1 v1.0.0)</div>
              <div>• Module 2: Paper Analysis &amp; Grounding (Output 2 v2.0.0)</div>
              <div>• Module 3: Research Gap Analyzer &amp; Synthesis (Output 3 v3.0.0)</div>
            </div>
            <p className="text-emerald-400/90 text-[10px] italic pt-1">
              Modules exchange schema-validated JSON payloads (Output 1 → Output 2 → Output 3) automatically in-session, with optional manual JSON import and export.
            </p>
          </div>
        </div>

        <div className="border-t border-[#133E33] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3">
          <div>
            © 2026 RESEARCH SCHOLAR AI • Logged in as <strong className="text-emerald-300">{scholarName}</strong> ({scholarRole})
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-300 font-mono">Agentic AI Pipeline Active</span>
            <span>•</span>
            <span>Zero Third-Party LLM Dependency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
