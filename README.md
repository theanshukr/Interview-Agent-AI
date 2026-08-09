# Enterprise AI Interview Agent 🚀

> **Curriculum-Aware Technical Interview & Candidate Evaluation Platform**
> Built with React 18, Vite, Node/Express, Tailwind CSS, Recharts, and Lucide Icons.

---

## 🔗 Quick Links & Live Demo

- 🚀 **Live Demo Web Application**: [https://theanshukr.github.io/Interview-Agent-AI/](https://theanshukr.github.io/Interview-Agent-AI/)
- 📦 **GitHub Source Repository**: [https://github.com/theanshukr/Interview-Agent-AI](https://github.com/theanshukr/Interview-Agent-AI)
- 🤖 **AI Usage Log & Prompt History**: [PROMPTS.md](file:///c:/Users/ALEC/Downloads/Interview-Agent-AI%20%282%29/Interview-Agent-AI/PROMPTS.md)
- 📄 **Technical Architecture Docs**: [ARCHITECTURE.md](file:///c:/Users/ALEC/Downloads/Interview-Agent-AI%20%282%29/Interview-Agent-AI/ARCHITECTURE.md)

---

## 🌟 Overview

**Enterprise AI Interview Agent** is an end-to-end, curriculum-aware AI platform designed to conduct dynamic, adaptive technical interviews for software and AI engineering roles. Grounded in an 8-topic AI Engineering curriculum (from setup to vector search & RAG pipelines), it maintains session state via a server-side engine, enforces a server-recorded 60-minute interview limit, grades candidate responses on a 1–10 scale using strict JSON schema LLM evaluation, and synthesizes 7-competency evaluation reports with single-click PDF export.

---

## 📋 Hackathon Requirements & Compliance Matrix

| Hackathon Requirement | Status | Project Implementation |
| :--- | :---: | :--- |
| **1. 31-Day AI Curriculum Grounding** | ✅ **100% Implemented** | Grounded directly in `curriculum.json` covering RAG, Vector Databases, Prompt Engineering, Agentic AI, MCP, Docker/K8s, and Production AI. |
| **2. Candidate Profile Integration** | ✅ **100% Implemented** | Personalizes interview starting points and difficulty using candidate profile missions, skipped topics, and attempts. |
| **3. Conversational Multi-turn Dialogue** | ✅ **100% Implemented** | Natural, continuous dialogue with Atlas (the AI Interviewer) with contextual memory across turns. |
| **4. Min 8 Questions across 4+ Days** | ✅ **100% Implemented** | Conducts 8-question interviews spanning 8 distinct curriculum days (Day 1, 3, 7, 10, 12, 16, 23, 28). |
| **5. Adaptive Question Progression** | ✅ **100% Implemented** | Scales difficulty (1–10) dynamically based on technical depth (+1 for strong answers, -1 for brief answers, -2 for skips). |
| **6. Intent Classification** | ✅ **100% Implemented** | Classifies responses as `VALID_ANSWER`, `SKIP` (no unfair penalty), or `GIBBERISH` (does not waste question count). |
| **7. Structured 7-Competency Feedback** | ✅ **100% Implemented** | Synthesizes readiness score %, strengths, gaps, next steps, 7-dimension Recharts radar chart, and PDF downloads. |
| **8. Spec Endpoint (`POST /api/interview`)** | ✅ **100% Implemented** | Node/Express backend on port 3001 compliant with literal `technical-spec.md` request/response specs. |
| **9. Session Timer & Integrity** | ✅ **100% Implemented** | 60-minute server-enforced timer expiration and candidate ID validation to prevent spoofing. |

---

## ✨ Core Features

- 🧠 **Curriculum-Grounded AI Interviewer**: Grounded directly in `hackethon document/curriculum.json` with dynamic intent detection (`VALID_ANSWER`, `SKIP`, `GIBBERISH`).
- ⚡ **Node/Express Backend API**: Single endpoint (`POST /api/interview`) satisfying hackathon API contract specs literally for starting and continuing interviews.
- 🎯 **Deterministic Real LLM Scoring**: Grades candidate answers using Gemini structured JSON schema outputs for `technicalCorrectness`, `depth`, `reasoning`, and `communication` (1–10 scale), with graceful word-count heuristic fallback.
- 🔒 **Server-Enforced 60-Minute Session Timer & Integrity**: Expiration timer enforced server-side; candidate ID validation prevents session spoofing.
- 💻 **Interactive Code Sandbox**: Integrated live coding & SQL sandbox with instant evaluation.
- 📊 **7-Competency Radar Evaluation**: Provides visual breakdown across Knowledge, Accuracy, Communication, Confidence, Depth, Reasoning, and Practical application.
- 📄 **Executive Report & PDF Export**: High-fidelity post-interview report generation with plain text and PDF downloads.
- 👥 **Candidate Onboarding & Roster**: Candidate pipeline dashboard with bulk JSON/CSV import capabilities.

---

## 🌐 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` (or `VITE_GEMINI_API_KEY`) is populated in `.env`.

### 3. Run Backend Server & Frontend Together
Launch both the Express backend (`http://localhost:3001`) and Vite dev server (`http://localhost:5173`) with a single command:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> Note: To run the frontend in zero-backend offline mode for local judging, set `VITE_ENABLE_MOCK_ENGINE=true` in `.env`.

---

## 📦 Scripts Overview

```bash
# Start Express backend & Vite dev server concurrently
npm run dev

# Start Node Express server only (Port 3001)
npm run dev:server

# Start Vite frontend dev server only (Port 5173)
npm run dev:vite

# Build production bundle into dist/
npm run build

# Run linter & type checks
npm run lint
npm run typecheck
```

---

---

## 🔌 API Integration & Endpoints

The system relies on two primary API layers for intelligence and session orchestration:

### 1. Google Gemini AI Model API
- **Model**: `gemini-1.5-flash` via `@google/generative-ai` SDK & REST endpoints.
- **Header Authentication**: `x-gemini-api-key` header (or server-side `GEMINI_API_KEY` environment variable).
- **Structured Output**: Enforces strict JSON Schema outputs (`response_mime_type: "application/json"`) for deterministic 1–10 multi-dimension scoring and standardized feedback reports.

### 2. Backend Server Endpoints (Node / Express on Port 3001)
- **`POST /api/interview`**: Core technical spec endpoint handling both session initialization and conversation turns.
  - **Start Interview**: `{ "sessionId": "string", "candidate": { ... } }` → Initializes session, picks Day 1 curriculum topic, records 60-minute start/end timestamps, and returns opening question.
  - **Continue Interview**: `{ "sessionId": "string", "message": "string" }` → Validates candidate session, evaluates answer via Gemini JSON schema, adjusts difficulty, and returns next question or final feedback summary when complete.
- **`POST /api/reset`**: Resets all active in-memory server interview sessions in `sessionStore`.
- **`GET /api/health`**: Returns server status, uptime, and active session count.

---

## 🤖 How the AI Model Evaluates & Generates Answers

Atlas (the AI Interviewer) follows a multi-stage evaluation pipeline for every candidate response turn:

```
Candidate Response ──► Intent Classification ──► Multi-Dimension Scoring ──► Difficulty Adjustment ──► Adaptive Next Question / Summary
```

1. **Response Intent Classification**:
   - **`VALID_ANSWER`**: Evaluates technical accuracy, architectural reasoning, and depth.
   - **`SKIP`**: Candidate passes or says "I don't know" / "no idea". Adjusts difficulty down (-2) and moves gracefully to the next topic without penalizing communication.
   - **`GIBBERISH`**: Random text, filler ("nice question", "ok"), or off-topic banter. The model gently prompts the candidate for a technical answer without incrementing question count.
2. **1–10 Multi-Dimension Scoring**:
   - **Technical Correctness** (1–10)
   - **Explanation Depth** (1–10)
   - **Logical Reasoning** (1–10)
   - **Communication Clarity** (1–10)
3. **Dynamic Difficulty Adjustment**:
   - Starting at difficulty 5/10, the engine adapts question difficulty after each turn (+1 for strong answers, -1 for brief answers, -2 for skipped questions).
4. **7-Competency Radar Synthesis**:
   - Upon interview completion (or 60-minute timer expiration), Gemini synthesizes an executive feedback summary featuring overall readiness %, key strengths, knowledge gaps, recommended next steps, and scores across 7 dimensions (Knowledge, Accuracy, Communication, Confidence, Depth, Reasoning, Practical).
5. **Heuristic Fallback**:
   - If no Gemini API key is configured, the engine falls back seamlessly to a deterministic word-count & keyword heuristic algorithm. The UI explicitly displays an **"AI-Graded"** (Sparkles) vs. **"Heuristic"** (Cpu) badge so evaluators can verify key usage.

---

## 🔄 Resetting Student / Candidate Activity

You can reset student activity, interview progress, and test sessions using any of the following 3 methods:

### Method 1: Via the Web Application (Settings UI)
1. Open the application in your browser and click **Settings** (or navigate to `/settings`).
2. Scroll to the bottom of the workspace settings card.
3. Click **"Reset local candidate storage"**.
4. Confirm the prompt to restore candidate data and session history back to seed cohort defaults.

### Method 2: Via Server REST API Endpoint
To clear all active backend interview sessions on the Express server:
```bash
curl -X POST http://localhost:3001/api/reset
```
Response:
```json
{
  "status": "ok",
  "message": "All active interview sessions have been reset."
}
```

### Method 3: Via Code / Browser Console
In browser dev tools console or client scripts, invoke the built-in reset helper:
```javascript
import { apiClient } from "@/lib/apiClient";

// Reset candidate attempt data and interview session storage
apiClient.resetAllData();
```

---

## 📁 Repository Structure

```
├── hackethon document/
│   ├── candidates.json            # Candidate seed data
│   ├── curriculum.json            # 31-day AI engineering curriculum source of truth
│   └── technical-spec.md          # Graded hackathon API specification
├── server/
│   ├── index.js                   # Node/Express app listening on PORT 3001 (POST /api/interview & POST /api/reset)
│   ├── engine.js                  # Adaptive interview state machine & timer enforcement
│   ├── curriculum.js              # Curriculum JSON loader & adaptive question picker
│   ├── llmEvaluator.js            # Structured JSON schema Gemini grading & feedback synthesizer
│   └── sessionStore.js            # Server-side in-memory session manager (Redis-swappable)
├── src/
│   ├── components/                # Reusable UI components & Layouts
│   │   ├── ui/                    # Radix UI primitives & toast components
│   │   ├── Avatar.jsx             # Candidate avatar generator
│   │   ├── CodeSandbox.jsx        # Interactive coding sandbox
│   │   ├── ImportDataModal.jsx    # Candidate bulk JSON/CSV import modal
│   │   ├── InterviewProgress.jsx # Progress tracker
│   │   ├── InterviewTimer.jsx    # Interview countdown clock
│   │   ├── RadarScore.jsx         # Recharts 7-competency radar chart
│   │   └── TopNav.jsx             # Global header & navigation bar
│   ├── lib/
│   │   ├── interviewApi.js        # Client API caller fetching POST /api/interview
│   │   ├── apiClient.js           # Client local store persistence helper
│   │   ├── candidateData.js       # Candidate data normalization & metrics
│   │   └── seedCandidates.js      # Default candidate seed data
│   ├── pages/                     # Application route views
│   │   ├── Dashboard.jsx          # Executive candidate roster & readiness dashboard
│   │   ├── CandidateProfile.jsx   # Individual candidate detail & mission history
│   │   ├── SelectCandidate.jsx    # Candidate selection for interview launch
│   │   ├── Interview.jsx          # Live interactive interview interface & chat
│   │   ├── Feedback.jsx           # Post-interview report & competency radar
│   │   ├── Curriculum.jsx         # 31-day cohort curriculum browser
│   │   └── Settings.jsx           # Model & API configuration settings
│   ├── App.jsx                    # Navigation router setup
│   └── main.jsx                   # React entry point
├── ARCHITECTURE.md                # Detailed technical architecture document
├── .env.example                   # Environment variable template
├── package.json                   # Project dependencies and script runners
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.js                 # Vite bundler configuration & /api proxy setup
```
