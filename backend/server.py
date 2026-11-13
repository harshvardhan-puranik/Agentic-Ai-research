"""
ResearchScholar AI – Unified Python FastAPI Server
Exposes the LangGraph Master Orchestrator via REST and Server-Sent Events (SSE) streaming.
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import JSONResponse, StreamingResponse
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

from backend.orchestrator import (
    research_orchestrator,
    execute_full_research_pipeline,
    HAS_OFFICIAL_LANGGRAPH
)
from backend.agents.discovery_agent import execute_discovery
from backend.agents.analysis_agent import execute_analysis
from backend.agents.gap_agent import execute_gap_identification

if HAS_FASTAPI:
    app = FastAPI(
        title="ResearchScholar AI – LangGraph Master Orchestrator",
        description="Unified orchestrator serving Module 1 (Discovery), Module 2 (Analysis), and Module 3 (Gap Identification).",
        version="3.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class OrchestratorRunRequest(BaseModel):
        research_topic: str = Field(..., description="Target academic research topic")
        research_question: Optional[str] = Field("", description="Optional focused research question")
        scholar_profile: Optional[Dict[str, Any]] = Field(default_factory=lambda: {
            "name": "Example 1",
            "role": "RESEARCHSCHOLAR",
            "institution": "RESEARCHSCHOLAR AI Institute"
        })
        discovery_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)
        analysis_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)
        gap_preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @app.get("/api/health")
    def health_check():
        return {
            "status": "online",
            "service": "ResearchScholar AI Master LangGraph Orchestrator",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "langgraph_runtime": "Official LangGraph" if HAS_OFFICIAL_LANGGRAPH else "Lightweight LangGraph Engine",
            "registered_nodes": [
                "discovery_node (Module 1: Discovery Agent)",
                "analysis_node (Module 2: Analysis Agent)",
                "gap_identification_node (Module 3: Research Gap Agent)",
                "handle_pipeline_error (Fault-Tolerant Router)"
            ]
        }

    @app.get("/api/orchestrate/graph-structure")
    def get_graph_structure():
        """Returns the static graph topology and node transitions."""
        return {
            "orchestrator_type": "LangGraph StateGraph",
            "state_schema": "ResearchGraphState",
            "nodes": [
                {"id": "START", "type": "entrypoint"},
                {"id": "discovery_node", "name": "Module 1: Discovery Agent", "produces": "Output 1 (v1.0.0)"},
                {"id": "analysis_node", "name": "Module 2: Analysis Agent", "produces": "Output 2 (v2.0.0)"},
                {"id": "gap_identification_node", "name": "Module 3: Research Gap Agent", "produces": "Output 3 (v3.0.0)"},
                {"id": "handle_pipeline_error", "name": "Fault Tolerant Recovery", "produces": "Error Diagnostics"},
                {"id": "END", "type": "exit"}
            ],
            "edges": [
                {"source": "START", "target": "discovery_node", "type": "direct"},
                {"source": "discovery_node", "target": "analysis_node", "type": "conditional", "condition": "route_after_discovery (has_valid_papers)"},
                {"source": "discovery_node", "target": "handle_pipeline_error", "type": "conditional", "condition": "route_after_discovery (failure)"},
                {"source": "analysis_node", "target": "gap_identification_node", "type": "conditional", "condition": "route_after_analysis (has_valid_analyses)"},
                {"source": "analysis_node", "target": "handle_pipeline_error", "type": "conditional", "condition": "route_after_analysis (failure)"},
                {"source": "gap_identification_node", "target": "END", "type": "direct"},
                {"source": "handle_pipeline_error", "target": "END", "type": "direct"}
            ]
        }

    @app.post("/api/orchestrate/run")
    def run_orchestrator(payload: OrchestratorRunRequest):
        """Executes full automated pipeline across all 3 modules without human intervention."""
        try:
            result = execute_full_research_pipeline(
                research_topic=payload.research_topic,
                research_question=payload.research_question,
                scholar_profile=payload.scholar_profile,
                discovery_prefs=payload.discovery_preferences,
                analysis_prefs=payload.analysis_preferences,
                gap_prefs=payload.gap_preferences
            )
            return {
                "success": True,
                "project_id": result.get("project_id"),
                "research_topic": result.get("research_topic"),
                "pipeline_status": result.get("pipeline_status"),
                "execution_trace": result.get("execution_trace"),
                "output1_payload": result.get("output1_payload"),
                "output2_payload": result.get("output2_payload"),
                "output3_payload": result.get("output3_payload"),
                "summary": {
                    "papers_discovered": len(result.get("discovered_papers", [])),
                    "papers_analyzed": len(result.get("paper_analyses", [])),
                    "gaps_synthesized": len(result.get("candidate_gaps", []))
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/orchestrate/stream")
    async def stream_orchestrator(payload: OrchestratorRunRequest):
        """Streams real-time node transitions as SSE chunks."""
        async def event_generator():
            initial_state = {
                "project_id": f"rs-proj-{int(datetime.utcnow().timestamp())}",
                "research_topic": payload.research_topic,
                "research_question": payload.research_question,
                "scholar_profile": payload.scholar_profile,
                "discovery_preferences": payload.discovery_preferences or {},
                "analysis_preferences": payload.analysis_preferences or {},
                "gap_preferences": payload.gap_preferences or {},
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

            for update in research_orchestrator.stream(initial_state):
                node_name = list(update.keys())[0]
                node_data = update[node_name]
                chunk = {
                    "event": "node_update",
                    "node": node_name,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "data": {
                        "current_node": node_name,
                        "status": node_data.get("discovery_status") or node_data.get("analysis_status") or node_data.get("gap_status")
                    }
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.1)

            yield "data: {\"event\": \"complete\", \"status\": \"success\"}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

else:
    app = None
    print("[ResearchScholar AI] Note: Install fastapi to run the ASGI server (pip install -r backend/requirements.txt).")
