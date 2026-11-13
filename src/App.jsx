/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import Module1Discovery from './components/Module1Discovery.jsx';
import Module2Analysis from './components/Module2Analysis.jsx';
import Module3GapAnalyzer from './components/Module3GapAnalyzer.jsx';
import AuthModal from './components/AuthModal.jsx';
import Toast from './components/Toast.jsx';
import Footer from './components/Footer.jsx';
import {
  validateOutput1Payload,
  analyzePaperRecord,
  generateCrossPaperSynthesis,
  buildModule3Output
} from './utils/paperAnalysisEngine.js';
import {
  validateOutput2Payload,
  normalizeObservations,
  clusterObservations,
  detectContradictionsAndTensions,
  formulateCandidateGaps,
  buildFinalGapReport
} from './utils/researchGapEngine.js';

export default function App() {
  // STRICT 3 PRIMARY TABS: 'module1', 'module2', 'module3'
  const [activeModule, setActiveModule] = useState('module1');

  // Unified End-to-End Pipeline State: Output 1 -> Output 2 -> Output 3
  const [importedPayload, setImportedPayload] = useState(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploadedPdfs, setUploadedPdfs] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [synthesis, setSynthesis] = useState(null);
  const [output2Payload, setOutput2Payload] = useState(null);
  const [output3Payload, setOutput3Payload] = useState(null);

  // Loading & Error States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [module2Error, setModule2Error] = useState(null);
  const [module3Error, setModule3Error] = useState(null);

  // Auth / Scholar Profile Modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [scholarProfile, setScholarProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('researchscholar_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name !== 'Dr. Eleanor Vance') {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      name: 'Example 1',
      role: 'RESEARCHSCHOLAR',
      institution: 'RESEARCHSCHOLAR AI Institute',
      email: 'example1@researchscholar.ai',
      orcid: '0000-0001-8820-4109',
      field: 'Agentic AI & Computer Science'
    };
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('researchscholar_profile', JSON.stringify(scholarProfile));
    } catch (e) {}
  }, [scholarProfile]);

  const resetDownstreamOutputs = useCallback(() => {
    setAnalyses([]);
    setSynthesis(null);
    setOutput2Payload(null);
    setOutput3Payload(null);
    setModule2Error(null);
    setModule3Error(null);
  }, []);

  /**
   * Execute Module 3: Research Gap Identification strictly from validated Output 2.
   */
  const executeModule3Analysis = useCallback(async (output2Data, { navigate = false, quiet = false } = {}) => {
    const validation = validateOutput2Payload(output2Data);
    if (!validation.valid) {
      const msg = `Cannot run Module 3 without valid Output 2 data: ${validation.errors.join(' ')}`;
      setModule3Error(msg);
      setOutput3Payload(null);
      if (!quiet) showToast(msg, 'error');
      return null;
    }

    setModule3Error(null);
    setIsSynthesizing(true);

    try {
      const res = await axios.post('/api/gap/analyze', { output2Payload: validation.data });
      const data = res.data;
      if (data && data.success && data.final_report) {
        const resultObj = {
          clusters: data.clusters || [],
          tensions: data.tensions || [],
          candidateGaps: data.candidate_gaps || [],
          finalReport: data.final_report,
          analysisEngine: data.analysis_engine || data.final_report.analysis_engine || 'Grounded Comparator',
          evidenceSufficiency: data.evidence_sufficiency || data.final_report.evidence_sufficiency
        };
        setOutput3Payload(resultObj);
        if (navigate) setActiveModule('module3');
        if (!quiet) {
          showToast(
            `Module 3 synthesized ${resultObj.candidateGaps.length} research gap(s)/opportunity(ies) from Output 2.`,
            'success'
          );
        }
        return resultObj;
      }
      throw new Error('Invalid response from Module 3 gap synthesis server.');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const msg = err.response.data?.details?.join(' ') || err.response.data?.error || err.message;
        setModule3Error(msg);
        showToast(`Module 3 rejected Output 2: ${msg}`, 'error');
        return null;
      }

      console.warn('Module 3 backend fallback triggered:', err.message);
      try {
        const norm = normalizeObservations(validation.data.analyses);
        const cls = clusterObservations(norm, validation.data.analyses);
        const tns = detectContradictionsAndTensions(validation.data.analyses, norm);
        const gps = formulateCandidateGaps(cls, norm, validation.data.analyses, validation.data.research_topic, tns);
        const rpt = buildFinalGapReport(validation.data, gps, cls, tns, norm);
        const fallbackObj = {
          clusters: cls,
          tensions: tns,
          candidateGaps: gps,
          finalReport: rpt,
          analysisEngine: rpt.analysis_engine || 'Deterministic Grounded Comparator',
          evidenceSufficiency: rpt.evidence_sufficiency
        };
        setOutput3Payload(fallbackObj);
        if (navigate) setActiveModule('module3');
        if (!quiet) {
          showToast('Module 3 synthesized research gaps using deterministic grounded comparator.', 'info');
        }
        return fallbackObj;
      } catch (localErr) {
        setModule3Error(localErr.message);
        showToast(`Module 3 synthesis failed: ${localErr.message}`, 'error');
        return null;
      }
    } finally {
      setIsSynthesizing(false);
    }
  }, [showToast]);

  /**
   * Execute Module 2: Research Paper Analysis via backend PDF retrieval + In-House NLP Extractor,
   * then automatically feed validated Output 2 into Module 3.
   */
  const executeModule2Analysis = useCallback(async (payloadToUse, instructionsToUse = '', pdfsToUse = null, navigate = false) => {
    const payload = payloadToUse || importedPayload;
    const activePdfs = pdfsToUse !== null ? pdfsToUse : uploadedPdfs;
    const activeInstructions = instructionsToUse !== undefined ? instructionsToUse : customInstructions;

    const validation = validateOutput1Payload(payload);
    if (!validation.valid) {
      const msg = `Invalid Output 1 input: ${validation.errors.join(' ')}`;
      setModule2Error(msg);
      resetDownstreamOutputs();
      showToast(msg, 'error');
      return null;
    }

    setModule2Error(null);
    setModule3Error(null);
    setIsAnalyzing(true);

    let producedOutput2 = null;

    try {
      const response = await axios.post('/api/analysis/process-papers', {
        output1Payload: validation.data,
        customInstructions: activeInstructions,
        pdfUploads: activePdfs
      });

      const data = response.data;
      if (data && data.success && data.output2) {
        setAnalyses(data.analyses || []);
        setSynthesis(data.synthesis || null);
        setOutput2Payload(data.output2);
        producedOutput2 = data.output2;

        if (navigate) {
          setActiveModule('module2');
        }
        showToast(`Analyzed ${data.analyses?.length || 0} papers with verified grounding.`, 'success');
      } else {
        throw new Error('Invalid response from Module 2 analysis server.');
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const msg = err.response.data?.details?.join(' ') || err.response.data?.error || err.message;
        setModule2Error(msg);
        resetDownstreamOutputs();
        showToast(`Module 2 validation failed: ${msg}`, 'error');
        setIsAnalyzing(false);
        return null;
      }

      console.warn('Backend analysis fallback triggered:', err.message);
      try {
        const papers = validation.data.papers || [];
        const localAnalyses = papers.map(p => {
          const pCopy = { ...p };
          const uploaded = activePdfs[p.paper_id];
          if (uploaded) {
            if (uploaded.extractionStatus === 'scanned_pdf' || uploaded.isScanned) {
              pCopy.extraction_status = 'scanned_pdf';
              pCopy.retrieval_note = uploaded.warning;
            } else if (uploaded.pages && uploaded.pages.length > 0) {
              pCopy.pages = uploaded.pages;
              pCopy.fullText = uploaded.text;
              pCopy.document_status = 'full_text';
            } else if (uploaded.text) {
              pCopy.fullText = uploaded.text;
              pCopy.document_status = 'full_text';
            }
          }
          return analyzePaperRecord(pCopy, activeInstructions);
        });

        const localSynthesis = generateCrossPaperSynthesis(localAnalyses, validation.data.research_topic);
        const localOutput2 = buildModule3Output(validation.data, localAnalyses, localSynthesis);

        setAnalyses(localAnalyses);
        setSynthesis(localSynthesis);
        setOutput2Payload(localOutput2);
        producedOutput2 = localOutput2;

        if (navigate) {
          setActiveModule('module2');
        }
        showToast(`Analyzed ${localAnalyses.length} papers using local grounded extractor.`, 'info');
      } catch (localErr) {
        console.error('Analysis error:', localErr);
        setModule2Error(localErr.message);
        showToast(`Analysis failed: ${localErr.message}`, 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }

    // Single unified downstream chain: Output 2 -> Module 3 (Output 3)
    if (producedOutput2) {
      await executeModule3Analysis(producedOutput2, { navigate: false, quiet: true });
    }

    return producedOutput2;
  }, [importedPayload, uploadedPdfs, customInstructions, resetDownstreamOutputs, showToast, executeModule3Analysis]);

  // AUTOMATIC HANDOFF from Module 1 to Module 2 (validated)
  const handleSendToModule2 = useCallback((output1Data) => {
    resetDownstreamOutputs();
    const validation = validateOutput1Payload(output1Data);
    if (!validation.valid) {
      setImportedPayload(output1Data || null);
      return;
    }
    setImportedPayload(validation.data);
    executeModule2Analysis(validation.data, customInstructions, uploadedPdfs, false);
  }, [resetDownstreamOutputs, executeModule2Analysis, customInstructions, uploadedPdfs]);

  const handleManualImportPayload = useCallback((newPayload) => {
    const validation = validateOutput1Payload(newPayload);
    if (!validation.valid) {
      setModule2Error(validation.errors.join(' '));
      showToast(`Invalid Output 1 JSON: ${validation.errors[0]}`, 'error');
      return;
    }
    resetDownstreamOutputs();
    setImportedPayload(validation.data);
  }, [resetDownstreamOutputs, showToast]);

  const handlePdfUploaded = (paperId, pdfRecord) => {
    const updated = { ...uploadedPdfs, [paperId]: pdfRecord };
    setUploadedPdfs(updated);
    if (pdfRecord.isScanned || pdfRecord.extractionStatus === 'scanned_pdf') {
      showToast(`Scanned PDF attached for ${paperId} (OCR needed; abstract-only fallback will be used).`, 'warning');
    } else {
      showToast(`Parsed ${pdfRecord.pageCount} pages from ${pdfRecord.filename}. Re-run analysis to extract full-text claims.`, 'success');
    }
  };

  const handleRemovePdf = (paperId) => {
    const updated = { ...uploadedPdfs };
    delete updated[paperId];
    setUploadedPdfs(updated);
    showToast(`Removed PDF for ${paperId}.`, 'info');
  };

  // GATED NAVIGATION helper (Requirement 6: prevent accessing downstream Module 3 without valid Output 2)
  const handleModuleNavigation = useCallback((targetModule) => {
    if (targetModule === 'module3') {
      const v2 = validateOutput2Payload(output2Payload);
      if (!v2.valid) {
        showToast('Please run Module 2 Paper Analysis first before opening Module 3.', 'warning');
        return;
      }
      if (!output3Payload) {
        executeModule3Analysis(v2.data, { navigate: true });
        return;
      }
    }
    setActiveModule(targetModule);
  }, [output2Payload, output3Payload, executeModule3Analysis, showToast]);

  const hasValidModule1 = validateOutput1Payload(importedPayload).valid;
  const hasValidModule2 = validateOutput2Payload(output2Payload).valid;
  const hasValidModule3 = Boolean(output3Payload?.finalReport);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#1A2822]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar
        activeModule={activeModule}
        setActiveModule={handleModuleNavigation}
        scholarProfile={scholarProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        hasModule1Data={hasValidModule1}
        hasModule2Data={hasValidModule2}
        hasModule3Data={hasValidModule3}
        isBusy={isAnalyzing || isSynthesizing}
      />

      <main className="flex-1">
        {activeModule === 'module1' && (
          <Module1Discovery
            onSearchStarted={resetDownstreamOutputs}
            onSendToModule2={handleSendToModule2}
            onNavigateToModule2={() => handleModuleNavigation('module2')}
            showToast={showToast}
          />
        )}

        {activeModule === 'module2' && (
          <Module2Analysis
            importedPayload={importedPayload}
            onImportPayload={handleManualImportPayload}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            uploadedPdfs={uploadedPdfs}
            onPdfUploaded={handlePdfUploaded}
            onRemovePdf={handleRemovePdf}
            analyses={analyses}
            synthesis={synthesis}
            output2Payload={output2Payload}
            isAnalyzing={isAnalyzing}
            isSynthesizing={isSynthesizing}
            module2Error={module2Error}
            onExecuteAnalysis={() => executeModule2Analysis(importedPayload, customInstructions, uploadedPdfs, false)}
            onSendToModule3={(out2) => {
              const v2 = validateOutput2Payload(out2 || output2Payload);
              if (!v2.valid) {
                showToast('Valid Module 2 analyses are required before entering Module 3.', 'error');
                return;
              }
              if (output3Payload) {
                setActiveModule('module3');
              } else {
                executeModule3Analysis(v2.data, { navigate: true });
              }
            }}
            onNavigateToModule1={() => setActiveModule('module1')}
            onNavigateToModule3={() => handleModuleNavigation('module3')}
            showToast={showToast}
          />
        )}

        {activeModule === 'module3' && (
          <Module3GapAnalyzer
            importedData={output2Payload}
            output3Data={output3Payload}
            isSynthesizing={isSynthesizing}
            gapError={module3Error}
            onReRunGapAnalysis={() => executeModule3Analysis(output2Payload, { navigate: false })}
            onNavigateToModule2={() => setActiveModule('module2')}
            showToast={showToast}
          />
        )}
      </main>

      {isAuthOpen && (
        <AuthModal
          profile={scholarProfile}
          onSaveProfile={(updated) => {
            setScholarProfile(updated);
            setIsAuthOpen(false);
            showToast('Scholar profile updated.', 'success');
          }}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      <Footer
        scholarProfile={scholarProfile}
        onNavigate={(mod) => {
          if (['module1', 'module2', 'module3'].includes(mod)) {
            handleModuleNavigation(mod);
          }
        }}
      />
    </div>
  );
}
