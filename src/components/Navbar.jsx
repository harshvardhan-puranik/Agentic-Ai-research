import React, { useState } from 'react';
import {
  Brain,
  Search,
  Cpu,
  Lock,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({
  activeModule = 'module1', // 'module1', 'module2', 'module3'
  setActiveModule,
  scholarProfile,
  onOpenAuth,
  hasModule1Data = false,
  hasModule2Data = false,
  hasModule3Data = false,
  isBusy = false
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    {
      id: 'module1',
      number: '1',
      title: 'RESEARCH PAPER DISCOVERY',
      shortTitle: 'Discovery Agent',
      desc: 'Retrieves & ranks real scholarly papers',
      icon: Search,
      isReady: true,
      hasData: hasModule1Data
    },
    {
      id: 'module2',
      number: '2',
      title: 'RESEARCH PAPER ANALYSIS',
      shortTitle: 'Analysis Agent',
      desc: 'Extracts methods, datasets & page-grounded quotes',
      icon: Cpu,
      isReady: hasModule1Data,
      hasData: hasModule2Data
    },
    {
      id: 'module3',
      number: '3',
      title: 'RESEARCH GAP IDENTIFICATION',
      shortTitle: 'Gap Analysis Agent',
      desc: 'Discovers limitations & generates final report',
      icon: Brain,
      isReady: hasModule2Data,
      hasData: hasModule3Data
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#123D32] text-white border-b border-[#1A4F42] shadow-md">
      {/* Top Banner Notice */}
      <div className="bg-[#0B2821] text-xs px-4 sm:px-6 py-1.5 flex items-center justify-between text-emerald-200 border-b border-[#133E33]">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isBusy ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span className="font-semibold text-emerald-100 uppercase tracking-widest text-[11px]">
            AGENTIC AI RESEARCH ASSISTANT
          </span>
          <span className="hidden sm:inline text-emerald-500">•</span>
          <span className="hidden sm:inline text-emerald-300/80 text-[11px]">
            {isBusy ? 'Processing Active Pipeline Stage...' : 'In-House Academic Discovery, Extraction & Gap Engine'}
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#176B50] border border-[#2B866A] flex items-center justify-center text-white shadow-inner flex-shrink-0">
              <Brain className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="font-brand font-bold text-base xl:text-lg tracking-wider text-white">
                  RESEARCH SCHOLAR
                </span>
                <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-300 bg-[#0E3027] border border-emerald-500/40 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/80 font-sans tracking-wide whitespace-nowrap">
                Autonomous Academic Research Assistant
              </p>
            </div>
          </div>

          {/* THE 3 CLEAN MODULE TABS (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1.5 xl:space-x-2" aria-label="Research Modules">
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              const isLocked = mod.id === 'module3' && !hasModule2Data;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  title={isLocked ? 'Analyze at least one paper in Module 2 to unlock Module 3' : mod.desc}
                  className={`flex items-center space-x-2 px-3 xl:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#176B50] text-white shadow-sm ring-1 ring-emerald-400/60'
                      : isLocked
                      ? 'text-emerald-200/50 hover:bg-[#1A4F42]/50'
                      : 'text-emerald-100 hover:text-white hover:bg-[#1A4F42]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-emerald-300 text-[#123D32]' : 'bg-[#0E3027] text-emerald-300'
                    }`}
                  >
                    {mod.number}
                  </span>
                  <div className="text-left leading-tight">
                    <div className="tracking-wide text-[11px] xl:text-xs flex items-center space-x-1">
                      <span>{mod.title}</span>
                      {isLocked && <Lock className="w-3 h-3 text-emerald-300/60 shrink-0" />}
                    </div>
                    <div className={`text-[10px] font-normal font-sans ${isActive ? 'text-emerald-200' : 'text-emerald-300/70'}`}>
                      {mod.shortTitle}
                    </div>
                  </div>
                  {mod.hasData && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5 shrink-0" title="Output validated & ready"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Profile & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 bg-[#1A4F42] hover:bg-[#236354] px-2.5 py-1.5 rounded-lg text-xs text-emerald-100 transition-colors border border-emerald-600/30 cursor-pointer shadow-xs"
              aria-label="Academic Scholar Profile"
              title="Click to view or edit scholar profile"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-[#123D32] font-bold text-xs flex items-center justify-center shrink-0">
                {scholarProfile?.name ? scholarProfile.name.charAt(0) : 'E'}
              </div>
              <div className="flex flex-col text-left leading-tight hidden sm:flex">
                <span className="font-bold text-white text-xs truncate max-w-[110px]">
                  {scholarProfile?.name || 'Example 1'}
                </span>
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider">
                  {scholarProfile?.role || 'RESEARCHSCHOLAR'}
                </span>
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-[#1A4F42] focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0F352B] border-t border-[#1C5245] px-4 pt-3 pb-4 space-y-2">
          <div className="text-[11px] font-mono text-emerald-300 uppercase px-2 mb-1">
            Select Active Research Agent:
          </div>
          {modules.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-[#176B50] text-white font-bold ring-1 ring-emerald-400'
                    : 'text-emerald-100 hover:bg-[#144236]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#0E3027] flex items-center justify-center text-emerald-300 font-bold font-mono text-xs">
                    {mod.number}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{mod.title}</div>
                    <div className="text-[10px] text-emerald-300/80">{mod.desc}</div>
                  </div>
                </div>
                {mod.hasData && (
                  <span className="text-[10px] font-mono bg-emerald-700/60 px-2 py-0.5 rounded text-emerald-200">
                    Ready
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
