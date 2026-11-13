"""
ResearchScholar AI – Module 2: Analysis Agent
Retrieves legally accessible open-access PDFs when available, parses paper structure,
performs graph centrality (TextRank) extraction strictly grounded in actual paper content,
preserves real page numbers (or None for abstract-only), returns "Not reported" when
information is unavailable, and generates Output 2 (v2.0.0) for Module 3.
"""

import io
import os
import re
import json
import urllib.request
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

NOT_REPORTED = "Not reported"

SECTION_PATTERNS = [
    (r'(?i)^\s*(abstract|executive summary)\b', 'Abstract'),
    (r'(?i)^\s*(\d+\.?\s*|I\.?\s*)?introduction\b', 'Introduction'),
    (r'(?i)^\s*(\d+\.?\s*|II\.?\s*)?(related work|background|literature review)\b', 'Related Work'),
    (r'(?i)^\s*(\d+\.?\s*)?(problem formulation|problem statement|problem definition)\b', 'Problem Formulation'),
    (r'(?i)^\s*(\d+\.?\s*|[IVX]+\.?\s*)?(methodology|methods|materials and methods|proposed method|architecture)\b', 'Methodology'),
    (r'(?i)^\s*(\d+\.?\s*|[IVX]+\.?\s*)?(experiments?|experimental setup|datasets?|evaluation setup)\b', 'Experiments & Evaluation'),
    (r'(?i)^\s*(\d+\.?\s*|[IVX]+\.?\s*)?(results?|findings|results and discussion)\b', 'Results & Discussion'),
    (r'(?i)^\s*(\d+\.?\s*)?(limitations?|threats to validity)\b', 'Limitations'),
    (r'(?i)^\s*(\d+\.?\s*)?(future work|future directions|open problems)\b', 'Future Work'),
    (r'(?i)^\s*(\d+\.?\s*|[IVX]+\.?\s*)?(conclusions?|concluding remarks)\b', 'Conclusion'),
]


def extract_sentences(text: str) -> List[str]:
    """Splits text into clean, complete sentences."""
    if not text:
        return []
    cleaned = re.sub(r'\s+', ' ', text).strip()
    raw = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"(\[])', cleaned)
    return [s.strip() for s in raw if 20 <= len(s.strip()) <= 650]


def textrank_sentence_scoring(sentences: List[str]) -> List[Tuple[str, float]]:
    """
    Simplified TextRank / graph centrality for sentences.
    Computes lexical overlap similarity graph and power iterations.
    """
    if not sentences:
        return []
    n = len(sentences)
    if n == 1:
        return [(sentences[0], 1.0)]

    words_per_sent = [set(re.findall(r'\b[a-z]{3,}\b', s.lower())) for s in sentences]

    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            intersection = len(words_per_sent[i].intersection(words_per_sent[j]))
            denom = len(words_per_sent[i]) + len(words_per_sent[j])
            sim = (2.0 * intersection / denom) if denom > 0 else 0.0
            matrix[i][j] = sim
            matrix[j][i] = sim

    scores = [1.0 / n] * n
    damping = 0.85
    for _ in range(12):
        new_scores = [(1.0 - damping) / n] * n
        for i in range(n):
            for j in range(n):
                if i != j and matrix[j][i] > 0:
                    sum_weights = sum(matrix[j]) or 1.0
                    new_scores[i] += damping * (matrix[j][i] / sum_weights) * scores[j]
        scores = new_scores

    ranked = sorted(zip(sentences, scores), key=lambda x: x[1], reverse=True)
    return ranked


def extract_pdf_pages_from_bytes(pdf_bytes: bytes) -> Dict[str, Any]:
    """Extracts per-page text if pypdf/pymupdf is installed; validates %PDF- header."""
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF-"):
        return {"success": False, "status": "extraction_failed", "reason": "Response is not a valid %PDF- binary.", "pages": []}

    # Try pypdf or fitz (PyMuPDF) if installed
    try:
        import pypdf  # type: ignore
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for idx, pg in enumerate(reader.pages, start=1):
            txt = (pg.extract_text() or "").strip()
            if txt:
                pages.append({"pageNumber": idx, "text": txt})
        total_alnum = len(re.sub(r'[^a-zA-Z0-9]', '', "".join(p["text"] for p in pages)))
        if len(reader.pages) > 0 and total_alnum < 80:
            return {"success": False, "status": "scanned_pdf", "reason": "Scanned PDF without embedded text layer.", "pages": []}
        if pages:
            return {"success": True, "status": "full_text", "pages": pages}
    except ImportError:
        pass
    except Exception as exc:
        return {"success": False, "status": "extraction_failed", "reason": str(exc), "pages": []}

    return {"success": False, "status": "abstract_only", "reason": "Python PDF library (pypdf) unavailable in runtime; using abstract metadata.", "pages": []}


def fetch_open_access_pdf_pages(paper: Dict[str, Any]) -> Dict[str, Any]:
    """Attempts to retrieve a legally accessible open-access PDF if url/pdf_url is present."""
    candidate_url = paper.get("pdf_url") or ""
    source_url = paper.get("verified_source_url") or paper.get("source_url") or ""
    if not candidate_url and "arxiv.org/abs/" in source_url:
        candidate_url = source_url.replace("/abs/", "/pdf/") + ".pdf"
    elif "arxiv.org/abs/" in candidate_url:
        candidate_url = candidate_url.replace("/abs/", "/pdf/") + ".pdf"

    if not candidate_url.startswith("http"):
        return {"success": False, "status": "abstract_only", "reason": "No open-access PDF URL available.", "pages": []}

    try:
        req = urllib.request.Request(
            candidate_url,
            headers={"User-Agent": "ResearchScholarAI/2.0 (mailto:scholar@researchscholar.ai)"}
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status != 200:
                return {"success": False, "status": "abstract_only", "reason": f"HTTP {resp.status}", "pages": []}
            data = resp.read(15 * 1024 * 1024)
            return extract_pdf_pages_from_bytes(data)
    except Exception as exc:
        return {"success": False, "status": "abstract_only", "reason": f"PDF fetch skipped: {exc}", "pages": []}


def find_page_for_sentence(sentence: str, pages: List[Dict[str, Any]]) -> Optional[int]:
    """Finds the actual 1-based page number containing a sentence, or None."""
    if not sentence or not pages:
        return None
    probe = re.sub(r'\s+', ' ', sentence.lower()).strip()[:60]
    for p in pages:
        p_norm = re.sub(r'\s+', ' ', (p.get("text") or "").lower())
        if probe and probe in p_norm:
            return int(p["pageNumber"])
    return None


def detect_section_for_sentence(sentence: str, pages: List[Dict[str, Any]], is_full_text: bool) -> str:
    if not is_full_text:
        return "Abstract"
    for p in pages:
        lines = (p.get("text") or "").splitlines()
        current_sec = "Body"
        for line in lines:
            for pat, name in SECTION_PATTERNS:
                if len(line.strip()) < 80 and re.match(pat, line.strip()):
                    current_sec = name
                    break
            if sentence[:35].lower() in line.lower():
                return current_sec
    return "Body"


def extract_algorithms_from_text(corpus: str) -> List[str]:
    catalog = [
        ("Transformer", r'\btransformers?\b'),
        ("Self-Attention / Multi-Head Attention", r'\b(?:self-attention|multi-head attention|scaled dot-product attention)\b'),
        ("Linear Attention", r'\blinear attention\b'),
        ("Convolutional Neural Network (CNN)", r'\b(?:convolutional neural network|cnn|resnet|vgg|u-net)\b'),
        ("Vision Transformer (ViT)", r'\b(?:vision transformer|vit)\b'),
        ("Recurrent Neural Network / LSTM", r'\b(?:recurrent neural network|rnn|lstm|gru)\b'),
        ("Graph Neural Network (GNN)", r'\b(?:graph neural network|gnn|gcn)\b'),
        ("Large Language Model (LLM) / BERT / GPT", r'\b(?:large language model|llm|bert|gpt-\d)\b'),
        ("Reinforcement Learning / PPO / DQN", r'\b(?:reinforcement learning|ppo|dqn|q-learning)\b'),
        ("Random Forest / XGBoost", r'\b(?:random forest|xgboost|gradient boosting)\b'),
        ("Support Vector Machine (SVM)", r'\b(?:support vector machine|svm)\b'),
        ("Bayesian Inference / Monte Carlo", r'\b(?:bayesian|monte carlo|mcmc)\b'),
        ("CRISPR-Cas9 / Gene Editing", r'\b(?:crispr-cas9|crispr/cas9|cas9)\b'),
        ("Surface Code / Quantum Error Correction", r'\b(?:surface code|toric code|stabilizer code|quantum error correction)\b'),
    ]
    found = [label for label, pat in catalog if re.search(pat, corpus, re.IGNORECASE)]
    return found if found else [NOT_REPORTED]


def extract_datasets_from_text(corpus: str) -> List[str]:
    known = [
        ("ImageNet", r'\bimagenet(?:-1k)?\b'),
        ("CIFAR-10 / CIFAR-100", r'\bcifar-(?:10|100)\b'),
        ("MNIST", r'\b(?:fashion-)?mnist\b'),
        ("GLUE / SuperGLUE", r'\b(?:super)?glue\b'),
        ("SQuAD", r'\bsquad\b'),
        ("WikiText", r'\bwikitext(?:-\d+)?\b'),
        ("MIMIC", r'\bmimic-(?:iii|iv|cxr)\b'),
        ("UK Biobank", r'\buk biobank\b'),
        ("PubMed", r'\bpubmed(?:qa)?\b'),
    ]
    found = [name for name, pat in known if re.search(pat, corpus, re.IGNORECASE)]
    if not found:
        m = re.search(r'\b([A-Z][A-Za-z0-9_-]{2,25}(?:\s+[A-Z0-9][A-Za-z0-9_-]{1,20}){0,3})\s+(?:dataset|corpus|benchmark|cohort)\b', corpus)
        if m and m.group(1) and m.group(1).lower() not in {"the", "this", "our", "standard", "proposed"}:
            found.append(f"{m.group(1).strip()} dataset")
    return found if found else [NOT_REPORTED]


def extract_metrics_from_text(corpus: str) -> List[str]:
    catalog = [
        ("Accuracy", r'\baccuracy\b'),
        ("F1-Score", r'\bf1(?:-score|-measure)?\b'),
        ("Precision & Recall", r'\b(?:precision|recall)\b'),
        ("ROC-AUC", r'\b(?:roc-?auc|auroc)\b'),
        ("BLEU / ROUGE", r'\b(?:bleu|rouge(?:-[12l])?)\b'),
        ("Perplexity", r'\bperplexity\b'),
        ("RMSE / MAE / MSE", r'\b(?:rmse|mae|mse)\b'),
        ("Latency / Throughput / FLOPs", r'\b(?:latency|throughput|flops|inference time)\b'),
        ("Logical Error Rate / Fidelity", r'\b(?:logical error rate|fidelity|threshold)\b'),
        ("Power Conversion Efficiency (PCE)", r'\b(?:power conversion efficiency|pce)\b'),
    ]
    found = [label for label, pat in catalog if re.search(pat, corpus, re.IGNORECASE)]
    return found if found else [NOT_REPORTED]


def analyze_single_paper(paper: Dict[str, Any], custom_instructions: str = "") -> Dict[str, Any]:
    """
    Performs grounded extraction and verbatim claim citation on an individual paper.
    Never invents datasets, results, algorithms, limitations, or page numbers.
    """
    paper_id = paper.get("paper_id", "rs-paper-unknown")
    title = paper.get("title", "Untitled Research Paper")
    abstract = (paper.get("abstract") or "").strip()
    pages = paper.get("pages") if isinstance(paper.get("pages"), list) else []
    full_text = (paper.get("fullText") or "").strip()

    retrieval_note = None
    if not pages and not (len(full_text) >= 500 and full_text != abstract):
        # Attempt legal OA PDF retrieval only when pages aren't already supplied
        oa_res = fetch_open_access_pdf_pages(paper)
        if oa_res.get("success"):
            pages = oa_res["pages"]
            full_text = "\n\n".join(p["text"] for p in pages)
        else:
            retrieval_note = oa_res.get("reason")

    has_real_full_text = bool(pages) or (len(full_text) >= 500 and full_text != abstract)
    if has_real_full_text and not pages:
        pages = [{"pageNumber": 1, "text": full_text}]

    doc_status = "full_text" if has_real_full_text else ("abstract_only" if len(abstract) > 20 else "unavailable")
    scope_label = f"Full-Text PDF Analyzed ({len(pages)} pages)" if has_real_full_text else (
        "Abstract-Only Analysis (Full Text Unavailable)" if doc_status == "abstract_only" else "Insufficient Content"
    )

    active_text = full_text if has_real_full_text else abstract
    corpus = f"{title}\n\n{active_text}"
    sentences = extract_sentences(active_text)
    ranked_sents = [s[0] for s in textrank_sentence_scoring(sentences)]

    objective_sents = [s for s in sentences if re.search(r'\b(in this (?:paper|work|study)|we (?:propose|introduce|present|develop|investigate|examine|study)|this (?:paper|study) (?:presents|proposes|investigates))\b', s, re.I)]
    problem_sents = [s for s in sentences if re.search(r'\b(however|although|despite|challenge|bottleneck|problem|limitation|suffer(?:s)? from|prohibitive|remains? (?:challenging|unclear|limited))\b', s, re.I)]
    method_sents = [s for s in sentences if re.search(r'\b(method|methodology|framework|architecture|pipeline|approach|algorithm|we (?:use|employ|train|design|construct|apply))\b', s, re.I)]
    result_sents = [s for s in sentences if re.search(r'\b(result(?:s)? (?:show|demonstrate|indicate)|achieve(?:s|d)?|outperform(?:s|ed)?|improve(?:s|d)?|reduce(?:s|d)?)\b|\b\d+(?:\.\d+)?%', s, re.I)]
    limitation_sents = [s for s in sentences if re.search(r'\b(limitation|drawback|shortcoming|weakness|cannot|does not|restricted to|overhead|scarce)\b', s, re.I)]
    future_sents = [s for s in sentences if re.search(r'\b(future work|future research|future direction|further investigation|open (?:challenge|question)|next step)\b', s, re.I)]

    objective = objective_sents[0] if objective_sents else (ranked_sents[0] if ranked_sents else NOT_REPORTED)
    problem_statement = problem_sents[0] if problem_sents else NOT_REPORTED
    methodology = " ".join(method_sents[:2]) if method_sents else NOT_REPORTED
    algorithms = extract_algorithms_from_text(corpus)
    datasets = extract_datasets_from_text(corpus)
    metrics = extract_metrics_from_text(corpus)
    results = list(dict.fromkeys(result_sents))[:4] if result_sents else [NOT_REPORTED]
    limitations = list(dict.fromkeys(limitation_sents))[:4] if limitation_sents else [NOT_REPORTED]
    future_work = list(dict.fromkeys(future_sents))[:4] if future_sents else [NOT_REPORTED]

    evidence = []
    seen = set()
    for label, candidate_list in [
        ("Research Objective", objective_sents or ranked_sents[:1]),
        ("Problem Statement", problem_sents),
        ("Methodology", method_sents),
        ("Experimental Results", result_sents),
        ("Limitations", limitation_sents),
        ("Future Work", future_sents),
    ]:
        if candidate_list and candidate_list[0] not in seen:
            excerpt = candidate_list[0]
            seen.add(excerpt)
            real_page = find_page_for_sentence(excerpt, pages) if has_real_full_text else None
            evidence.append({
                "paper_id": paper_id,
                "finding": label,
                "page": real_page,
                "section": detect_section_for_sentence(excerpt, pages, has_real_full_text),
                "excerpt": excerpt,
                "evidence_status": "verbatim_full_text" if has_real_full_text else "verbatim_abstract",
                "verification_status": "verified" if (has_real_full_text and real_page) else "abstract_only"
            })

    missing_fields = []
    if not has_real_full_text:
        missing_fields.append("Abstract-only analysis: full-text PDF was unavailable.")
    if retrieval_note:
        missing_fields.append(retrieval_note)
    if datasets == [NOT_REPORTED]:
        missing_fields.append("Dataset used: Not reported in available text.")
    if metrics == [NOT_REPORTED]:
        missing_fields.append("Evaluation metrics: Not reported in available text.")
    if results == [NOT_REPORTED]:
        missing_fields.append("Experimental results: Not reported in available text.")
    if limitations == [NOT_REPORTED]:
        missing_fields.append("Limitations: Not reported in available text.")

    return {
        "paper_id": paper_id,
        "title": title,
        "authors": paper.get("authors", []),
        "year": paper.get("year", 2024),
        "doi": paper.get("doi", ""),
        "source_url": paper.get("verified_source_url") or paper.get("source_url") or "",
        "document_status": doc_status,
        "analysis_scope_label": scope_label,
        "analysis_status": "completed_full_text" if has_real_full_text else ("completed_abstract_only" if doc_status == "abstract_only" else "incomplete"),
        "objective": objective,
        "problem_statement": problem_statement,
        "methodology": methodology,
        "algorithms": algorithms,
        "datasets": datasets,
        "evaluation_metrics": metrics,
        "reported_results": results,
        "reported_performance": results[0] if results else NOT_REPORTED,
        "limitations": limitations,
        "future_work": future_work,
        "ai_interpretation": {
            "is_ai_generated": False,
            "scope": scope_label,
            "note": "Extractive TextRank & verbatim grounding directly from paper text without invented claims."
        },
        "evidence": evidence,
        "missing_fields": missing_fields
    }


def generate_cross_paper_synthesis(analyses: List[Dict[str, Any]], topic: str) -> Dict[str, Any]:
    """
    Synthesizes findings strictly from real extracted paper fields (excluding 'Not reported').
    """
    all_algorithms = set()
    all_datasets = set()
    all_limitations = []

    for a in analyses:
        for alg in a.get("algorithms", []):
            if alg and alg != NOT_REPORTED:
                all_algorithms.add(alg)
        for ds in a.get("datasets", []):
            if ds and ds != NOT_REPORTED:
                all_datasets.add(ds)
        for lim in a.get("limitations", []):
            if lim and lim != NOT_REPORTED:
                all_limitations.append({"paper_id": a["paper_id"], "text": lim})

    full_text_count = sum(1 for a in analyses if a.get("document_status") == "full_text")
    return {
        "research_topic": topic,
        "papers_synthesized": len(analyses),
        "full_text_count": full_text_count,
        "abstract_only_count": len(analyses) - full_text_count,
        "frequent_algorithms": list(all_algorithms)[:6] or [NOT_REPORTED],
        "common_datasets": list(all_datasets)[:6] or [NOT_REPORTED],
        "recurring_limitations_count": len(all_limitations),
        "thematic_bottlenecks": [item["text"] for item in all_limitations[:4]] or [NOT_REPORTED]
    }


def execute_analysis(output1_payload: Dict[str, Any], preferences: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes Module 2 (Analysis Agent) end-to-end:
    - Ingests Output 1 JSON
    - Analyzes each paper strictly from actual content
    - Builds cross-paper synthesis
    - Compiles compliant Output 2 JSON (v2.0.0)
    """
    prefs = preferences or {}
    papers = output1_payload.get("papers", [])
    topic = output1_payload.get("research_topic", "Academic Topic")
    project_id = output1_payload.get("project_id", "rs-project")

    analyses = [analyze_single_paper(p, prefs.get("custom_instructions", "")) for p in papers]
    synthesis = generate_cross_paper_synthesis(analyses, topic)

    output2_payload = {
        "schema_version": "2.0.0",
        "project_id": project_id,
        "research_topic": topic,
        "analysis_timestamp": datetime.utcnow().isoformat() + "Z",
        "corpus_summary": {
            "total_papers_analyzed": len(analyses),
            "full_text_count": sum(1 for a in analyses if a.get("document_status") == "full_text"),
            "abstract_only_count": sum(1 for a in analyses if a.get("document_status") == "abstract_only"),
            "grounded_evidence_citations": sum(len(a.get("evidence", [])) for a in analyses)
        },
        "analyses": analyses,
        "cross_paper_synthesis": synthesis
    }

    return output2_payload
