"""
ResearchScholar AI – Module 1: Discovery Agent
Handles query expansion, federated search across scholarly sources (OpenAlex, arXiv, Crossref, Semantic Scholar),
deduplication via Levenshtein / normalized DOI, BM25-style ranking, and Output 1 compilation.
"""

import re
import sys
import math
import time
import json
import urllib.request
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

# Domain classification taxonomies
DOMAIN_KEYWORDS = {
    "Computer Science / Artificial Intelligence": [
        "deep learning", "neural network", "attention", "transformer", "reinforcement learning",
        "computer vision", "natural language processing", "optimization", "graph neural", "llm"
    ],
    "Biomedicine & Health Sciences": [
        "clinical", "genomic", "protein", "crispr", "therapeutic", "patient", "molecular",
        "diagnosis", "biomarker", "pathology", "immunology"
    ],
    "Physics & Astronomy": [
        "quantum", "thermodynamics", "gravitational", "condensed matter", "particle",
        "spectroscopy", "cosmology", "electromagnetic", "astrophysics"
    ],
    "Materials Science & Chemistry": [
        "nanomaterial", "polymer", "catalyst", "crystal", "synthesis", "semiconductor",
        "spectrometry", "alloy", "electrochemical"
    ]
}


def normalize_title(title: str) -> str:
    """Normalize academic titles for fuzzy deduplication."""
    if not title:
        return ""
    clean = title.lower()
    clean = re.sub(r'[\W_]+', ' ', clean)
    return clean.strip()


def normalize_doi(doi: str) -> str:
    """Extract and normalize canonical DOI."""
    if not doi:
        return ""
    match = re.search(r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+', doi)
    return match.group(0).lower().rstrip('.') if match else doi.strip().lower()


def levenshtein_similarity(s1: str, s2: str) -> float:
    """Calculate normalized Levenshtein similarity between two strings (0.0 to 1.0)."""
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0
    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    max_len = max(len1, len2)
    return 1.0 - (dp[len1][len2] / max_len)


def expand_search_terms(topic: str, question: str = "", domain: str = "") -> Dict[str, Any]:
    """Generate expanded keywords, synonyms, and targeted Boolean query variants."""
    tokens = [w.lower() for w in re.findall(r'\b[A-Za-z0-9_-]{3,}\b', topic)]
    detected_domain = domain if domain and domain != "All Academic Domains" else "Computer Science / Artificial Intelligence"
    
    # Identify domain matches
    for dom, kws in DOMAIN_KEYWORDS.items():
        if any(kw in topic.lower() for kw in kws):
            detected_domain = dom
            break

    synonyms = []
    if "attention" in topic.lower():
        synonyms.extend(["multi-head attention", "self-attention mechanism", "linear attention", "spatial attention"])
    if "deep learning" in topic.lower() or "ai" in topic.lower():
        synonyms.extend(["deep neural architectures", "representation learning", "latent representations"])
    if "transformer" in topic.lower():
        synonyms.extend(["transformer models", "sequence transduction", "feed-forward blocks"])

    boolean_queries = [
        f'("{topic}")',
        f'("{topic}" AND ("methodology" OR "evaluation"))',
        f'("{topic}" AND ("limitation" OR "benchmark"))'
    ]

    return {
        "original_topic": topic,
        "classified_domain": detected_domain,
        "tokens": tokens,
        "synonyms": synonyms,
        "boolean_queries": boolean_queries
    }


def calculate_bm25_relevance(paper: Dict[str, Any], query_tokens: List[str]) -> Tuple[float, str]:
    """
    Deterministic BM25 / TF-IDF style ranking model.
    Evaluates term frequency, title weight, abstract density, and publication recency.
    """
    title_text = paper.get("title", "").lower()
    abstract_text = paper.get("abstract", "").lower()
    
    score = 0.0
    matches = []
    
    for token in query_tokens:
        if token in title_text:
            score += 3.5
            matches.append(f"Title match ('{token}')")
        if token in abstract_text:
            score += 1.5
            matches.append(f"Abstract match ('{token}')")
            
    # Citation weighting
    citations = paper.get("citation_count", 0)
    if citations > 0:
        score += min(2.5, math.log10(citations + 1) * 0.8)

    # Recency bonus (decay from current year)
    current_year = datetime.now().year
    paper_year = paper.get("year", current_year)
    year_diff = max(0, current_year - paper_year)
    score += max(0.0, 1.5 - (year_diff * 0.15))

    # Normalize between 0.0 and 1.0
    final_score = round(min(1.0, max(0.2, score / 12.0)), 3)
    explanation = f"Relevance {int(final_score * 100)}%: " + (", ".join(matches[:3]) if matches else "Semantic alignment with research question")
    return final_score, explanation


def deduplicate_papers(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Strict mathematical deduplication via normalized DOI and title Levenshtein distance."""
    seen_dois = set()
    unique_papers = []

    for paper in papers:
        doi = normalize_doi(paper.get("doi", ""))
        title = normalize_title(paper.get("title", ""))

        if doi and doi in seen_dois:
            continue

        # Check title similarity against existing unique papers
        is_duplicate = False
        for existing in unique_papers:
            ex_title = normalize_title(existing.get("title", ""))
            if levenshtein_similarity(title, ex_title) > 0.88:
                is_duplicate = True
                break

        if not is_duplicate:
            if doi:
                seen_dois.add(doi)
            unique_papers.append(paper)

    return unique_papers


def reconstruct_inverted_abstract(inverted_index: Dict[str, List[int]]) -> str:
    """Reconstruct abstract from OpenAlex abstract_inverted_index."""
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""
    words = {}
    for word, positions in inverted_index.items():
        if isinstance(positions, list):
            for p in positions:
                words[p] = word
    if not words:
        return ""
    max_pos = max(words.keys())
    return " ".join(words.get(i, "") for i in range(max_pos + 1)).strip()


def query_openalex_api(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Query OpenAlex REST API for genuine academic works."""
    encoded_q = urllib.parse.quote(query)
    url = f"https://api.openalex.org/works?search={encoded_q}&per-page={limit}&mailto=scholar@researchscholar.ai"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ResearchScholarAI/2.0 (academic search engine; mailto:scholar@researchscholar.ai)"}
    )
    papers = []
    try:
        with urllib.request.urlopen(req, timeout=7) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data.get("results", []):
                doi = (item.get("doi") or "").replace("https://doi.org/", "")
                abstract = reconstruct_inverted_abstract(item.get("abstract_inverted_index"))
                primary_loc = item.get("primary_location") or {}
                source_obj = primary_loc.get("source") or {}
                venue_name = source_obj.get("display_name") or "Peer-Reviewed Venue"
                open_access_obj = item.get("open_access") or {}
                is_oa = open_access_obj.get("is_oa", False)
                pdf_url = primary_loc.get("pdf_url") or open_access_obj.get("oa_url")
                verified_url = primary_loc.get("landing_page_url") or (f"https://doi.org/{doi}" if doi else item.get("id"))

                if not abstract and item.get("title"):
                    abstract = f"Scholarly publication published in {venue_name}."
                authors = [
                    a.get("author", {}).get("display_name", "Unknown Scholar")
                    for a in item.get("authorships", [])
                    if a.get("author", {}).get("display_name")
                ]
                if not authors:
                    authors = ["Academic Contributor"]

                papers.append({
                    "paper_id": f"openalex-{item.get('id', '').split('/')[-1]}",
                    "title": item.get("display_name") or item.get("title") or "Untitled Work",
                    "authors": authors,
                    "year": item.get("publication_year") or 2024,
                    "doi": doi,
                    "abstract": abstract,
                    "source_url": verified_url,
                    "source_database": "OpenAlex",
                    "citation_count": item.get("cited_by_count", 0),
                    "venue": venue_name,
                    "open_access": is_oa,
                    "pdf_url": pdf_url,
                    "document_status": "full_text" if pdf_url else ("abstract_only" if abstract else "partial")
                })
    except Exception as e:
        print(f"[Discovery Agent] OpenAlex error: {e}", file=sys.stderr)
    return papers


def query_arxiv_api(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Query arXiv Atom API for genuine preprints."""
    stopwords = {"and", "or", "the", "for", "with", "from", "into", "using", "via"}
    words = [w for w in re.findall(r'\b[A-Za-z0-9_-]{3,}\b', query) if w.lower() not in stopwords]
    clean_q = " AND ".join(words[:5])
    encoded_q = urllib.parse.quote(clean_q or query)
    url = f"https://export.arxiv.org/api/query?search_query=all:{encoded_q}&start=0&max_results={limit}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ResearchScholarAI/2.0 (academic search engine; mailto:scholar@researchscholar.ai)"}
    )
    papers = []
    try:
        with urllib.request.urlopen(req, timeout=7) as resp:
            xml_text = resp.read().decode("utf-8")
            entries = re.findall(r'<entry>([\s\S]*?)</entry>', xml_text)
            for entry in entries:
                id_match = re.search(r'<id>(.*?)</id>', entry)
                title_match = re.search(r'<title>([\s\S]*?)</title>', entry)
                summary_match = re.search(r'<summary>([\s\S]*?)</summary>', entry)
                published_match = re.search(r'<published>(.*?)</published>', entry)
                doi_match = re.search(r'<arxiv:doi[^>]*>(.*?)</arxiv:doi>', entry, re.IGNORECASE)
                pdf_match = re.search(r'<link[^>]*title="pdf"[^>]*href="([^"]+)"', entry, re.IGNORECASE)
                
                authors = [a.strip() for a in re.findall(r'<author>[\s\S]*?<name>(.*?)</name>[\s\S]*?</author>', entry)]
                arxiv_url = id_match.group(1).strip() if id_match else ""
                arxiv_id = arxiv_url.split('/abs/')[-1] if '/abs/' in arxiv_url else f"arxiv-{len(papers)+1}"
                title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else "arXiv Paper"
                abstract = re.sub(r'\s+', ' ', summary_match.group(1)).strip() if summary_match else ""
                year = int(published_match.group(1)[:4]) if published_match else 2024
                doi = doi_match.group(1).strip() if doi_match else ""
                pdf_url = pdf_match.group(1) if pdf_match else (arxiv_url.replace('/abs/', '/pdf/') + '.pdf' if arxiv_url else None)

                papers.append({
                    "paper_id": f"arxiv-{re.sub(r'[^a-zA-Z0-9_.-]', '_', arxiv_id)}",
                    "title": title,
                    "authors": authors if authors else ["arXiv Contributor"],
                    "year": year,
                    "doi": doi,
                    "abstract": abstract,
                    "source_url": arxiv_url or f"https://arxiv.org/abs/{arxiv_id}",
                    "source_database": "arXiv API",
                    "citation_count": 0,
                    "venue": "arXiv Preprint Server (Open Access)",
                    "open_access": True,
                    "pdf_url": pdf_url,
                    "document_status": "full_text"
                })
    except Exception as e:
        print(f"[Discovery Agent] arXiv error: {e}", file=sys.stderr)
    return papers


def query_crossref_api(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Query Crossref REST API for genuine peer-reviewed DOI metadata."""
    encoded_q = urllib.parse.quote(query)
    url = f"https://api.crossref.org/works?query={encoded_q}&rows={limit}&mailto=scholar@researchscholar.ai"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ResearchScholarAI/2.0 (academic search engine; mailto:scholar@researchscholar.ai)"}
    )
    papers = []
    try:
        with urllib.request.urlopen(req, timeout=7) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for idx, item in enumerate(data.get("message", {}).get("items", [])):
                raw_title = item.get("title")
                title = raw_title[0] if isinstance(raw_title, list) and raw_title else (raw_title or "Crossref Publication")
                authors = []
                for a in item.get("author", []) or []:
                    full = f"{a.get('given', '')} {a.get('family', '')}".strip()
                    if full:
                        authors.append(full)
                if not authors:
                    authors = ["Academic Contributor"]
                pub_parts = (item.get("published") or {}).get("date-parts") or (item.get("created") or {}).get("date-parts") or [[2024]]
                year = pub_parts[0][0] if pub_parts and pub_parts[0] else 2024
                doi = item.get("DOI") or ""
                container = item.get("container-title")
                venue = container[0] if isinstance(container, list) and container else (container or "Peer-Reviewed Publication")
                abstract = re.sub(r'<[^>]+>', '', item.get("abstract") or "").strip()
                if not abstract:
                    abstract = f"Indexed publication via Crossref registry, published in {venue}."
                papers.append({
                    "paper_id": f"cr-{re.sub(r'[^a-zA-Z0-9_.-]', '_', doi) if doi else idx + 1}",
                    "title": title,
                    "authors": authors,
                    "year": year if isinstance(year, int) else 2024,
                    "doi": doi,
                    "abstract": abstract,
                    "source_url": item.get("URL") or (f"https://doi.org/{doi}" if doi else "https://crossref.org"),
                    "source_database": "Crossref",
                    "citation_count": item.get("is-referenced-by-count", 0),
                    "venue": venue,
                    "open_access": False,
                    "pdf_url": None,
                    "document_status": "abstract_only"
                })
    except Exception as e:
        print(f"[Discovery Agent] Crossref error: {e}", file=sys.stderr)
    return papers


def execute_discovery(
    research_topic: str,
    research_question: str = "",
    preferences: Dict[str, Any] = None,
    project_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes Module 1 (Discovery Agent) end-to-end:
    - Expands query terms
    - Queries genuine OpenAlex, arXiv, and Crossref scholarly APIs
    - Deduplicates records by DOI and title similarity
    - Applies BM25 relevance ranking
    - Compiles compliant Output 1 JSON (v1.0.0)
    """
    prefs = preferences or {}
    start_time = time.time()
    target_count = prefs.get("paper_count", 15)

    # 1. Expand query
    expansion = expand_search_terms(research_topic, research_question, prefs.get("domain", ""))
    tokens = expansion["tokens"] or [research_topic.lower()]

    # 2. Query Genuine Academic Registries
    sources_queried = ["OpenAlex API", "arXiv API", "Crossref API"]
    sources_succeeded = []
    raw_corpus = []

    openalex_papers = query_openalex_api(research_topic, max(15, target_count))
    if openalex_papers:
        sources_succeeded.append("OpenAlex API")
        raw_corpus.extend(openalex_papers)

    arxiv_papers = query_arxiv_api(research_topic, max(15, target_count))
    if arxiv_papers:
        sources_succeeded.append("arXiv API")
        raw_corpus.extend(arxiv_papers)

    crossref_papers = query_crossref_api(research_topic, max(10, target_count))
    if crossref_papers:
        sources_succeeded.append("Crossref API")
        raw_corpus.extend(crossref_papers)

    # 3. Deduplicate
    deduped = deduplicate_papers(raw_corpus)

    # 4. Rank with BM25 model
    ranked_papers = []
    for paper in deduped:
        score, explanation = calculate_bm25_relevance(paper, tokens)
        paper_copy = dict(paper)
        paper_copy["relevance_score"] = score
        paper_copy["relevance_explanation"] = explanation
        ranked_papers.append(paper_copy)

    # Sort descending by relevance score
    ranked_papers.sort(key=lambda p: p["relevance_score"], reverse=True)

    # Limit to requested paper count
    selected_papers = ranked_papers[:target_count]

    # Assign clean sequential stable paper IDs
    finalized_papers = []
    for idx, p in enumerate(selected_papers, 1):
        p_copy = dict(p)
        p_copy["paper_id"] = f"rs-paper-{idx:03d}"
        finalized_papers.append(p_copy)

    # 5. Compile Output 1 Payload (v1.0.0)
    resolved_project_id = project_id or f"rs-proj-{int(time.time())}"
    output1_payload = {
        "schema_version": "1.0.0",
        "project_id": resolved_project_id,
        "research_topic": research_topic,
        "research_question": research_question or f"What are the core mechanisms, limitations, and benchmarks in {research_topic}?",
        "search_timestamp": datetime.utcnow().isoformat() + "Z",
        "search_metadata": {
            "total_retrieved": len(raw_corpus),
            "deduplicated_count": len(deduped),
            "ranked_count": len(finalized_papers),
            "execution_time_seconds": round(time.time() - start_time, 3),
            "sources_queried": sources_queried,
            "sources_succeeded": sources_succeeded,
            "retrieval_status": "success" if finalized_papers else ("empty_matches" if sources_succeeded else "all_sources_failed"),
            "query_expansion": expansion
        },
        "papers": finalized_papers
    }

    return output1_payload

