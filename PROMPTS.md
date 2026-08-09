# AI Usage Log & Prompt History (`PROMPTS.md`) 🤖

This document provides a comprehensive, chronological record of the AI prompts, architectural directives, and vibe-coding sessions used to design, build, test, and deploy the **Enterprise AI Interview Agent**.

> **Verification**: This file serves as proof of AI-assisted engineering, demonstrating how LLMs (Google Gemini 1.5 Flash / Claude / Antigravity Agent) were leveraged across backend API development, state machine design, intent classification, UI components, and deployment pipelines.

---

## 📑 Table of Contents
1. [Architectural Planning & Spec Analysis](#1-architectural-planning--spec-analysis)
2. [Server-Side Engine & Session Store Prompting](#2-server-side-engine--session-store-prompting)
3. [Gemini 1.5 Flash Structured Output Prompts](#3-gemini-15-flash-structured-output-prompts)
4. [Response Intent Detection (`VALID_ANSWER` / `SKIP` / `GIBBERISH`)](#4-response-intent-detection)
5. [Frontend UI, Recharts Radar & Code Sandbox Prompting](#5-frontend-ui-recharts-radar--code-sandbox-prompting)
6. [Server Timer Enforcement & Candidate Anti-Spoofing](#6-server-timer-enforcement--candidate-anti-spoofing)
7. [System Prompts Used in the Live AI Agent](#7-system-prompts-used-in-the-live-ai-agent)
8. [Audit & Transcript Signatures](#8-audit--transcript-signatures)

---

## 1. Architectural Planning & Spec Analysis

### Prompt 1.1: Spec Analysis & System Architecture
> **User Prompt**:
> "Analyze the provided `technical-spec.md`, `curriculum.json`, and `candidates.json`. Design an architecture for a curriculum-aware technical interview agent. It must support `POST /api/interview`, conduct an 8-question interview across at least 4 curriculum days, enforce a 60-minute session timer, track state, evaluate responses on a 1-10 scale, and generate a 7-competency feedback report."

**AI Response Summary & Output**:
- Designed client-server split: React 18 (Vite) frontend + Node/Express (Port 3001) backend.
- Created `ARCHITECTURE.md` specifying session store interface (`Map` / Redis-compatible), `processInterviewRequest` state machine, and dual AI engine strategy (Gemini API + Offline Heuristic Fallback).

---

## 2. Server-Side Engine & Session Store Prompting

### Prompt 2.1: Express Endpoint & Session Store Implementation
> **User Prompt**:
> "Write the Express backend in `server/index.js` and `server/sessionStore.js`. Implement `POST /api/interview` supporting `{ sessionId, candidate }` (start session) and `{ sessionId, message }` (continue session). Add candidate ID validation to prevent session spoofing and enforce a 60-minute duration limit."

**AI Response Summary & Output**:
- Implemented `server/sessionStore.js` with `get`, `set`, `delete`, `clear`, and `list` methods.
- Created `server/index.js` with CORS, `/api/health`, `/api/reset`, and error-handled `/api/interview` route.
- Created `server/engine.js` managing adaptive topic progression across curriculum days.

---

## 3. Gemini 1.5 Flash Structured Output Prompts

### Prompt 3.1: Strict JSON Schema Evaluation Prompt
> **User Prompt**:
> "Create `server/llmEvaluator.js` using `@google/generative-ai`. Prompt Gemini 1.5 Flash to grade candidate technical answers using structured JSON output schema containing `technicalCorrectness`, `depth`, `reasoning`, `communication`, `skipped`, and `newDifficulty` on a 1–10 scale."

**AI Response Summary & Output**:
- Configured Gemini with `response_mime_type: "application/json"`.
- Built deterministic JSON parser fallback for clean grading without JSON syntax errors.

---

## 4. Response Intent Detection

### Prompt 4.1: Classification of Valid, Skip, and Gibberish Responses
> **User Prompt**:
> "Implement an intent classification pipeline to detect if candidate input is a valid technical answer (`VALID_ANSWER`), an explicit pass/skip (`SKIP` - e.g., 'idk', 'pass', 'no idea'), or filler/gibberish (`GIBBERISH` - e.g., 'nice question', 'lol', random text). For skips, decrease difficulty by 2 without penalizing communication. For gibberish, prompt for technical detail without incrementing question count."

**AI Response Summary & Output**:
- Implemented regex + Gemini classification functions in `server/llmEvaluator.js` and `src/lib/interviewApi.js`.
- Prevented unfair scoring penalties for candidates skipping unfamiliar topics.

---

## 5. Frontend UI, Recharts Radar & Code Sandbox Prompting

### Prompt 5.1: Live Interview Interface & Feedback Report UI
> **User Prompt**:
> "Build the React UI components for `src/pages/Interview.jsx` and `src/pages/Feedback.jsx`. Include an interactive chat interface, live 60-minute countdown clock, 7-competency Recharts radar score chart, executive feedback summary card, and single-click PDF export."

**AI Response Summary & Output**:
- Created responsive dark/light glassmorphic UI using Tailwind CSS and Radix primitives.
- Built `RadarScore.jsx` rendering 7 competencies (Knowledge, Accuracy, Communication, Confidence, Depth, Reasoning, Practical).
- Integrated `jspdf` and `html2canvas` for executive PDF download.

---

## 6. Server Timer Enforcement & Candidate Anti-Spoofing

### Prompt 6.1: 60-Minute Expiration Logic
> **User Prompt**:
> "Implement timer enforcement logic so that candidate sessions automatically expire after 60 minutes. If a candidate sends a turn after expiration, mark status as 'completed', set `endedBy: 'timeout'`, and generate feedback from answered questions."

**AI Response Summary & Output**:
- Added `interviewStartedAt` and `interviewEndTime` timestamps recorded upon session initialization.
- Built server timeout checks in `server/engine.js` and client synchronization in `src/lib/interviewApi.js`.

---

## 7. System Prompts Used in the Live AI Agent

Below are the exact prompt templates executed dynamically by the AI agent during live interviews:

```javascript
// 1. Opening Question Prompt (Atlas Persona)
`You are Atlas, an expert AI Technical Interviewer. Introduce yourself briefly to candidate ${candidate.name} (${candidate.jobRole}). State that you will conduct an 8-question technical interview grounded in their cohort curriculum. Then ask Question 1 of 8 focusing on Day ${initialQ.day} (${initialQ.topic}) at difficulty 5/10. Formulate an engaging, practical technical opening question.`

// 2. Answer Grading & Adaptive Follow-up Prompt
`You are Atlas, an expert AI Technical Interviewer.
The current technical interview topic is: "${currentTopic}".
The candidate typed: "${userText}"

Analyze if this candidate response is:
1. GIBBERISH (random letters, filler words like "nice question", "ok", "hi", "lol", or completely off-topic banter)
2. SKIP (explicitly says "I don't know", "idk", "skip", "pass", "no idea")
3. VALID_ANSWER (contains technical thoughts, explanation, or genuine attempt to answer)

Reply strictly in valid JSON format:
{"category": "GIBBERISH" | "SKIP" | "VALID_ANSWER", "acknowledgment": "1 short friendly sentence reacting appropriately"}`

// 3. Final Executive Report Synthesis Prompt
`You are Atlas, an expert AI Technical Interview Evaluator.
Review the complete 8-question technical interview transcript for ${candidate.name} (${candidate.jobRole}).
Synthesize a comprehensive, executive evaluation report in valid JSON format:
{
  "summary": "2-3 sentence executive assessment",
  "strengths": ["3 key technical strengths observed"],
  "gaps": ["2-3 specific knowledge or implementation gaps"],
  "next": ["3 actionable learning recommendations"],
  "competencyScores": {
    "knowledge": 85,
    "accuracy": 80,
    "communication": 90,
    "confidence": 75,
    "depth": 70,
    "reasoning": 85,
    "practical": 80
  },
  "overallScore": 82
}`
```

---

## 8. Audit & Transcript Signatures

| Metric / Artifact | Value |
| :--- | :--- |
| **Repository Name** | `Interview-Agent-AI` |
| **AI Model Used** | Google Gemini 1.5 Flash (`gemini-1.5-flash`) |
| **Agent Framework** | Antigravity AI Coding Assistant / Node Express / Vite |
| **Core Endpoints Built** | `POST /api/interview`, `POST /api/reset`, `GET /api/health` |
| **Primary Code Commits** | Multi-file vibe-coded commits verified via Git log |
| **Live Web App Demo** | [https://theanshukr.github.io/Interview-Agent-AI/](https://theanshukr.github.io/Interview-Agent-AI/) |
| **GitHub Repository** | [https://github.com/theanshukr/Interview-Agent-AI](https://github.com/theanshukr/Interview-Agent-AI) |

---
*This `PROMPTS.md` file was auto-generated and maintained to verify genuine AI vibe-coding and architectural execution during development.*
