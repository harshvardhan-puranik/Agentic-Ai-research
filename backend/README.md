# ResearchScholar AI – Unified Python LangGraph Master Orchestrator

This directory contains the unified Python backend architecture powered by **LangGraph** to serve as the Master Orchestrator for **ResearchScholar AI**. It coordinates seamless, automated task handoffs across:
- **Module 1**: Research Paper Discovery (Discovery Agent) -> Generates Output 1 (`v1.0.0`)
- **Module 2**: Research Paper Analysis (Analysis Agent) -> Generates Output 2 (`v2.0.0`)
- **Module 3**: Research Gap Identification (Gap Agent) -> Generates Output 3 (`v3.0.0`)

All handoffs occur autonomously without manual user copy-pasting or intervention.

---

## 1. Graph Topology & State Architecture

```
                                  ┌─────────────────┐
                                  │     [START]     │
                                  └────────┬────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │            discovery_node             │
                       │     (Module 1: Discovery Agent)       │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼ [route_after_discovery]
                                     /           \
                 (papers found)    /               \   (empty / failed)
                                 ▼                   ▼
     ┌───────────────────────────────────────┐   ┌───────────────────────────┐
     │             analysis_node             │   │   handle_pipeline_error   │
     │      (Module 2: Analysis Agent)       │   │ (Error Recovery & Logs)   │
     └───────────────────┬───────────────────┘   └─────────────┬─────────────┘
                         │                                     │
                         ▼ [route_after_analysis]              │
                   /           \                               │
(analyses valid) /               \ (failed)                    │
               ▼                   ▼                           │
 ┌───────────────────────────────────────┐                     │
 │        gap_identification_node        │                     │
 │    (Module 3: Research Gap Agent)     │                     │
 └───────────────────┬───────────────────┘                     │
                     │                                         │
                     ▼                                         ▼
           ┌───────────────────┐                     ┌───────────────────┐
           │       [END]       │◄────────────────────┤       [END]       │
           └───────────────────┘                     └───────────────────┘
```

---

## 2. Directory Structure

```
backend/
├── __init__.py
├── README.md                  # Comprehensive architectural guide & documentation
├── requirements.txt           # Pinned dependencies (langgraph, fastapi, uvicorn, pydantic)
├── schemas.py                 # Strict TypedDict schemas for ResearchGraphState & Module Outputs
├── orchestrator.py            # LangGraph StateGraph, node functions & conditional edge routers
├── server.py                  # FastAPI server providing REST & SSE streaming endpoints
├── agents/
│   ├── __init__.py
│   ├── discovery_agent.py     # Module 1 Agent: query expansion, search, deduplication & BM25 ranking
│   ├── analysis_agent.py      # Module 2 Agent: section extraction, TextRank & claim grounding
│   └── gap_agent.py           # Module 3 Agent: limitation clustering, tensions & gap synthesis
└── tests/
    ├── __init__.py
    └── test_orchestrator.py   # Automated unit test suite verifying state handoffs
```

---

## 3. Data Flow & Contracts

### Phase 1: `discovery_node`
- **Input**: `ResearchGraphState` containing `research_topic`, optional `research_question`, and `discovery_preferences`.
- **Processing**: Expands search terms, queries scholarly sources (OpenAlex, arXiv, Crossref, Semantic Scholar), removes duplicates via normalized DOI and title Levenshtein distance, and ranks papers using a deterministic BM25 / TF-IDF model.
- **Output**: Produces `output1_payload` adhering to schema `v1.0.0`.

### Phase 2: `analysis_node`
- **Input**: Automatic handoff from `discovery_node` via `route_after_discovery`.
- **Processing**: Parses document structures, runs graph centrality (TextRank) to extract problem statements and methodologies, extracts algorithms and datasets, and grounds claims with exact page and section citations.
- **Output**: Produces `output2_payload` adhering to schema `v2.0.0`.

### Phase 3: `gap_identification_node`
- **Input**: Automatic handoff from `analysis_node` via `route_after_analysis`.
- **Processing**: Normalizes reported limitations, clusters them into thematic pillars (Scalability, Robustness, Edge Quantization, Explainability), detects cross-paper empirical tensions, evaluates evidence strength (`strong`, `moderate`, `weak`), and formulates actionable Research Questions (RQs) and Objectives (ROs).
- **Output**: Produces `output3_payload` adhering to schema `v3.0.0` and the comprehensive Final Report.

---

## 4. How to Run

### Option A: Standalone CLI Runner (Zero external pip dependencies required)
The orchestrator includes a self-contained, API-compatible fallback engine that runs immediately using standard Python 3.10:
```bash
python3 backend/orchestrator.py "Attention Mechanisms in Deep Learning"
```

### Option B: Run the Test Suite
```bash
PYTHONPATH=. python3 -m unittest backend/tests/test_orchestrator.py
```

### Option C: Start the FastAPI Server (Production mode)
1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Launch the ASGI server:
   ```bash
   uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
   ```

### Option D: REST API Request
```bash
curl -X POST http://localhost:8000/api/orchestrate/run \
  -H "Content-Type: application/json" \
  -d '{
    "research_topic": "Linear Attention Transformers",
    "research_question": "How do linear attention mechanisms scale context length?",
    "discovery_preferences": { "paper_count": 5 }
  }'
```
