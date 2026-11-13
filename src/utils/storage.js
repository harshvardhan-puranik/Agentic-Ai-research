/**
 * LocalStorage state persistence helpers for ResearchScholar AI
 */

const STORAGE_KEYS = {
  PROFILE: 'rs_scholar_profile',
  SAVED_PAPERS: 'rs_saved_papers',
  SEARCH_HISTORY: 'rs_search_history',
  LAST_SEARCH: 'rs_last_search_state',
  PREFERENCES: 'rs_workspace_preferences'
};

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    name: 'Dr. Eleanor Vance',
    role: 'Senior Research Fellow',
    institution: 'Institute for Advanced Study',
    email: 'e.vance@ias.edu',
    orcid: '0000-0002-1825-0097',
    field: 'Computer Science & AI',
    isLoggedIn: true
  };
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedPapers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PAPERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function savePaperToLibrary(paper, tags = ['Core Literature'], notes = '') {
  try {
    const papers = getSavedPapers();
    const existingIdx = papers.findIndex(p => p.paper_id === paper.paper_id || (p.doi && p.doi === paper.doi));
    if (existingIdx >= 0) {
      papers[existingIdx] = { ...papers[existingIdx], ...paper, tags, notes, savedAt: new Date().toISOString() };
    } else {
      papers.unshift({
        ...paper,
        tags,
        notes,
        savedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_PAPERS, JSON.stringify(papers));
    return papers;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function removeSavedPaper(paperId) {
  try {
    const papers = getSavedPapers().filter(p => p.paper_id !== paperId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PAPERS, JSON.stringify(papers));
    return papers;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function recordSearchHistory(entry) {
  try {
    const history = getSearchHistory();
    const filtered = history.filter(h => h.topic.toLowerCase() !== entry.topic.toLowerCase());
    filtered.unshift({
      id: `hist-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
    const trimmed = filtered.slice(0, 25);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function getLastSearchState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveLastSearchState(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, JSON.stringify(state));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Generate BibTeX citation string for a paper
 */
export function generateBibTeX(paper) {
  const authorLastName = (paper.authors?.[0] || 'Unknown').split(' ').pop().toLowerCase().replace(/[^\w]/g, '');
  const year = paper.year || 2024;
  const citeKey = `${authorLastName}${year}${paper.title?.split(' ')?.[0]?.toLowerCase().replace(/[^\w]/g, '') || 'paper'}`;

  const authorsStr = (paper.authors || []).join(' and ');
  const title = paper.title || 'Untitled';
  const journal = paper.venue || paper.source || 'Preprint';
  const doi = paper.doi ? `\n  doi       = {${paper.doi}},` : '';
  const url = paper.verified_source_url ? `\n  url       = {${paper.verified_source_url}},` : '';

  return `@article{${citeKey},
  title     = {${title}},
  author    = {${authorsStr}},
  journal   = {${journal}},
  year      = {${year}},${doi}${url}
  publisher = {${paper.source}}
}`;
}
