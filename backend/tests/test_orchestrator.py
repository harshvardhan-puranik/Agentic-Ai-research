"""
ResearchScholar AI – LangGraph Orchestrator Unit Tests
Verifies state machine transitions, Output 1 -> Output 2 -> Output 3 handoffs, and error bounds.
"""

import unittest
from backend.orchestrator import execute_full_research_pipeline, build_research_scholar_graph
from backend.agents.discovery_agent import normalize_doi, normalize_title, levenshtein_similarity
from backend.agents.analysis_agent import textrank_sentence_scoring, extract_sentences
from backend.agents.gap_agent import cluster_observations


class TestLangGraphOrchestrator(unittest.TestCase):

    def test_string_similarity_and_normalization(self):
        t1 = "Attention Is All You Need!"
        t2 = "attention is all you need"
        self.assertEqual(normalize_title(t1), normalize_title(t2))
        self.assertGreater(levenshtein_similarity(normalize_title(t1), normalize_title(t2)), 0.95)

        doi_raw = "https://doi.org/10.1109/TPAMI.2023.3289110."
        self.assertEqual(normalize_doi(doi_raw), "10.1109/tpami.2023.3289110")

    def test_textrank_centrality(self):
        text = (
            "Deep neural networks have achieved remarkable accuracy across benchmarks. "
            "However, quadratic computational complexity creates significant memory bottlenecks. "
            "In this work, we propose a linear kernel approximation that eliminates quadratic overhead. "
            "Our extensive empirical results confirm a 1.8x reduction in peak VRAM consumption."
        )
        sents = extract_sentences(text)
        self.assertEqual(len(sents), 4)
        ranked = textrank_sentence_scoring(sents)
        self.assertEqual(len(ranked), 4)
        self.assertGreater(ranked[0][1], 0)

    def test_full_langgraph_pipeline_handoff(self):
        """Tests the seamless 3-node LangGraph execution without user intervention."""
        topic = "Transformers and Linear Attention"
        state = execute_full_research_pipeline(
            research_topic=topic,
            research_question="How do linear attention mechanisms scale context length?",
            discovery_prefs={"paper_count": 3}
        )

        # 1. State assertions
        self.assertEqual(state.get("pipeline_status"), "completed")
        self.assertEqual(state.get("discovery_status"), "completed")
        self.assertEqual(state.get("analysis_status"), "completed")
        self.assertEqual(state.get("gap_status"), "completed")

        # 2. Output 1 assertions
        output1 = state.get("output1_payload")
        self.assertIsNotNone(output1)
        self.assertEqual(output1.get("schema_version"), "1.0.0")
        self.assertEqual(output1.get("project_id"), state.get("project_id"))
        self.assertGreaterEqual(len(output1.get("papers", [])), 3)

        # 3. Output 2 assertions & paper_id continuity
        output2 = state.get("output2_payload")
        self.assertIsNotNone(output2)
        self.assertEqual(output2.get("schema_version"), "2.0.0")
        self.assertEqual(output2.get("project_id"), state.get("project_id"))
        self.assertEqual(len(output2.get("analyses", [])), len(output1.get("papers", [])))
        out1_ids = {p["paper_id"] for p in output1.get("papers", [])}
        out2_ids = {a["paper_id"] for a in output2.get("analyses", [])}
        self.assertEqual(out1_ids, out2_ids)
        self.assertTrue(any(len(a.get("evidence", [])) > 0 for a in output2.get("analyses", [])))

        # 4. Output 3 assertions & traceability
        output3 = state.get("output3_payload")
        self.assertIsNotNone(output3)
        self.assertEqual(output3.get("schema_version"), "3.0.0")
        self.assertEqual(output3.get("project_id"), state.get("project_id"))
        for gap in output3.get("candidate_gaps", []):
            for pid in gap.get("affected_paper_ids", []):
                self.assertIn(pid, out2_ids)
        self.assertIsNotNone(output3.get("final_report"))

        # 5. Trace validation
        trace = state.get("execution_trace", [])
        self.assertEqual(len(trace), 3)
        nodes_executed = [t["node"] for t in trace]
        self.assertEqual(nodes_executed, ["discovery_node", "analysis_node", "gap_identification_node"])

    def test_langgraph_error_routing_on_empty_discovery(self):
        """Tests that route_after_discovery safely halts into handle_pipeline_error when discovery returns 0 papers."""
        from backend.orchestrator import route_after_discovery, route_after_analysis, handle_pipeline_error

        empty_state = {
            "project_id": "rs-proj-err-test",
            "research_topic": "Nonexistent",
            "discovered_papers": [],
            "paper_analyses": [],
            "execution_trace": [],
            "errors": []
        }
        self.assertEqual(route_after_discovery(empty_state), "halt_on_error")
        self.assertEqual(route_after_analysis(empty_state), "halt_on_error")

        handled = handle_pipeline_error(empty_state)
        self.assertEqual(handled["pipeline_status"], "halted")
        self.assertTrue(any("handle_pipeline_error" == t["node"] for t in handled["execution_trace"]))
        self.assertGreater(len(handled["errors"]), 0)

    def test_genuine_discovery_real_world_topic(self):
        """Tests that Module 1 Discovery Agent retrieves authentic real papers from OpenAlex/arXiv."""
        from backend.agents.discovery_agent import execute_discovery
        topic = "Perovskite Solar Cells Degradation"
        output1 = execute_discovery(topic, preferences={"paper_count": 3})

        self.assertEqual(output1.get("schema_version"), "1.0.0")
        self.assertEqual(output1.get("research_topic"), topic)
        papers = output1.get("papers", [])
        self.assertGreater(len(papers), 0, "Must retrieve real papers from OpenAlex or arXiv")

        for paper in papers:
            self.assertTrue(paper.get("title"))
            self.assertTrue(isinstance(paper.get("authors"), list))
            self.assertTrue(paper.get("source_url").startswith("http"))
            self.assertIn(paper.get("source_database"), ["OpenAlex", "arXiv API", "Crossref"])
            # Ensure it's not a hardcoded fake attention paper
            self.assertNotIn("Attention Is All You Need", paper.get("title"))

        meta = output1.get("search_metadata", {})
        self.assertIn(meta.get("retrieval_status"), ["success", "empty_matches"])
        self.assertTrue(len(meta.get("sources_succeeded", [])) > 0)

    def test_analysis_agent_zero_fabrication_and_page_grounding(self):
        """Tests that Module 2 Analysis Agent never invents datasets/results/pages and grounds multi-page text."""
        from backend.agents.analysis_agent import analyze_single_paper, NOT_REPORTED

        # 1. Abstract-only sparse paper must return Not reported and page=None
        sparse = {
            "paper_id": "test-abs-1",
            "title": "Conceptual Note on Polymer Electrolytes",
            "abstract": "We discuss conceptual ion transport pathways in solid polymer electrolytes."
        }
        res_abs = analyze_single_paper(sparse)
        self.assertEqual(res_abs["document_status"], "abstract_only")
        self.assertEqual(res_abs["algorithms"], [NOT_REPORTED])
        self.assertEqual(res_abs["datasets"], [NOT_REPORTED])
        self.assertEqual(res_abs["reported_results"], [NOT_REPORTED])
        self.assertTrue(all(ev["page"] is None for ev in res_abs["evidence"]))

        # 2. Multi-page paper must preserve exact page numbers
        full_paper = {
            "paper_id": "test-full-1",
            "title": "CRISPR-Cas9 Screening on UK Biobank",
            "abstract": "In this study, we apply CRISPR-Cas9 gene editing screens.",
            "pages": [
                {"pageNumber": 1, "text": "Abstract\nIn this study, we apply CRISPR-Cas9 gene editing screens."},
                {"pageNumber": 2, "text": "Methodology\nExperiments evaluate variants using UK Biobank cohort data and F1-Score."},
                {"pageNumber": 3, "text": "Results\nOur pipeline achieves 91.4% editing efficiency.\nLimitations\nOff-target effects remain restricted to high-GC loci."}
            ],
            "fullText": "Abstract\nIn this study, we apply CRISPR-Cas9 gene editing screens.\nMethodology\nExperiments evaluate variants using UK Biobank cohort data and F1-Score.\nResults\nOur pipeline achieves 91.4% editing efficiency.\nLimitations\nOff-target effects remain restricted to high-GC loci."
        }
        res_full = analyze_single_paper(full_paper)
        self.assertEqual(res_full["document_status"], "full_text")
        self.assertIn("CRISPR-Cas9 / Gene Editing", res_full["algorithms"])
        self.assertIn("UK Biobank", res_full["datasets"])
        res_ev = next((e for e in res_full["evidence"] if e["finding"] == "Experimental Results"), None)
        self.assertIsNotNone(res_ev)
        self.assertEqual(res_ev["page"], 3)

    def test_gap_agent_zero_fabrication_and_insufficiency(self):
        """Tests that Module 3 Gap Agent never injects Attention/INT8 boilerplate and flags insufficient evidence."""
        from backend.agents.gap_agent import execute_gap_identification

        # 1. Domain-specific non-Attention corpus
        solar_output2 = {
            "schema_version": "2.0.0",
            "project_id": "test-solar",
            "research_topic": "Perovskite Solar Cell Stability",
            "analyses": [
                {
                    "paper_id": "sol-1",
                    "title": "Moisture Degradation in Halide Perovskites",
                    "document_status": "full_text",
                    "objective": "Measure humidity-induced degradation in halide films.",
                    "methodology": "Damp heat cycling chamber testing.",
                    "algorithms": ["Equivalent Circuit Fitting"],
                    "datasets": ["In-house PCE Stability Log"],
                    "evaluation_metrics": ["Power Conversion Efficiency (PCE)"],
                    "reported_results": ["Initial PCE of 21.3% dropped to 14.1% after 500h damp heat."],
                    "limitations": ["Encapsulation delamination occurs under thermal cycling above 85C."],
                    "future_work": ["Test fluorinated polymer moisture barriers under ISOS-D-3."],
                    "evidence": [
                        {
                            "paper_id": "sol-1",
                            "finding": "Limitations",
                            "page": 4,
                            "section": "Discussion",
                            "excerpt": "Encapsulation delamination occurs under thermal cycling above 85C."
                        }
                    ]
                },
                {
                    "paper_id": "sol-2",
                    "title": "2D Capping Layers for Perovskite Photovoltaics",
                    "document_status": "full_text",
                    "objective": "Suppress ion migration using 2D organic spacers.",
                    "methodology": "Spin-coated phenethylammonium iodide capping.",
                    "algorithms": ["Drift-Diffusion Simulation"],
                    "datasets": ["Cell Batch B"],
                    "evaluation_metrics": ["T80 Lifetime"],
                    "reported_results": ["Retained 85% efficiency over 800 hours at ambient humidity."],
                    "limitations": ["Batch-to-batch crystal orientation variability reduces module scale reproducibility."],
                    "future_work": ["Scale blade-coating uniformity to 10x10 cm minimodules."],
                    "evidence": [
                        {
                            "paper_id": "sol-2",
                            "finding": "Limitations",
                            "page": 6,
                            "section": "Limitations",
                            "excerpt": "Batch-to-batch crystal orientation variability reduces module scale reproducibility."
                        }
                    ]
                }
            ]
        }

        out3 = execute_gap_identification(solar_output2)
        self.assertEqual(out3["schema_version"], "3.0.0")
        self.assertTrue(out3["evidence_sufficiency"]["is_sufficient"])
        self.assertGreaterEqual(len(out3["candidate_gaps"]), 2)
        serialized = str(out3["candidate_gaps"]).lower()
        self.assertNotIn("quadratic memory", serialized)
        self.assertNotIn("int8", serialized)
        valid_ids = {"sol-1", "sol-2"}
        for g in out3["candidate_gaps"]:
            for pid in g["affected_paper_ids"]:
                self.assertIn(pid, valid_ids)

        # 2. Insufficient Not-reported corpus
        empty_output2 = {
            "schema_version": "2.0.0",
            "project_id": "test-empty",
            "research_topic": "Sparse Abstract Notes",
            "analyses": [
                {
                    "paper_id": "sp-1",
                    "title": "Abstract Note",
                    "document_status": "abstract_only",
                    "objective": "Conceptual study.",
                    "methodology": "Not reported",
                    "algorithms": ["Not reported"],
                    "datasets": ["Not reported"],
                    "evaluation_metrics": ["Not reported"],
                    "reported_results": ["Not reported"],
                    "limitations": ["Not reported"],
                    "future_work": ["Not reported"],
                    "evidence": []
                }
            ]
        }
        out3_empty = execute_gap_identification(empty_output2)
        self.assertFalse(out3_empty["evidence_sufficiency"]["is_sufficient"])
        self.assertEqual(len(out3_empty["candidate_gaps"]), 0)


if __name__ == "__main__":
    unittest.main()
