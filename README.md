# ResearchScholar AI — Autonomous Academic Research Assistant

**ResearchScholar AI** is a full-stack academic literature discovery, grounded paper analysis, and research-gap synthesis platform. It runs a three-module autonomous pipeline (`Output 1 v1.0.0 → Output 2 v2.0.0 → Output 3 v3.0.0`) powered by **zero external generative AI / LLM APIs**—combining live federated scholarly APIs, binary PDF parsing (`pdf-parse` v2), and trained in-house statistical ML/IR models.

> **Companion Python Backend:** An alternative/companion Python LangGraph + FastAPI orchestrator lives in [`backend/`](./backend/README.md). The primary web application (React + Express + Vite) runs entirely on Node.js via `npm install` and `npm run dev`.

---

## Quick Start in VS Code

### Prerequisites
- **Node.js** `v20+` (includes `node:test`, native `fetch`, and `AbortSignal.timeout`)
- **npm** `v9+`

### 1. Install All Dependencies
Open the project folder in VS Code, open the integrated terminal (`Ctrl+\`` / `Cmd+\``), and run:

```bash
npm install
```

This installs all frontend, backend Express server, PDF parsing (`pdf-parse`), Tailwind CSS, TypeScript check, and `tsx` runtime/test dependencies listed in `package.json`.

### 2. Optional Environment Configuration
Copy `.env.example` to `.env` if you want to customize runtime variables:

```bash
cp .env.example .env
```

Optional environment variables supported by `server.js` / `src/services/academicApi.js`:
- `PORT` — Server port (defaults to `3000`)
- `APP_URL` — Public base URL when deployed
- `IEEE_API_KEY` — Optional institutional IEEE Xplore API key (can also be entered directly in the UI Search Workspace; not required for OpenAlex, arXiv, Crossref, or Semantic Scholar)
- `DISABLE_HMR=true` — Optional flag to disable Vite HMR file watching

> **Zero AI API Keys Required:** No OpenAI, Gemini, or Anthropic API keys are needed. All NLP classification, BM25 ranking, sentence-role tagging, and TF-IDF clustering run locally in Node.js/browser.

### 3. Start the Application
```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Express (`server.js`) serves both the `/api/*` backend routes and the Vite-compiled React frontend on port `3000`.

---

## Available npm Scripts

| Command | Description |
| :--- | :--- |
| `npm install` | Installs all runtime and dev dependencies (`package.json`) |
| `npm run dev` | Starts Express + Vite middleware server on `http://localhost:3000` (`tsx server.js`) |
| `npm run build` | Builds the production frontend bundle into `dist/` (`vite build`) |
| `npm run preview` | Previews the static `dist/` Vite build (`vite preview`) |
| `npm run lint` | Runs TypeScript/JS type & syntax check (`tsc --noEmit`) |
| `npm test` | Runs all 28 `node:test` unit & integration tests via `tsx --test` |
| `npm run train:models` | Retrains & evaluates all in-house ML models from `src/ml/datasets/scholarlyCorpus.js` and updates `src/ml/models/trainedModels.{json,js}` |

> **Warning:** Avoid running `npm run clean` (`rm -rf dist server.js`), as it removes `server.js` along with `dist/`.

---

## Architecture & Module Pipeline

```text
[Module 1: Paper Discovery] ──(Output 1 v1.0.0)──▶ [Module 2: Paper Analysis] ──(Output 2 v2.0.0)──▶ [Module 3: Gap Identification]
  • Query Expansion + Domain ML                     • Open-Access PDF Fetch / Upload                    • Observation Normalization
  • Federated Search (OpenAlex,                     • %PDF- Magic Check & Scan Guard                    • Theme + TF-IDF Clustering
    arXiv, Semantic Scholar, Crossref, IEEE)        • Page-Aware Sectioning & Chunking                  • Contradiction / Tension Detection
  • DOI + Title Deduplication                       • SentenceRoleSoftmax + Verbatim Extract            • Evidence Strength Grading &
  • BM25 + Pairwise LTR Ranking                     • Cross-Paper Synthesis & Evidence Ledger             Actionable Gap Report (Output 3 v3.0.0)
```

### API Endpoints (`server.js` on Port 3000)

| Method & Route | Purpose |
| :--- | :--- |
| `GET /api/health` | Service status, runtime capabilities, and schema versions |
| `GET /api/models/status` | Metadata and evaluation metrics for loaded in-house ML models |
| `POST /api/models/classify` | Run `ResearchDomainClassifier` and `SentenceRoleClassifier` inference |
| `POST /api/academic/search` | Server-side federated academic search, deduplication, filtering, and BM25+LTR ranking |
| `GET /api/analysis/sample-output1` | Returns benchmark `SAMPLE_OUTPUT_1` JSON fixture (`v1.0.0`) |
| `POST /api/analysis/validate-output1` | Validates `Output 1` JSON schema |
| `POST /api/pdf/parse` | Parses base64-encoded PDFs (`%PDF-` validation, scanned PDF detection, page/section extraction) |
| `POST /api/analysis/process-papers` | Fetches OA PDFs + merges uploaded PDFs, extracts grounded claims, builds `Output 2` (`v2.0.0`) |
| `GET /api/gap/sample-output2` | Returns benchmark `SAMPLE_OUTPUT_2` JSON fixture (`v2.0.0`) |
| `POST /api/gap/validate-output2` | Validates `Output 2` JSON schema & computes corpus coverage |
| `POST /api/gap/analyze` | Runs gap clustering, tension detection, sufficiency checks, and builds `Output 3` (`v3.0.0`) |

---

## Project Structure

```text
.
├── server.js                      # Active Express + Vite server & REST API (port 3000)
├── index.html                     # HTML entry point & SEO metadata
├── package.json                   # Node dependencies & npm scripts
├── vite.config.ts                 # Vite + React + Tailwind v4 configuration
├── tsconfig.json                  # TypeScript / allowJs compiler config
├── .env.example                   # Optional environment variable template
├── src/
│   ├── App.jsx                    # Root state & automated Module 1 → 2 → 3 orchestration
│   ├── main.jsx                   # React 19 entry point
│   ├── index.css                  # Tailwind CSS v4 & scholarly theme tokens
│   ├── components/                # UI modules & sub-views
│   │   ├── Navbar.jsx, Footer.jsx, Toast.jsx, AuthModal.jsx
│   │   ├── Module1Discovery.jsx, SearchWorkspace.jsx, SearchResults.jsx, SavedPapersView.jsx, PaperDetailsModal.jsx
│   │   ├── Module2Analysis.jsx, PasteInputWorkspace.jsx, PdfUploadCenter.jsx, AnalysisWorkspace.jsx, EvidenceExplorer.jsx, PaperComparisonMatrix.jsx
│   │   └── Module3GapAnalyzer.jsx
│   ├── services/
│   │   ├── academicApi.js         # Client/standalone federated search wrapper + OA fallback fixtures
│   │   └── academicApi.test.js    # Live/pipeline integration tests
│   ├── utils/
│   │   ├── academicSearchEngine.js (+ .test.js)
│   │   ├── paperAnalysisEngine.js  (+ .test.js)
│   │   ├── researchGapEngine.js    (+ .test.js)
│   │   ├── storage.js             # LocalStorage helpers & BibTeX generator
│   │   └── clipboard.js           # Clipboard copy with textarea fallback
│   └── ml/
│       ├── index.js               # Singleton runtime model loader
│       ├── textPreprocessing.js   # Tokenizer, stemmer, stopwords, cosine similarity, seeded split
│       ├── researchClassifier.js  # TF-IDF + affixes Multinomial Softmax domain classifier
│       ├── relevanceRanker.js     # 6-feature BM25 + Pairwise LTR ranker
│       ├── sentenceRoleClassifier.js # TF-IDF + structural cue Softmax sentence classifier
│       ├── semanticClusterer.js   # Average-linkage TF-IDF agglomerative clusterer
│       ├── trainModels.js         # Reproducible training & hold-out/LOOCV evaluation pipeline
│       ├── datasets/scholarlyCorpus.js
│       └── models/trainedModels.{json,js}
└── backend/                       # Companion Python LangGraph + FastAPI orchestrator (see backend/README.md)
```

---

## Testing & Verification

### 1. Run JavaScript / TypeScript Unit & Integration Tests
```bash
npm test
```
Executes 28 tests across:
- `src/services/academicApi.test.js` (4 tests — OpenAlex inverted abstract reconstruction, live federated search, non-fabricated domain retrieval, empty-match handling)
- `src/utils/academicSearchEngine.test.js` (8 tests — title/DOI/author normalization, deduplication, year/inclusion/exclusion filtering, query expansion, BM25+LTR scoring, `Output 1` validation)
- `src/utils/paperAnalysisEngine.test.js` (9 tests — `Output 1` validation, PDF validation, page-aware section heading detection, chunking & retrieval, zero-fabrication on sparse abstracts, exact page grounding, inline colon sections, `Output 2` schema generation)
- `src/utils/researchGapEngine.test.js` (7 tests — `Output 2` validation, `"Not reported"` stripping, domain-agnostic clustering, evidence-grounded vs speculative gap traceability, insufficient-evidence safety gate, 10-dimension comparative `Output 3` & Markdown report generation)

> Note: Two tests in `src/services/academicApi.test.js` perform live HTTP requests to OpenAlex, arXiv, and Crossref, so internet access is required for those tests to pass.

### 2. Retrain & Re-evaluate In-House ML Models
```bash
npm run train:models
```
Uses deterministic seed `42` to run stratified 75/25 hold-out evaluation (`ResearchDomainClassifier`, `SentenceRoleClassifier`) and Leave-One-Query-Out Cross-Validation (`ScholarlyRelevanceRanker`), then persists updated weights to `src/ml/models/trainedModels.json` and `src/ml/models/trainedModels.js`.

### 3. Optional Companion Python Backend Tests
See [`backend/README.md`](./backend/README.md) for Python setup:
```bash
PYTHONPATH=. python3 -m unittest backend/tests/test_orchestrator.py
```

---

## Troubleshooting

- **Port 3000 already in use:** Set a custom port via `PORT=3001 npm run dev`.
- **Semantic Scholar HTTP 429 rate limits:** Public unauthenticated Semantic Scholar requests are strictly rate-limited. Module 1 gracefully marks Semantic Scholar as `rate_limited` and merges results from OpenAlex, arXiv, and Crossref.
- **Scanned PDF warning in Module 2:** PDFs without an embedded text layer (e.g., scanned images) are detected automatically and fall back safely to abstract-only analysis without fabricating page numbers (built-in OCR is not included).
