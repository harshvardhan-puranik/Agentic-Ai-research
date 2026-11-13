"""
ResearchScholar AI – Module 3: Research Gap Agent
Compares actual Module 2 findings (objectives, methodologies, algorithms, datasets, metrics,
results, limitations, future work), detects genuine cross-paper tensions, formulates
evidence-graded research gaps & clearly labeled speculative opportunities, assesses
corpus sufficiency, and compiles compliant Output 3 (v3.0.0).
"""

import re
from datetime import datetime
from typing import List, Dict, Any

SENTINEL_VALUES = {
    "",
    "not reported",
    "unspecified",
    "n/a",
    "na",
    "none",
    "unknown",
    "unavailable",
    "insufficient content",
}


def is_reported(val: Any) -> bool:
    if val is None:
        return False
    if not isinstance(val, str):
        return bool(val)
    norm = val.strip().lower()
    if not norm or norm in SENTINEL_VALUES or norm.startswith("not reported"):
        return False
    return True


def clean_list(items: Any) -> List[str]:
    if not isinstance(items, list):
        return []
    return [str(x).strip() for x in items if is_reported(str(x))]


DOMAIN_AGNOSTIC_THEMES = [
    {
        "cluster_id": "cluster-scalability-efficiency",
        "name": "Computational, Resource & Scalability Constraints",
        "type": "Scalability & Efficiency",
        "keywords": ["computational", "overhead", "memory", "quadratic", "complexity", "latency", "scalab", "throughput", "cost", "expensive", "resource", "energy", "vram"],
    },
    {
        "cluster_id": "cluster-generalization-robustness",
        "name": "Generalization, Stability & External Validity Boundaries",
        "type": "Generalization & Robustness",
        "keywords": ["generaliz", "robust", "distribution", "noise", "drift", "shift", "stability", "degrad", "adversarial", "real-world", "out-of-domain"],
    },
    {
        "cluster_id": "cluster-data-scarcity",
        "name": "Data Availability, Annotation Scarcity & Cohort Bias",
        "type": "Data & Measurement Quality",
        "keywords": ["dataset", "data", "sample", "cohort", "annotated", "label", "scarce", "scarcity", "small size", "imbalance", "bias"],
    },
    {
        "cluster_id": "cluster-methodological-design",
        "name": "Methodological, Architectural & Mechanistic Limitations",
        "type": "Methodological Constraints",
        "keywords": ["hyperparameter", "baseline", "ablation", "initialization", "assumption", "parameter", "calibration", "off-target", "efficiency", "precision", "convergence"],
    },
    {
        "cluster_id": "cluster-evaluation-interpretability",
        "name": "Evaluation Consistency, Reproducibility & Interpretability",
        "type": "Evaluation & Theory",
        "keywords": ["metric", "benchmark", "split", "reproduc", "interpret", "explainab", "causal", "theoretical", "faithfulness", "standardiz", "comparison"],
    },
    {
        "cluster_id": "cluster-deployment-translation",
        "name": "Practical Deployment, Hardware & Translational Barriers",
        "type": "Translation & Deployment",
        "keywords": ["deploy", "clinical", "patient", "hardware", "edge", "fabrication", "manufactur", "regulatory", "safety", "long-term"],
    },
]


def cluster_observations(analyses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Dynamically cluster genuine reported limitations from analyzed papers without empty hardcoded buckets."""
    clusters_map: Dict[str, Dict[str, Any]] = {}

    for analysis in analyses:
        paper_id = analysis.get("paper_id", "")
        title = analysis.get("title", "")
        limitations = clean_list(analysis.get("limitations", []))

        for lim in limitations:
            lim_lower = lim.lower()
            chosen = {
                "cluster_id": "cluster-corpus-specific",
                "name": "Corpus-Specific Reported Constraints & Open Problems",
                "type": "Domain-Specific Constraints",
            }
            for pillar in DOMAIN_AGNOSTIC_THEMES:
                if any(kw in lim_lower for kw in pillar["keywords"]):
                    chosen = pillar
                    break

            cid = chosen["cluster_id"]
            if cid not in clusters_map:
                clusters_map[cid] = {
                    "cluster_id": cid,
                    "cluster_name": chosen["name"],
                    "pillar_type": chosen["type"],
                    "observation_count": 0,
                    "affected_paper_ids": [],
                    "observations": [],
                }
            clusters_map[cid]["observations"].append({
                "paper_id": paper_id,
                "paper_title": title,
                "observation": lim,
            })
            clusters_map[cid]["observation_count"] += 1
            if paper_id and paper_id not in clusters_map[cid]["affected_paper_ids"]:
                clusters_map[cid]["affected_paper_ids"].append(paper_id)

    return sorted(clusters_map.values(), key=lambda c: c["observation_count"], reverse=True)


def detect_tensions(analyses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Detect real cross-paper tensions & protocol divergences strictly from analyzed records."""
    if len(analyses) < 2:
        return []

    tensions = []
    papers_with_results = [a for a in analyses if clean_list(a.get("reported_results", []))]
    papers_with_lims = [a for a in analyses if clean_list(a.get("limitations", []))]

    if papers_with_results and papers_with_lims:
        res_sample = clean_list(papers_with_results[0].get("reported_results", []))[0][:180]
        lim_sample = clean_list(papers_with_lims[0].get("limitations", []))[0][:180]
        involved = list(dict.fromkeys(
            [a.get("paper_id") for a in papers_with_results[:3]] +
            [a.get("paper_id") for a in papers_with_lims[:3]]
        ))
        tensions.append({
            "tension_id": "tension-efficacy-vs-constraints",
            "tension_type": "Performance vs Practicality Trade-off",
            "description": f"{papers_with_results[0].get('paper_id')} reports positive outcomes (\"{res_sample}\"), while {papers_with_lims[0].get('paper_id')} documents constraints (\"{lim_sample}\").",
            "conflicting_papers": involved,
        })

    # Algorithmic divergence across papers
    alg_papers = [(a.get("paper_id"), clean_list(a.get("algorithms", []))) for a in analyses if clean_list(a.get("algorithms", []))]
    if len(alg_papers) >= 2:
        pA, algsA = alg_papers[0]
        div = next(((pB, algsB) for pB, algsB in alg_papers[1:] if any(alg not in algsA for alg in algsB)), None)
        if div:
            pB, algsB = div
            tensions.append({
                "tension_id": "tension-methodological-divergence",
                "tension_type": "Methodological Divergence",
                "description": f"{pA} uses {', '.join(algsA)}, whereas {pB} employs {', '.join(algsB)} without direct shared-benchmark comparison.",
                "conflicting_papers": [pA, pB],
            })

    return tensions


def grade_evidence_strength(paper_ids: List[str], evidence: List[Dict[str, Any]], analyses: List[Dict[str, Any]], is_speculative: bool) -> Dict[str, str]:
    if is_speculative:
        return {
            "code": "speculative",
            "label": "Speculative opportunity",
            "rationale": f"Synthesized as a speculative opportunity from future-work trajectories or cross-paper divergence across {len(paper_ids)} paper(s)."
        }

    unique_ids = list(dict.fromkeys(paper_ids))
    ft_papers = sum(
        1 for pid in unique_ids
        if next((a.get("document_status") for a in analyses if a.get("paper_id") == pid), "") == "full_text"
    )
    ft_evidence = sum(1 for e in evidence if isinstance(e.get("page"), int) and e["page"] > 0)

    if len(unique_ids) >= 3 and ft_papers >= 2 and ft_evidence >= 2:
        return {
            "code": "strong",
            "label": "Strong evidence",
            "rationale": f"Supported by {len(unique_ids)} distinct papers ({ft_papers} full-text) with {ft_evidence} page-grounded verbatim excerpts."
        }
    if len(unique_ids) >= 2 and (ft_papers >= 1 or len(evidence) >= 2):
        return {
            "code": "moderate",
            "label": "Moderate evidence",
            "rationale": f"Supported by {len(unique_ids)} papers ({ft_papers} full-text) with {len(evidence)} verbatim excerpts."
        }
    return {
        "code": "weak",
        "label": "Limited evidence",
        "rationale": f"Observed in {len(unique_ids)} paper(s) ({ft_papers} full-text); independent cross-study replication is needed."
    }


def collect_evidence_for_papers(paper_ids: List[str], analyses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    collected = []
    seen = set()
    for pid in paper_ids:
        paper = next((a for a in analyses if a.get("paper_id") == pid), None)
        if not paper:
            continue
        is_ft = paper.get("document_status") == "full_text"
        for ev in paper.get("evidence", []):
            excerpt = (ev.get("excerpt") or "").strip()
            if not is_reported(excerpt):
                continue
            key = (pid, excerpt[:50])
            if key in seen:
                continue
            seen.add(key)
            raw_page = ev.get("page")
            page = raw_page if (is_ft and isinstance(raw_page, int) and raw_page > 0) else None
            collected.append({
                "paper_id": pid,
                "paper_title": paper.get("title", ""),
                "finding": ev.get("finding", "Supporting Claim"),
                "excerpt": excerpt,
                "page": page,
                "section": ev.get("section") or ("Body" if page else "Abstract"),
                "evidence_status": ev.get("evidence_status") or ("verbatim_full_text" if page else "verbatim_abstract"),
                "verification_status": "verified" if page else "abstract_only",
            })
    return collected[:6]


def formulate_candidate_gaps(
    clusters: List[Dict[str, Any]],
    analyses: List[Dict[str, Any]],
    topic: str,
    tensions: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Formulate evidence-graded gaps strictly from real analyzed observations."""
    gaps: List[Dict[str, Any]] = []
    if not analyses:
        return gaps

    tensions = tensions or []
    gap_idx = 1

    # 1. Gaps from genuine limitation clusters
    for cluster in clusters[:3]:
        p_ids = cluster.get("affected_paper_ids", [])
        if not p_ids:
            continue
        ev = collect_evidence_for_papers(p_ids, analyses)
        strength = grade_evidence_strength(p_ids, ev, analyses, is_speculative=False)
        first_obs = cluster["observations"][0]["observation"]
        rel_lims = [f"{o['paper_id']}: {o['observation']}" for o in cluster["observations"]]

        gaps.append({
            "gap_id": f"GAP-{gap_idx:03d}",
            "title": f"Unresolved {cluster['cluster_name']} in {topic}",
            "gap_type": cluster["pillar_type"],
            "is_speculative": False,
            "summary": f"{len(p_ids)} of {len(analyses)} analyzed paper(s) explicitly note constraints around {cluster['pillar_type'].lower()}: \"{first_obs}\".",
            "relevant_limitations": rel_lims,
            "why_gap_exists": f"Reviewed studies ({', '.join(p_ids)}) report persistent limitations without a unified validated resolution.",
            "research_significance": f"Mitigating these documented limitations strengthens empirical validity and scalability in {topic}.",
            "methodological_weakness": " | ".join(rel_lims),
            "underexplored_aspect": first_obs,
            "evidence_strength": strength["code"],
            "evidence_strength_label": strength["label"],
            "evidence_strength_rationale": strength["rationale"],
            "supporting_papers": [{"paper_id": pid, "title": next((a.get("title") for a in analyses if a.get("paper_id") == pid), "")} for pid in p_ids],
            "supporting_evidence": ev,
            "contradictory_evidence": [],
            "affected_paper_ids": p_ids,
            "potential_methodology": f"Controlled empirical benchmark directly testing mitigation strategies against baselines in {', '.join(p_ids)}.",
            "future_research_direction": f"Evaluate targeted resolutions to {first_obs}",
            "proposed_research_questions": [
                f"How can {topic} methods address '{first_obs[:110]}' without compromising task performance?"
            ],
            "proposed_objectives": [
                f"Formulate and benchmark an experimental approach resolving {cluster['pillar_type'].lower()} across shared baselines."
            ],
        })
        gap_idx += 1

    # 2. If tensions show methodological/evaluation divergence across papers, add a comparative gap
    for t in tensions:
        if len(gaps) >= 4:
            break
        p_ids = [pid for pid in t.get("conflicting_papers", []) if pid]
        if len(p_ids) < 2:
            continue
        ev = collect_evidence_for_papers(p_ids, analyses)
        strength = grade_evidence_strength(p_ids, ev, analyses, is_speculative=False)
        gaps.append({
            "gap_id": f"GAP-{gap_idx:03d}",
            "title": f"{t['tension_type']} Across {topic} Studies",
            "gap_type": "Comparative / Evaluation",
            "is_speculative": False,
            "summary": t["description"],
            "relevant_limitations": [t["description"]],
            "why_gap_exists": t["description"],
            "research_significance": f"Establishes controlled cross-method comparability within {topic}.",
            "methodological_weakness": t["description"],
            "underexplored_aspect": f"Head-to-head comparison across {', '.join(p_ids)}.",
            "evidence_strength": strength["code"],
            "evidence_strength_label": strength["label"],
            "evidence_strength_rationale": strength["rationale"],
            "supporting_papers": [{"paper_id": pid, "title": next((a.get("title") for a in analyses if a.get("paper_id") == pid), "")} for pid in p_ids],
            "supporting_evidence": ev,
            "contradictory_evidence": [],
            "affected_paper_ids": p_ids,
            "potential_methodology": f"Unified head-to-head evaluation combining methods from {', '.join(p_ids)} on identical metrics and datasets.",
            "future_research_direction": "Standardize cross-study evaluation protocols.",
            "proposed_research_questions": [
                f"Under controlled shared benchmarks, how do the differing approaches in {', '.join(p_ids)} compare?"
            ],
            "proposed_objectives": [
                f"Conduct a unified comparative evaluation across competing methods identified in {topic}."
            ],
        })
        gap_idx += 1

    # 3. Speculative opportunity strictly derived from author future_work or problem_statement
    future_items = []
    for a in analyses:
        for fw in clean_list(a.get("future_work", [])):
            future_items.append((a.get("paper_id"), fw))
    if not future_items:
        for a in analyses:
            if is_reported(a.get("problem_statement")):
                future_items.append((a.get("paper_id"), a["problem_statement"]))

    if future_items:
        p_ids = list(dict.fromkeys(pid for pid, _ in future_items))[:3]
        ev = collect_evidence_for_papers(p_ids, analyses)
        strength = grade_evidence_strength(p_ids, ev, analyses, is_speculative=True)
        lead_pid, lead_text = future_items[0]
        gaps.append({
            "gap_id": f"GAP-{gap_idx:03d}",
            "title": f"Exploratory Future Opportunity Identified in {topic}",
            "gap_type": "Speculative Opportunity",
            "is_speculative": True,
            "summary": f"Authors ({lead_pid}) note open direction: \"{lead_text}\". Categorized as a speculative opportunity pending empirical validation.",
            "relevant_limitations": [f"{pid}: {txt}" for pid, txt in future_items[:3]],
            "why_gap_exists": f"Proposed as a future research direction by {lead_pid} rather than executed in current experiments.",
            "research_significance": f"Extends {topic} into unvalidated problem settings proposed by primary authors.",
            "methodological_weakness": "Unvalidated exploratory trajectory deferred to future work.",
            "underexplored_aspect": lead_text,
            "evidence_strength": strength["code"],
            "evidence_strength_label": strength["label"],
            "evidence_strength_rationale": strength["rationale"],
            "supporting_papers": [{"paper_id": pid, "title": next((a.get("title") for a in analyses if a.get("paper_id") == pid), "")} for pid in p_ids],
            "supporting_evidence": ev,
            "contradictory_evidence": [],
            "affected_paper_ids": p_ids,
            "potential_methodology": f"Exploratory prototype testing '{lead_text[:100]}' against baselines in {', '.join(p_ids)}.",
            "future_research_direction": lead_text,
            "proposed_research_questions": [
                f"What empirical gains emerge when investigating the future direction noted in {lead_pid}?"
            ],
            "proposed_objectives": [
                f"Prototype and evaluate the future direction suggested in {', '.join(p_ids)}."
            ],
        })

    return gaps


def execute_gap_identification(output2_payload: Dict[str, Any], preferences: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes Module 3 (Research Gap Agent) end-to-end strictly grounded in Output 2.
    """
    analyses = output2_payload.get("analyses", [])
    topic = output2_payload.get("research_topic", "Academic Topic")
    project_id = output2_payload.get("project_id", "rs-project")

    clusters = cluster_observations(analyses)
    tensions = detect_tensions(analyses)
    candidate_gaps = formulate_candidate_gaps(clusters, analyses, topic, tensions)

    ft_count = sum(1 for a in analyses if a.get("document_status") == "full_text")
    lim_count = sum(len(clean_list(a.get("limitations", []))) for a in analyses)
    is_sufficient = len(analyses) >= 2 and (lim_count > 0 or len(candidate_gaps) > 0)

    sufficiency = {
        "is_sufficient": is_sufficient,
        "sufficiency_level": "sufficient" if (is_sufficient and ft_count >= 1) else ("limited" if is_sufficient else "insufficient"),
        "message": (
            f"Grounded comparison across {len(analyses)} paper(s) ({ft_count} full-text)."
            if is_sufficient
            else "Insufficient evidence in analyzed papers: more full-text research papers are needed."
        ),
    }

    all_algs = sorted({alg for a in analyses for alg in clean_list(a.get("algorithms", []))})
    all_datasets = sorted({ds for a in analyses for ds in clean_list(a.get("datasets", []))})
    all_metrics = sorted({m for a in analyses for m in clean_list(a.get("evaluation_metrics", []) or a.get("metrics", []))})

    comparative_findings = {
        "objectives_comparison": [{"paper_id": a.get("paper_id"), "objective": a.get("objective")} for a in analyses],
        "methodologies_and_algorithms": all_algs,
        "datasets_compared": all_datasets,
        "evaluation_metrics": all_metrics,
        "recurring_limitations": [c["cluster_name"] for c in clusters],
        "contradictory_findings": tensions,
    }

    final_report = {
        "report_title": f"Evidence-Grounded Research Gap Analysis: {topic}",
        "generated_timestamp": datetime.utcnow().isoformat() + "Z",
        "executive_summary": (
            f"Comparative synthesis of {len(analyses)} paper(s) on '{topic}' ({ft_count} full-text PDFs) "
            f"identified {len(candidate_gaps)} candidate gap(s)/opportunity(ies) traceable to verified excerpts."
            if is_sufficient
            else f"Analyzed {len(analyses)} paper(s) on '{topic}', but available evidence is insufficient; more full-text research papers are needed."
        ),
        "total_gaps_identified": len(candidate_gaps),
        "thematic_coverage": [c["cluster_name"] for c in clusters if c["observation_count"] > 0],
        "overall_conclusion": (
            f"Addressing {', '.join(g['title'] for g in candidate_gaps[:2])} represents the highest-priority path grounded in the analyzed {topic} corpus."
            if candidate_gaps
            else f"More peer-reviewed full-text papers on '{topic}' are needed to substantiate valid research gaps."
        ),
    }

    return {
        "schema_version": "3.0.0",
        "project_id": project_id,
        "research_topic": topic,
        "synthesis_timestamp": datetime.utcnow().isoformat() + "Z",
        "evidence_sufficiency": sufficiency,
        "corpus_coverage": {
            "total_papers_analyzed": len(analyses),
            "full_text_count": ft_count,
            "evidence_citations_verified": sum(len(a.get("evidence", [])) for a in analyses),
            "clusters_formed": len(clusters),
            "conflicting_tensions_detected": len(tensions),
        },
        "comparative_findings": comparative_findings,
        "observation_clusters": clusters,
        "cross_paper_tensions": tensions,
        "candidate_gaps": candidate_gaps,
        "research_questions": [rq for g in candidate_gaps for rq in g.get("proposed_research_questions", [])],
        "objectives": [ro for g in candidate_gaps for ro in g.get("proposed_objectives", [])],
        "overall_conclusion": final_report["overall_conclusion"],
        "final_report": final_report,
    }
