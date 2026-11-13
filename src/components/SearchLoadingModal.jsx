import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';

const LOADING_STAGES = [
  { step: '01', title: 'Classifying Research Topic & Question...' },
  { step: '02', title: 'Synthesizing Domain Keywords & Boolean Queries...' },
  { step: '03', title: 'Querying OpenAlex, arXiv, Semantic Scholar & Crossref...' },
  { step: '04', title: 'Ingesting Academic Records & Abstracts...' },
  { step: '05', title: 'Normalizing Disparate Publisher Schemas...' },
  { step: '06', title: 'Deduplicating Multi-Key DOIs & Titles...' },
  { step: '07', title: 'Applying Inclusion & Exclusion Criteria...' },
  { step: '08', title: 'Computing Semantic Relevance Similarity...' },
  { step: '09', title: 'Synthesizing Academic Relevance Rationales...' },
  { step: '10', title: 'Verifying Publisher URLs & Author Provenance...' },
  { step: '11', title: 'Detecting Open-Access Status & PDF Repositories...' },
  { step: '12', title: 'Compiling Output 1 JSON for Module 2...' }
];

export default function SearchLoadingModal({ isOpen, topic }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIdx(prev => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
    }, 380);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStage = LOADING_STAGES[currentStageIdx];
  const progressPct = Math.round(((currentStageIdx + 1) / LOADING_STAGES.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#D7E8DC] shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F1EA] text-[#123D32] flex items-center justify-center mx-auto mb-4 border border-[#B8D3C2]">
          <div className="w-7 h-7 border-3 border-[#176B50]/30 border-t-[#123D32] rounded-full animate-spin"></div>
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-[#E8F1EA] text-[#123D32] px-3 py-1 rounded-full text-xs font-mono font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#176B50]" />
          <span>STAGE {currentStage.step} OF 12</span>
        </div>

        <h3 className="font-serif text-lg font-bold text-[#123D32] mb-1">
          {currentStage.title}
        </h3>

        <p className="text-xs text-gray-500 font-sans max-w-sm mx-auto mb-5 truncate">
          Active Query: "{topic}"
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden border border-gray-200">
          <div
            className="bg-gradient-to-r from-[#176B50] to-[#123D32] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>Retrieving authentic peer-reviewed literature</span>
          <span className="font-bold text-[#176B50]">{progressPct}%</span>
        </div>
      </div>
    </div>
  );
}
