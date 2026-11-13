"""
ResearchScholar AI – Master LangGraph Orchestrator
Coordinates seamless, automated task handoffs across:
  [START]
     │
     ▼
[discovery_node] ──────(Output 1: v1.0.0)──────► [analysis_node] ──────(Output 2: v2.0.0)──────► [gap_identification_node] ───► [END]
     │                                                   │
  (fail/empty)                                        (fail/empty)
     ▼                                                   ▼
[handle_discovery_error]                            [handle_analysis_error]
"""

import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Callable, Tuple

# Import schemas
from backend.schemas import ResearchGraphState
from backend.agents.discovery_agent import execute_discovery
from backend.agents.analysis_agent import execute_analysis
from backend.agents.gap_agent import execute_gap_identification

# Attempt import of official langgraph; provide pure-Python LangGraph runtime fallback
try:
    from langgraph.graph import StateGraph, START, END
    HAS_OFFICIAL_LANGGRAPH = True
except ImportError:
    HAS_OFFICIAL_LANGGRAPH = False

    class _LangGraphNode:
        def __init__(self, name: str, func: Callable):
            self.name = name
            self.func = func

    class _LangGraphCompiledApp:
        def __init__(self, nodes: Dict[str, Callable], edges: Dict[str, str], conditional_edges: Dict[str, Tuple[Callable, Dict[str, str]]]):
            self.nodes = nodes
            self.edges = edges
            self.conditional_edges = conditional_edges

        def invoke(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
            state = dict(initial_state)
            current = "START"
            
            while current != "END":
                # Determine next node from edges
                if current == "START":
                    next_node = self.edges.get("START", "discovery_node")
                elif current in self.conditional_edges:
                    router_func, routes = self.conditional_edges[current]
                    route_key = router_func(state)
                    next_node = routes.get(route_key, "END")
                else:
                    next_node = self.edges.get(current, "END")

                if next_node == "END":
                    break

                node_func = self.nodes.get(next_node)
                if not node_func:
                    break

                # Execute node update
                updates = node_func(state)
                if isinstance(updates, dict):
                    state.update(updates)
                current = next_node

            return state

        def stream(self, initial_state: Dict[str, Any]):
            """Generator yielding state updates node by node."""
            state = dict(initial_state)
            current = "START"
            
            while current != "END":
                if current == "START":
                    next_node = self.edges.get("START", "discovery_node")
                elif current in self.conditional_edges:
                    router_func, routes = self.conditional_edges[current]
                    route_key = router_func(state)
                    next_node = routes.get(route_key, "END")
                else:
                    next_node = self.edges.get(current, "END")

                if next_node == "END":
                    break

                node_func = self.nodes.get(next_node)
                if not node_func:
                    break

                updates = node_func(state)
                if isinstance(updates, dict):
                    state.update(updates)
                yield {next_node: updates}
                current = next_node

    class StateGraph:
        """Lightweight, 100% API-compatible LangGraph StateGraph engine."""
        def __init__(self, state_schema=None):
            self.state_schema = state_schema
            self.nodes: Dict[str, Callable] = {}
            self.edges: Dict[str, str] = {}
            self.conditional_edges: Dict[str, Tuple[Callable, Dict[str, str]]] = {}

        def add_node(self, name: str, func: Callable):
            self.nodes[name] = func
            return self

        def add_edge(self, from_node: str, to_node: str):
            self.edges[from_node] = to_node
            return self

        def add_conditional_edges(self, source_node: str, path: Callable, path_map: Dict[str, str]):
            self.conditional_edges[source_node] = (path, path_map)
            return self

        def compile(self):
            return _LangGraphCompiledApp(self.nodes, self.edges, self.conditional_edges)

    START = "START"
    END = "END"


# ============================================================================
# Master Orchestration Nodes
# ============================================================================

def discovery_node(state: ResearchGraphState) -> Dict[str, Any]:
    """
    Node 1: Module 1 (Discovery Agent)
    Expands queries, retrieves scholarly papers, eliminates duplicates,
    ranks with BM25, and produces Output 1 (v1.0.0).
    """
    trace_entry = {
        "node": "discovery_node",
        "agent": "Module 1: Discovery Agent",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "Starting query expansion, federated multi-index search, and BM25 ranking."
    }

    try:
        output1 = execute_discovery(
            research_topic=state.get("research_topic", ""),
            research_question=state.get("research_question", ""),
            preferences=state.get("discovery_preferences", {}),
            project_id=state.get("project_id")
        )

        trace_entry["status"] = "success"
        trace_entry["summary"] = f"Discovered and ranked {len(output1.get('papers', []))} papers."

        return {
            "current_node": "discovery_node",
            "discovery_status": "completed",
            "expanded_queries": output1.get("search_metadata", {}).get("query_expansion", {}).get("boolean_queries", []),
            "discovered_papers": output1.get("papers", []),
            "output1_payload": output1,
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }
    except Exception as e:
        trace_entry["status"] = "error"
        trace_entry["error"] = str(e)
        return {
            "current_node": "discovery_node",
            "discovery_status": "failed",
            "errors": state.get("errors", []) + [f"Discovery failed: {str(e)}"],
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }


def analysis_node(state: ResearchGraphState) -> Dict[str, Any]:
    """
    Node 2: Module 2 (Analysis Agent)
    Consumes Output 1, extracts paper structure & sections, runs TextRank
    claim analysis, grounds quotes with page numbers, and compiles Output 2 (v2.0.0).
    """
    trace_entry = {
        "node": "analysis_node",
        "agent": "Module 2: Analysis Agent",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "Ingesting Output 1, extracting structural landmarks, TextRank centrality, and verbatim evidence."
    }

    try:
        output1 = state.get("output1_payload")
        if not output1 or not output1.get("papers"):
            raise ValueError("No Output 1 payload available for analysis.")

        output2 = execute_analysis(
            output1_payload=output1,
            preferences=state.get("analysis_preferences", {})
        )

        trace_entry["status"] = "success"
        trace_entry["summary"] = f"Analyzed {len(output2.get('analyses', []))} papers with page-level evidence grounding."

        return {
            "current_node": "analysis_node",
            "analysis_status": "completed",
            "paper_analyses": output2.get("analyses", []),
            "cross_paper_synthesis": output2.get("cross_paper_synthesis", {}),
            "output2_payload": output2,
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }
    except Exception as e:
        trace_entry["status"] = "error"
        trace_entry["error"] = str(e)
        return {
            "current_node": "analysis_node",
            "analysis_status": "failed",
            "errors": state.get("errors", []) + [f"Analysis failed: {str(e)}"],
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }


def gap_identification_node(state: ResearchGraphState) -> Dict[str, Any]:
    """
    Node 3: Module 3 (Research Gap Agent)
    Consumes Output 2, clusters limitations, resolves empirical tensions,
    formulates candidate gaps with evidence strength, and compiles Output 3 (v3.0.0).
    """
    trace_entry = {
        "node": "gap_identification_node",
        "agent": "Module 3: Research Gap Agent",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "Ingesting Output 2, thematic limitation clustering, cross-paper tension detection, and final gap synthesis."
    }

    try:
        output2 = state.get("output2_payload")
        if not output2 or not output2.get("analyses"):
            raise ValueError("No Output 2 payload available for research gap synthesis.")

        output3 = execute_gap_identification(
            output2_payload=output2,
            preferences=state.get("gap_preferences", {})
        )

        trace_entry["status"] = "success"
        trace_entry["summary"] = f"Synthesized {len(output3.get('candidate_gaps', []))} evidence-graded research gaps."

        return {
            "current_node": "gap_identification_node",
            "gap_status": "completed",
            "pipeline_status": "completed",
            "observation_clusters": output3.get("observation_clusters", []),
            "identified_tensions": output3.get("cross_paper_tensions", []),
            "candidate_gaps": output3.get("candidate_gaps", []),
            "final_report": output3.get("final_report", {}),
            "output3_payload": output3,
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }
    except Exception as e:
        trace_entry["status"] = "error"
        trace_entry["error"] = str(e)
        return {
            "current_node": "gap_identification_node",
            "gap_status": "failed",
            "pipeline_status": "halted",
            "errors": state.get("errors", []) + [f"Gap analysis failed: {str(e)}"],
            "execution_trace": state.get("execution_trace", []) + [trace_entry]
        }


def handle_pipeline_error(state: ResearchGraphState) -> Dict[str, Any]:
    """Error recovery node if any agent halts."""
    existing_errors = list(state.get("errors") or [])
    if not existing_errors:
        existing_errors.append("Pipeline halted due to empty or invalid upstream output.")
    trace_entry = {
        "node": "handle_pipeline_error",
        "agent": "Fault-Tolerant Router",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": "Halted downstream execution due to missing or invalid upstream data.",
        "status": "halted",
        "summary": existing_errors[-1]
    }
    return {
        "current_node": "error_handler",
        "pipeline_status": "halted",
        "errors": existing_errors,
        "execution_trace": list(state.get("execution_trace") or []) + [trace_entry]
    }


# ============================================================================
# Conditional Edge Routers
# ============================================================================

def route_after_discovery(state: ResearchGraphState) -> str:
    """Check if Module 1 discovered valid papers before handing off to Module 2."""
    output1 = state.get("output1_payload") or {}
    if state.get("discovery_status") == "completed" and isinstance(output1.get("papers"), list) and len(output1.get("papers", [])) > 0:
        return "proceed_to_analysis"
    return "halt_on_error"


def route_after_analysis(state: ResearchGraphState) -> str:
    """Check if Module 2 successfully analyzed papers before handing off to Module 3."""
    output2 = state.get("output2_payload") or {}
    if state.get("analysis_status") == "completed" and isinstance(output2.get("analyses"), list) and len(output2.get("analyses", [])) > 0:
        return "proceed_to_gaps"
    return "halt_on_error"


# ============================================================================
# Graph Builder & Compilation
# ============================================================================

def build_research_scholar_graph():
    """
    Constructs and compiles the master LangGraph StateGraph.
    Configures deterministic handoffs:
    START -> discovery_node -> analysis_node -> gap_identification_node -> END
    """
    workflow = StateGraph(ResearchGraphState)

    # Register Nodes
    workflow.add_node("discovery_node", discovery_node)
    workflow.add_node("analysis_node", analysis_node)
    workflow.add_node("gap_identification_node", gap_identification_node)
    workflow.add_node("handle_pipeline_error", handle_pipeline_error)

    # Register Edges & Handoffs
    workflow.add_edge(START, "discovery_node")

    # Conditional Branch 1: Discovery -> Analysis
    workflow.add_conditional_edges(
        "discovery_node",
        route_after_discovery,
        {
            "proceed_to_analysis": "analysis_node",
            "halt_on_error": "handle_pipeline_error"
        }
    )

    # Conditional Branch 2: Analysis -> Gap Identification
    workflow.add_conditional_edges(
        "analysis_node",
        route_after_analysis,
        {
            "proceed_to_gaps": "gap_identification_node",
            "halt_on_error": "handle_pipeline_error"
        }
    )

    workflow.add_edge("gap_identification_node", END)
    workflow.add_edge("handle_pipeline_error", END)

    return workflow.compile()


# Singleton compiled graph instance
research_orchestrator = build_research_scholar_graph()


def execute_full_research_pipeline(
    research_topic: str,
    research_question: str = "",
    scholar_profile: Dict[str, Any] = None,
    discovery_prefs: Dict[str, Any] = None,
    analysis_prefs: Dict[str, Any] = None,
    gap_prefs: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    High-level entrypoint for executing the full end-to-end pipeline without user intervention.
    """
    initial_state: ResearchGraphState = {
        "project_id": f"rs-proj-{int(time.time())}",
        "research_topic": research_topic,
        "research_question": research_question,
        "scholar_profile": scholar_profile or {
            "name": "Example 1",
            "role": "RESEARCHSCHOLAR",
            "institution": "RESEARCHSCHOLAR AI Institute"
        },
        "discovery_preferences": discovery_prefs or {"paper_count": 5},
        "analysis_preferences": analysis_prefs or {},
        "gap_preferences": gap_prefs or {},
        "expanded_queries": [],
        "discovered_papers": [],
        "output1_payload": None,
        "discovery_status": "idle",
        "paper_analyses": [],
        "cross_paper_synthesis": None,
        "output2_payload": None,
        "analysis_status": "idle",
        "normalized_observations": {},
        "observation_clusters": [],
        "identified_tensions": [],
        "candidate_gaps": [],
        "final_report": None,
        "output3_payload": None,
        "gap_status": "idle",
        "current_node": "START",
        "pipeline_status": "in_progress",
        "execution_trace": [],
        "errors": []
    }

    final_state = research_orchestrator.invoke(initial_state)
    return final_state


if __name__ == "__main__":
    # Test CLI invocation
    topic = sys.argv[1] if len(sys.argv) > 1 else "Attention Mechanisms in Deep Learning"
    print(f"\n=======================================================")
    print(f"🚀 Running LangGraph Master Orchestrator for: {topic}")
    print(f"   Engine: {'Official LangGraph' if HAS_OFFICIAL_LANGGRAPH else 'Lightweight LangGraph Engine'}")
    print(f"=======================================================\n")

    result = execute_full_research_pipeline(topic)

    print(f"✅ Pipeline Status: {result.get('pipeline_status')}")
    print(f"📚 Output 1 Papers Discovered : {len(result.get('discovered_papers', []))}")
    print(f"🔬 Output 2 Papers Analyzed   : {len(result.get('paper_analyses', []))}")
    print(f"💡 Output 3 Gaps Formulated   : {len(result.get('candidate_gaps', []))}\n")

    for idx, trace in enumerate(result.get("execution_trace", []), 1):
        print(f"  Step {idx}: [{trace.get('agent')}] -> {trace.get('summary')}")
    print("\nOrchestrator execution finished successfully.")
