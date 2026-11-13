"""
ResearchScholar AI – Type Definitions & Data Contracts
Strict schemas for Module 1 (Discovery), Module 2 (Analysis), and Module 3 (Gap Identification).
"""

from typing import TypedDict, List, Dict, Any, Optional, Literal, Annotated
import operator

# ============================================================================
# Core Graph State for LangGraph Master Orchestrator
# ============================================================================

class ResearchGraphState(TypedDict):
    """
    Unified state passed across all nodes in the LangGraph StateGraph.
    Enables automatic, lossless handoff between:
    START -> discovery_node -> analysis_node -> gap_identification_node -> END
    """
    # Context
    project_id: str
    research_topic: str
    research_question: Optional[str]
    scholar_profile: Dict[str, Any]
    
    # Input preferences
    discovery_preferences: Dict[str, Any]
    analysis_preferences: Dict[str, Any]
    gap_preferences: Dict[str, Any]
    
    # Module 1 (Discovery Agent) Outputs
    expanded_queries: List[str]
    discovered_papers: List[Dict[str, Any]]
    output1_payload: Optional[Dict[str, Any]]
    discovery_status: str  # 'idle' | 'running' | 'completed' | 'failed'
    
    # Module 2 (Analysis Agent) Outputs
    paper_analyses: List[Dict[str, Any]]
    cross_paper_synthesis: Optional[Dict[str, Any]]
    output2_payload: Optional[Dict[str, Any]]
    analysis_status: str   # 'idle' | 'running' | 'completed' | 'failed'
    
    # Module 3 (Research Gap Agent) Outputs
    normalized_observations: Dict[str, Any]
    observation_clusters: List[Dict[str, Any]]
    identified_tensions: List[Dict[str, Any]]
    candidate_gaps: List[Dict[str, Any]]
    final_report: Optional[Dict[str, Any]]
    output3_payload: Optional[Dict[str, Any]]
    gap_status: str        # 'idle' | 'running' | 'completed' | 'failed'
    
    # Orchestrator Lifecycle & Diagnostics
    current_node: str
    pipeline_status: str   # 'pending' | 'in_progress' | 'completed' | 'halted'
    execution_trace: List[Dict[str, Any]]
    errors: List[str]


# ============================================================================
# Output 1 Schema Contract (v1.0.0)
# ============================================================================

class PaperRecord(TypedDict):
    paper_id: str
    title: str
    authors: List[str]
    year: int
    doi: str
    abstract: str
    source_url: str
    source_database: str
    citation_count: int
    open_access: bool
    relevance_score: float
    relevance_explanation: str
    document_status: str  # 'abstract_only' | 'full_text' | 'partial'


class Output1Payload(TypedDict):
    schema_version: str  # "1.0.0"
    project_id: str
    research_topic: str
    research_question: str
    search_timestamp: str
    search_metadata: Dict[str, Any]
    papers: List[PaperRecord]


# ============================================================================
# Output 2 Schema Contract (v2.0.0)
# ============================================================================

class EvidenceItem(TypedDict):
    paper_id: str
    finding: str
    page: Optional[int]
    section: str
    excerpt: str
    evidence_status: str
    verification_status: str  # 'verified' | 'abstract_only' | 'unverified'


class PaperAnalysisRecord(TypedDict):
    paper_id: str
    title: str
    authors: List[str]
    year: int
    doi: str
    source_url: str
    document_status: str
    analysis_status: str
    objective: str
    problem_statement: str
    methodology: str
    algorithms: List[str]
    datasets: List[str]
    evaluation_metrics: List[str]
    reported_results: List[str]
    limitations: List[str]
    future_work: List[str]
    evidence: List[EvidenceItem]
    missing_fields: List[str]


class Output2Payload(TypedDict):
    schema_version: str  # "2.0.0"
    project_id: str
    research_topic: str
    analysis_timestamp: str
    corpus_summary: Dict[str, Any]
    analyses: List[PaperAnalysisRecord]
    cross_paper_synthesis: Dict[str, Any]


# ============================================================================
# Output 3 Schema Contract (v3.0.0)
# ============================================================================

class CandidateGap(TypedDict):
    gap_id: str
    title: str
    gap_type: str  # 'Methodological' | 'Empirical' | 'Hardware/Edge' | 'Theoretical'
    summary: str
    methodological_weakness: str
    underexplored_aspect: str
    evidence_strength: str  # 'strong' | 'moderate' | 'weak'
    supporting_evidence: List[Dict[str, Any]]
    contradictory_evidence: List[Dict[str, Any]]
    affected_paper_ids: List[str]
    proposed_research_questions: List[str]
    proposed_objectives: List[str]


class Output3Payload(TypedDict):
    schema_version: str  # "3.0.0"
    project_id: str
    research_topic: str
    synthesis_timestamp: str
    evidence_sufficiency: Dict[str, Any]
    corpus_coverage: Dict[str, Any]
    comparative_findings: Dict[str, Any]
    observation_clusters: List[Dict[str, Any]]
    cross_paper_tensions: List[Dict[str, Any]]
    candidate_gaps: List[CandidateGap]
    research_questions: List[str]
    objectives: List[str]
    overall_conclusion: str
    final_report: Dict[str, Any]
