# Architecture Overview — Enterprise AI Interview Agent

This document explains the technical architecture, client vs. server responsibilities, session persistence, scoring mechanics, and local execution steps for the Enterprise AI Interview Agent.

---

## 1. System Architecture: Client vs. Server

```
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite UI                   │
│                                                        │
│  - Roster & Dashboard      - Interactive Chat          │
│  - Candidate Selection     - Post-Interview Radar      │
│  - Code Sandbox            - Single-click PDF Export   │
└──────────────────────────┬─────────────────────────────┘
                           │ POST /api/interview (Proxy /api -> :3001)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Node / Express API                   │
│                                                        │
│  - POST /api/interview (HTTP Endpoint Contract)        │
│  - In-Memory Session Store (Map / Redis-Ready)         │
│  - 60-Minute Server-Enforced Timer Expiration          │
│  - Candidate Session Integrity Validation              │
└──────────────────────────┬─────────────────────────────┘
                           │ Structured JSON Calls
                           ▼
┌────────────────────────────────────────────────────────┐
│              LLM & Curriculum Evaluation               │
│                                                        │
│  - hackethon document/curriculum.json (Single Source)  │
│  - Gemini 1.5 Flash (response_mime_type: JSON)         │
│  - 1-10 Dimension Scoring & Final Summary Synthesis    │
│  - Word-Count Heuristic Fallback (No Key Configured)   │
└────────────────────────────────────────────────────────┘
```

### Client (React + Vite)
- **User Interface**: Manages candidate rosters, profile pages, live interview chat interface, code sandbox, and post-interview feedback report with Recharts radar charts and PDF exports.
- **Client API Adapter**: Invokes `fetch("/api/interview", ...)` by default. Cache-synchronizes session telemetry to `localStorage` for offline access and getters.
- **Zero-Backend Fallback**: Supports `VITE_ENABLE_MOCK_ENGINE=true` to run client-side mock evaluation when no backend is deployed.

### Server (Node / Express on Port 3001)
- **Spec Endpoint**: Exposes `POST /api/interview` supporting:
  - `{ sessionId, candidate }` → Start new interview session.
  - `{ sessionId, message }` → Process conversation turn.
- **Timer Enforcement**: Records session start and 60-minute end time. Automatically completes session and generates feedback if a turn is submitted after expiration.
- **Candidate Validation**: Validates candidate ID against initial session binding to prevent session spoofing.

---

## 2. Session Persistence

- **Server-Side Session Store (`server/sessionStore.js`)**: Sessions are stored in an in-memory `Map` keyed by `sessionId`. The store is wrapped in a clean interface (`get`, `set`, `delete`, `has`, `list`) allowing seamless replacement with Redis (`ioredis`) for production multi-instance deployments.
- **Client Synchronization**: Whenever `/api/interview` responds, the returned session data is merged into client storage so page refreshes and navigation preserve interview state smoothly.

---

## 3. Real LLM-Based Answer Scoring & Fallback

### Real LLM Evaluation (Gemini API)
- When a candidate submits an answer, the server sends candidate text and the question's curriculum topic to Gemini (`gemini-1.5-flash`).
- Uses Gemini's **Structured JSON Schema Output** (`generationConfig.response_mime_type = "application/json"`) to ensure deterministic JSON response:
  ```json
  {
    "technicalCorrectness": 8,
    "depth": 7,
    "reasoning": 8,
    "communication": 9,
    "newDifficulty": 6,
    "skipped": false
  }
  ```
- **Final Feedback Synthesis**: At interview completion, Gemini synthesizes a customized report (`summary`, `strengths[]`, `gaps[]`, `next[]`, and 7 competency radar scores) grounded in the full conversation transcript.

### Heuristic Fallback & UI Badging
- If no API key is provided, scoring falls back gracefully to a word-count heuristic.
- The UI explicitly badges each session as either **"AI-Graded"** (Sparkles badge) or **"Heuristic"** (Cpu badge) so judges can visually verify live AI scoring.

---

## 4. How to Run Locally

### Prerequisites
- Node.js (v18+) and `npm`

### Step-by-Step
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and add your Gemini API Key:
   ```bash
   cp .env.example .env
   ```
   Add `GEMINI_API_KEY=your_key_here` (or `VITE_GEMINI_API_KEY=your_key_here`) in `.env`.

3. Launch server and frontend together:
   ```bash
   npm run dev
   ```
   This runs:
   - Backend Express server on `http://localhost:3001`
   - Frontend Vite dev server on `http://localhost:5173` (with `/api` proxy configured)

4. Open `http://localhost:5173` in your browser, select a candidate, and start the interview!
