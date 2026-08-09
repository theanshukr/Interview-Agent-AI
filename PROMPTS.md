\
# PROMPTS.md — AI Usage Log & Prompt History 🤖

> **Project:** Enterprise AI Interview Agent / Interview-Agent-AI  
> **Purpose:** Comprehensive record of the AI-assisted engineering process used to plan, architect, implement, test, refine, and deploy the curriculum-aware technical interview platform.
>
> **Verification note:** This document combines (1) prompts and directives already documented in the project's earlier `PROMPTS.md` material, (2) implementation-grounded reconstruction of the engineering prompts implied by the supplied repository, and (3) final refinement/deployment prompts. Reconstructed prompts are explicitly marked **[RECONSTRUCTED]** so this file does not falsely present inferred wording as an exact historical transcript.

---

## 📑 Table of Contents

1. [Project Vision & Initial Requirement Analysis](#1-project-vision--initial-requirement-analysis)
2. [Repository & Existing-Codebase Analysis](#2-repository--existing-codebase-analysis)
3. [Hackathon Specification & Compliance](#3-hackathon-specification--compliance)
4. [System Architecture](#4-system-architecture)
5. [Curriculum & Candidate Data Modeling](#5-curriculum--candidate-data-modeling)
6. [Candidate Normalization & Readiness Scoring](#6-candidate-normalization--readiness-scoring)
7. [Interview Session State Machine](#7-interview-session-state-machine)
8. [Adaptive Question Engine](#8-adaptive-question-engine)
9. [Atlas Interviewer Persona](#9-atlas-interviewer-persona)
10. [Answer Intent Classification](#10-answer-intent-classification)
11. [Answer Evaluation & Difficulty Adaptation](#11-answer-evaluation--difficulty-adaptation)
12. [LLM / Gemini Integration](#12-llm--gemini-integration)
13. [Feedback & Competency Evaluation](#13-feedback--competency-evaluation)
14. [60-Minute Global Timer](#14-60-minute-global-timer)
15. [Single Active Interview & Continue Flow](#15-single-active-interview--continue-flow)
16. [Interview UI / Chat Experience](#16-interview-ui--chat-experience)
17. [Candidate Dashboard & Candidate Management](#17-candidate-dashboard--candidate-management)
18. [Technical Code Sandbox](#18-technical-code-sandbox)
19. [Notifications & Session Lifecycle](#19-notifications--session-lifecycle)
20. [Authentication & Protected Application Flow](#20-authentication--protected-application-flow)
21. [Navigation, Atlas Control Center & UX](#21-navigation-atlas-control-center--ux)
22. [Import, Seed Data & Data Safety](#22-import-seed-data--data-safety)
23. [Feedback Report & Transcript](#23-feedback-report--transcript)
24. [Responsive / Dark-Light / Premium UI Refinement](#24-responsive--dark-light--premium-ui-refinement)
25. [GitHub Pages & Routing](#25-github-pages--routing)
26. [Build, Lint & Type Validation](#26-build-lint--type-validation)
27. [Bug Fixing & Regression Prompts](#27-bug-fixing--regression-prompts)
28. [Final Production Hardening](#28-final-production-hardening)
29. [Final System Prompts Used by Atlas](#29-final-system-prompts-used-by-atlas)
30. [Engineering Decisions & Trade-offs](#30-engineering-decisions--trade-offs)
31. [Implementation Evidence Map](#31-implementation-evidence-map)
32. [Final AI-Assisted Development Summary](#32-final-ai-assisted-development-summary)

---

# 1. Project Vision & Initial Requirement Analysis

## Prompt 1.1 — Define the Product

> **[RECONSTRUCTED]**
>
> "Design an Enterprise AI Technical Interview Agent that can conduct a complete software/AI engineering interview from candidate selection through final evaluation. The system must understand the candidate's cohort curriculum, ask technical questions grounded in completed learning modules, maintain interview state, adapt difficulty, enforce an overall interview time limit, and generate a professional evaluation report."

### AI Output / Engineering Direction

The initial product direction was defined as a **curriculum-aware technical assessment platform**, rather than a generic chatbot.

The system was expected to:

- select a candidate;
- understand candidate profile and curriculum progress;
- start an interview session;
- ask exactly 8 primary technical questions;
- cover at least 4 curriculum days;
- maintain a conversational transcript;
- detect skips and non-answers;
- adapt difficulty;
- enforce a 60-minute global timer;
- prevent multiple simultaneous live interviews;
- generate structured feedback;
- expose competency scores;
- provide a candidate/interviewer dashboard;
- support a technical coding scratchpad;
- persist session state;
- work in a deployment-friendly frontend environment.

---

## Prompt 1.2 — Define the Interview Agent Persona

> **[RECONSTRUCTED]**
>
> "Create a professional AI technical interviewer persona named Atlas. Atlas should sound like an experienced technical interviewer rather than a generic assistant. It should be concise, professional, supportive, technically focused, and able to transition naturally between questions."

### Result

The agent identity became:

**Atlas — AI Technical Interviewer**

Atlas is responsible for:

- opening the interview;
- introducing the candidate's role/context;
- presenting Question N of 8;
- acknowledging responses;
- handling skips without unnecessary penalty;
- redirecting filler/gibberish;
- adapting questions;
- closing the interview;
- producing the final evaluation.

---

## Prompt 1.3 — Define the End-to-End User Journey

> **[RECONSTRUCTED]**
>
> "Map the complete user journey from landing page to login, dashboard, candidate selection, candidate profile, interview start, live interview, timer expiration/completion, feedback report, and starting another interview. Identify every state transition and failure state."

### Resulting Flow

```text
Landing
   ↓
Authentication
   ↓
Dashboard
   ↓
Candidate Selection
   ↓
Candidate Profile
   ↓
Start Interview
   ↓
Atlas Question 1/8
   ↓
Candidate Answer
   ↓
Intent Classification
   ↓
Evaluation + Difficulty Update
   ↓
Next Question
   ↓
...
   ↓
Question 8/8
   ↓
Feedback Generation
   ↓
Feedback / Transcript / Competency Radar
```

Alternative termination:

```text
Live Interview
   ↓
60:00 → 00:00
   ↓
Automatic Completion
   ↓
Timeout Feedback
```

---

# 2. Repository & Existing-Codebase Analysis

## Prompt 2.1 — Analyze the Existing Repository

> **[RECONSTRUCTED]**
>
> "Analyze the existing repository before making changes. Identify the frontend framework, routing strategy, persistence layer, candidate data source, interview engine, UI component structure, environment configuration, deployment setup, and existing technical debt. Do not replace working functionality unnecessarily."

### Repository Findings

The supplied project contains:

- React 18;
- Vite;
- React Router;
- Tailwind CSS;
- Radix UI primitives;
- Recharts;
- Framer Motion;
- Lucide icons;
- local persistence through the application client;
- candidate normalization;
- curriculum JSON;
- candidate JSON;
- interview state management;
- GitHub Pages deployment configuration.

Major application areas include:

```text
src/
├── components/
├── hooks/
├── lib/
├── pages/
├── App.jsx
└── main.jsx
```

Important implementation files include:

```text
src/lib/interviewApi.js
src/lib/candidateData.js
src/lib/apiClient.js
src/hooks/useInterviewTimer.js
src/hooks/useInterviewStarter.js
src/pages/Interview.jsx
src/pages/Feedback.jsx
src/pages/Dashboard.jsx
src/pages/SelectCandidate.jsx
src/components/TopNav.jsx
src/components/InterviewTimer.jsx
src/components/InterviewSwitchDialog.jsx
src/components/CodeSandbox.jsx
src/components/RadarScore.jsx
```

---

## Prompt 2.2 — Preserve Existing Conventions

> **[RECONSTRUCTED]**
>
> "Work within the existing project conventions. Reuse existing components, utility functions, API client, session persistence, routing, and design tokens. Avoid introducing a second state system or duplicate implementation unless necessary."

### Result

The interview system remained integrated with the existing React application instead of becoming a separate standalone product.

---

# 3. Hackathon Specification & Compliance

## Prompt 3.1 — Analyze the Technical Specification

> **DOCUMENTED**
>
> "Analyze the provided `technical-spec.md`, `curriculum.json`, and `candidates.json`. Design an architecture for a curriculum-aware technical interview agent. It must support `POST /api/interview`, conduct an 8-question interview across at least 4 curriculum days, enforce a 60-minute session timer, track state, evaluate responses on a 1-10 scale, and generate a 7-competency feedback report."

### Original Specification Requirements

The supplied technical specification requires:

```http
POST /api/interview
```

Start request:

```json
{
  "sessionId": "abc-123",
  "candidate": {}
}
```

Continuation request:

```json
{
  "sessionId": "abc-123",
  "message": "candidate answer"
}
```

Completion response:

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": [],
    "gaps": [],
    "next": []
  }
}
```

### Important Implementation Note

The supplied final repository implements the interview engine primarily through:

```text
src/lib/interviewApi.js
```

and persists state through the application's client-side data layer.

The original server/API requirement therefore remains an architectural target/specification, while the supplied final implementation is a browser-side adaptive engine with optional external LLM integration.

---

## Prompt 3.2 — Build a Compliance Checklist

> **[RECONSTRUCTED]**
>
> "Create a requirement-to-implementation checklist. Verify 8 questions, 4+ curriculum days, persistent session ID, conversational state, adaptive difficulty, skip handling, timer enforcement, final feedback, and competency scoring."

### Compliance Snapshot

| Requirement | Implementation |
|---|---|
| 8 questions | Yes |
| 4+ curriculum days | Yes |
| Session ID | Yes |
| Conversational transcript | Yes |
| Adaptive difficulty | Yes |
| Skip handling | Yes |
| Gibberish handling | Yes |
| 60-minute timer | Yes |
| Timeout completion | Yes |
| Feedback | Yes |
| 7 competencies | Yes |
| Candidate management | Yes |
| Technical sandbox | Yes |
| Deployment support | Yes |

---

# 4. System Architecture

## Prompt 4.1 — Define the Architecture

> **DOCUMENTED**
>
> "Design client-server split: React 18 (Vite) frontend + Node/Express (Port 3001) backend. Create `ARCHITECTURE.md` specifying session store interface (`Map` / Redis-compatible), `processInterviewRequest` state machine, and dual AI engine strategy (Gemini API + Offline Heuristic Fallback)."

### Architectural Intent

The conceptual architecture was:

```text
Candidate Data
     ↓
Interview Session
     ↓
State Machine
     ↓
Intent Detection
     ↓
Answer Evaluation
     ↓
Difficulty Adaptation
     ↓
Question Selection
     ↓
Atlas Response
     ↓
Transcript
     ↓
Final Evaluation
```

### AI Engine Strategy

Two execution paths were planned:

```text
                ┌───────────────┐
Candidate ─────▶│ LLM Evaluation│
                └───────┬───────┘
                        │
                 available?
                  /          \
                yes           no
                ↓              ↓
            Gemini        Heuristic Engine
                \              /
                 ───────┬──────
                        ↓
                  Interview State
```

This allows the application to continue functioning when an external LLM is unavailable.

---

## Prompt 4.2 — Keep the State Machine Explicit

> **[RECONSTRUCTED]**
>
> "Model the interview as an explicit state machine. Every request must determine the current session state before deciding what response to produce."

### State Model

```text
READY
  ↓
ACTIVE
  ├── GIBBERISH → ACTIVE
  ├── SKIP      → ACTIVE
  ├── ANSWER    → ACTIVE
  ├── Q8        → COMPLETED
  └── TIMEOUT   → COMPLETED

PAUSED (legacy-compatible state)
  ↓
RESUMED → ACTIVE
```

The implementation intentionally supports only one live active/paused session at a time.

---

# 5. Curriculum & Candidate Data Modeling

## Prompt 5.1 — Understand Curriculum Data

> **[RECONSTRUCTED]**
>
> "Read the curriculum data and identify technical modules that can be used as interview topics. Convert the learning journey into interview-ready topics containing day, title/topic, implementation context, and technical depth."

### Interview Curriculum Coverage

The question bank includes topics such as:

1. VS Code & Python Environment Setup
2. First AI Project, React Frontend & FastAPI
3. Vector Embeddings & Semantic Search
4. Retrieval & Matching Engine
5. Prompt Engineering & Structured Outputs
6. Chatbot Backend & API Integration
7. Model Context Protocol (MCP) & Agentic AI
8. Docker & Kubernetes AI Deployment

This provides broad coverage across:

- development environment;
- frontend/backend integration;
- embeddings;
- retrieval;
- prompt engineering;
- APIs;
- agents;
- deployment.

---

## Prompt 5.2 — Make Questions Curriculum-Aware

> **[RECONSTRUCTED]**
>
> "Do not ask generic interview questions when candidate curriculum information is available. Generate questions from the candidate's completed modules and preserve the curriculum day/topic in session state."

### Result

A candidate question can be generated as:

```text
Day 10 — Retrieval & Matching Engine

When building a RAG retrieval engine, how do you handle
metadata filtering, hybrid search, and chunk overlap ratios
to minimize context dilution?
```

For candidate-specific missions, the engine can generate:

```text
Looking at Day X (Topic):
Walk me through how you implemented this module during your
cohort, the key trade-offs you evaluated, and how you validated
your design.
```

---

# 6. Candidate Normalization & Readiness Scoring

## Prompt 6.1 — Normalize Candidate Records

> **[RECONSTRUCTED]**
>
> "Create a candidate normalization layer so imported candidate objects and seed candidate objects are converted into one consistent schema. Support nested `member` records and direct candidate records."

### Normalized Candidate Fields

```text
candidateId
name
jobRole
currentPosition
yearsExperience
education
status
cohort
readinessScore
weakTopics
strengths
missions
signals
```

---

## Prompt 6.2 — Calculate Readiness

> **[RECONSTRUCTED]**
>
> "Calculate a transparent readiness score using curriculum completion and first-attempt performance. Keep the score bounded from 0 to 100."

### Implemented Model

The supplied implementation uses:

```text
60% → completion across 31 missions
40% → first-try performance
```

with a bounded result:

```text
0 ≤ readinessScore ≤ 100
```

### Strength Extraction

Strengths are inferred from missions that:

- passed;
- were not skipped;
- required no more than one attempt.

### Weak Topic Extraction

Weak topics are inferred from missions with:

- four or more attempts; or
- unsuccessful completion.

---

# 7. Interview Session State Machine

## Prompt 7.1 — Implement Session Initialization

> **DOCUMENTED**
>
> "Write the Express backend in `server/index.js` and `server/sessionStore.js`. Implement `POST /api/interview` supporting `{ sessionId, candidate }` (start session) and `{ sessionId, message }` (continue session). Add candidate ID validation to prevent session spoofing and enforce a 60-minute duration limit."

### Session State Implemented in the Supplied App

A live session contains fields including:

```text
sessionId
candidate
status
messages
currentDay
currentTopic
difficulty
coveredDays
targetQuestions
questionNumber
evaluations
feedback
interviewStartedAt
interviewEndTime
pausedRemainingMs
pausedAt
endedBy
createdAt
updatedAt
```

---

## Prompt 7.2 — Enforce One Live Session

> **[RECONSTRUCTED]**
>
> "A candidate/interviewer should never accidentally run two live interviews at once. If a new interview is started while another session is active or paused, clearly warn the user and require confirmation before replacing the current session."

### Result

The application includes:

- active-session detection;
- switch confirmation dialog;
- continue existing interview;
- explicit start-new-interview action;
- automatic cleanup of replaced live sessions.

---

## Prompt 7.3 — Preserve Session Across Navigation

> **[RECONSTRUCTED]**
>
> "The interview must remain active when the interviewer leaves the interview page. Store the absolute interview end timestamp rather than relying on an in-memory interval."

### Result

The implementation stores:

```text
interviewStartedAt
interviewEndTime
```

and calculates:

```text
remaining = interviewEndTime - currentTime
```

This prevents timer drift caused by:

- React re-renders;
- page navigation;
- delayed intervals;
- browser tab changes;
- page refreshes.

---

# 8. Adaptive Question Engine

## Prompt 8.1 — Build the Question Bank

> **RECONSTRUCTED**
>
> "Create an interview question bank covering at least 8 distinct curriculum days. Questions should test practical implementation, architecture, trade-offs, and production reasoning rather than simple definitions."

### Question Types

```text
SETUP
BUILD
AI_CORE
AGENTS
EVAL
```

---

## Prompt 8.2 — Build Candidate-Aware Question Generation

> **RECONSTRUCTED**
>
> "If candidate mission data is available, prioritize questions connected to their actual cohort work. Otherwise fall back to the curated question bank."

### Selection Strategy

```text
Candidate missions available?
       ↓
      YES ──→ Use candidate mission/day/topic
       │
       NO
       ↓
Use curated question bank
```

---

## Prompt 8.3 — Ensure 8 Questions

> **RECONSTRUCTED**
>
> "The interview must count primary technical questions, not filler messages. Gibberish should not advance the question counter. A skip should advance to the next technical question."

### Result

```text
VALID_ANSWER
   → evaluate
   → count question
   → advance

SKIP
   → record skip
   → lower difficulty
   → advance

GIBBERISH
   → do not count
   → request technical answer
   → remain on same question
```

---

# 9. Atlas Interviewer Persona

## Prompt 9.1 — Opening Message

> **DOCUMENTED**
>
> "You are Atlas, an expert AI Technical Interviewer. Introduce yourself briefly to candidate `${candidate.name}` (`${candidate.jobRole}`). State that you will conduct an 8-question technical interview grounded in their cohort curriculum. Then ask Question 1 of 8 focusing on Day `${initialQ.day}` (`${initialQ.topic}`) at difficulty 5/10. Formulate an engaging, practical technical opening question."

### Fallback Opening

The application can fall back to a deterministic opening when the LLM is unavailable:

```text
Hi [Candidate] — I'm Atlas, your AI Technical Interviewer.

I'll assess your readiness for the [Role] role through an
8-question interview based on your cohort learning journey.

Let's start with Question 1 of 8...
```

---

## Prompt 9.2 — Tone Rules

> **RECONSTRUCTED**
>
> "Atlas should be professional but not intimidating. Acknowledge genuine technical answers briefly, never reveal hidden scoring during the interview, avoid excessive praise, and keep the interview moving."

### Tone Principles

- concise;
- technical;
- neutral;
- respectful;
- practical;
- non-judgmental;
- interview-focused.

---

# 10. Answer Intent Classification

## Prompt 10.1 — Three-Way Classification

> **DOCUMENTED**
>
> "Implement an intent classification pipeline to detect if candidate input is a valid technical answer (`VALID_ANSWER`), an explicit pass/skip (`SKIP` - e.g., 'idk', 'pass', 'no idea'), or filler/gibberish (`GIBBERISH` - e.g., 'nice question', 'lol', random text). For skips, decrease difficulty by 2 without penalizing communication. For gibberish, prompt for technical detail without incrementing question count."

### Classification Contract

```json
{
  "category": "GIBBERISH | SKIP | VALID_ANSWER",
  "acknowledgment": "1 short friendly sentence reacting appropriately"
}
```

---

## Prompt 10.2 — Deterministic Fallback

> **RECONSTRUCTED**
>
> "When an LLM classifier is unavailable, implement deterministic heuristics that can distinguish common filler/gibberish and skip phrases from genuine technical attempts."

### Example Skip Patterns

```text
I don't know
idk
no idea
not sure
skip
pass
dunno
no clue
unsure
not familiar
```

### Example Filler Patterns

```text
nice question
good question
ok
okay
thanks
hi
hello
hey
lol
rofl
asdf
qwerty
test
bro
bruh
```

---

## Prompt 10.3 — Protect the Question Counter

> **RECONSTRUCTED**
>
> "A candidate saying 'nice question' must not accidentally consume one of the eight technical questions. Persist the message for transcript/audit purposes but keep the current question number unchanged."

### Result

Gibberish flow:

```text
Candidate: "nice question"

Atlas:
"Take a moment to share your technical response for Question 3."

Question number:
3 → 3
```

---

# 11. Answer Evaluation & Difficulty Adaptation

## Prompt 11.1 — Structured Evaluation

> **DOCUMENTED**
>
> "Create `server/llmEvaluator.js` using `@google/generative-ai`. Prompt Gemini 1.5 Flash to grade candidate technical answers using structured JSON output schema containing `technicalCorrectness`, `depth`, `reasoning`, `communication`, `skipped`, and `newDifficulty` on a 1–10 scale."

### Evaluation Shape

```json
{
  "technicalCorrectness": 8,
  "depth": 7,
  "reasoning": 8,
  "communication": 9,
  "skipped": false,
  "newDifficulty": 6
}
```

---

## Prompt 11.2 — Skip Evaluation

> **RECONSTRUCTED**
>
> "When a candidate explicitly skips a question, record the skip without treating it as a communication failure. Reduce the next difficulty by two points, bounded to the 1–10 range."

### Result

```text
difficulty = max(1, currentDifficulty - 2)
```

Communication remains relatively protected.

---

## Prompt 11.3 — Heuristic Evaluation Fallback

> **RECONSTRUCTED**
>
> "Create a deterministic fallback evaluator based on answer length and technical attempt signals so the interview remains functional without an external LLM."

### Fallback Signals

- very short answer → lower depth;
- longer technical explanation → higher depth;
- substantial answer → higher reasoning/communication;
- skip → explicit skip state.

### Difficulty Bounds

```text
1 ≤ difficulty ≤ 10
```

---

# 12. LLM / Gemini Integration

## Prompt 12.1 — Optional Gemini Integration

> **RECONSTRUCTED**
>
> "Integrate Gemini as an optional LLM provider. The application must remain usable if no Gemini API key is configured."

### Result

The supplied application checks settings before calling Gemini.

Conceptually:

```text
Gemini configured?
    ├── YES → LLM generation/classification
    └── NO  → deterministic fallback
```

---

## Prompt 12.2 — Gemini Request Safety

> **RECONSTRUCTED**
>
> "Never let an LLM request failure destroy the interview session. Catch network errors, malformed JSON, empty responses, and unavailable credentials, then continue with the fallback engine."

### Result

LLM failures are treated as recoverable.

---

## Prompt 12.3 — Clean Structured Output

> **DOCUMENTED**
>
> "Configure Gemini with JSON response output and build a deterministic JSON parser fallback for clean grading without JSON syntax errors."

### Parsing Strategy

```text
raw LLM response
       ↓
remove markdown fences
       ↓
trim
       ↓
JSON.parse
       ↓
valid object?
       ├── yes → use result
       └── no  → fallback
```

---

# 13. Feedback & Competency Evaluation

## Prompt 13.1 — Final Executive Report

> **DOCUMENTED**
>
> "You are Atlas, an expert AI Technical Interview Evaluator. Review the complete 8-question technical interview transcript for `${candidate.name}` (`${candidate.jobRole}`). Synthesize a comprehensive, executive evaluation report in valid JSON format."

### Report Schema

```json
{
  "summary": "2-3 sentence executive assessment",
  "strengths": [
    "3 key technical strengths observed"
  ],
  "gaps": [
    "2-3 specific knowledge or implementation gaps"
  ],
  "next": [
    "3 actionable learning recommendations"
  ],
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
}
```

---

## Prompt 13.2 — Define Seven Competencies

> **RECONSTRUCTED**
>
> "Create a seven-axis technical evaluation model that balances theoretical understanding, correctness, communication, confidence, depth, reasoning, and practical implementation."

### Competencies

1. Knowledge
2. Accuracy
3. Communication
4. Confidence
5. Depth
6. Reasoning
7. Practical

---

## Prompt 13.3 — Make Feedback Actionable

> **RECONSTRUCTED**
>
> "Do not generate generic feedback such as 'practice more'. Every gap should point to a concrete topic, engineering concept, or implementation skill. Every next step should be actionable."

### Example Areas

```text
RAG evaluation
Context Recall
Answer Relevance
MCP tool failure recovery
Structured output validation
Retrieval quality
Production deployment
```

---

# 14. 60-Minute Global Timer

## Prompt 14.1 — Global Interview Timer

> **DOCUMENTED**
>
> "Implement timer enforcement logic so that candidate sessions automatically expire after 60 minutes. If a candidate sends a turn after expiration, mark status as `completed`, set `endedBy: 'timeout'`, and generate feedback from answered questions."

### Core Rule

The timer belongs to the **entire interview**, not each question.

```text
Interview starts
      ↓
60:00 global clock
      ↓
Question 1
Question 2
Question 3
...
Question 8
      ↓
Complete OR 00:00
```

---

## Prompt 14.2 — Timestamp-Based Timer

> **RECONSTRUCTED**
>
> "Do not calculate remaining time by decrementing a React state value every second. Store the absolute end timestamp and derive remaining time from the current clock."

### Formula

```text
remainingMs =
max(0, interviewEndTime - Date.now())
```

---

## Prompt 14.3 — Timer Warning States

> **RECONSTRUCTED**
>
> "Create clear timer states for normal operation, under ten minutes, under five minutes, under one minute, expired, and paused/legacy sessions."

### UI States

```text
Time remaining
Under 10 min
Under 5 min
Under 1 min
Time Expired
```

---

## Prompt 14.4 — Expire Everywhere

> **RECONSTRUCTED**
>
> "If an interview is active while the user is outside the interview page, the global navigation layer must still enforce the same 60-minute deadline."

### Result

The top navigation observes the active session and can automatically expire it when the deadline is reached.

---

# 15. Single Active Interview & Continue Flow

## Prompt 15.1 — Prevent Two Simultaneous Interviews

> **RECONSTRUCTED**
>
> "Only one interview may be active at a time. If the user attempts to start another interview, do not silently destroy the existing session. Show a confirmation dialog explaining which interview is currently active."

### Result

The dialog displays:

```text
Active Interview in Progress

[Current Candidate]'s interview is currently active.

Starting [Target Candidate]'s interview will reset
[Current Candidate]'s current interview session.

Cancel
Continue Current Interview
Start Target Candidate
```

---

## Prompt 15.2 — Continue Interview

> **RECONSTRUCTED**
>
> "Add a Continue Interview action so an interviewer can return to an existing live session instead of restarting it."

### Result

The Atlas navigation state can show:

```text
Interview in progress
Candidate Name
Question X / 8
Time remaining
Continue
```

---

## Prompt 15.3 — Never Reset the Timer on Continue

> **RECONSTRUCTED**
>
> "Resuming an already-active interview must never reset the original 60-minute clock."

### Result

`resumeSession()` only restores a legacy paused state and never resets an already-active session's deadline.

---

# 16. Interview UI / Chat Experience

## Prompt 16.1 — Build the Live Interview Page

> **DOCUMENTED**
>
> "Build the React UI components for `src/pages/Interview.jsx` and `src/pages/Feedback.jsx`. Include an interactive chat interface, live 60-minute countdown clock, 7-competency Recharts radar score chart, executive feedback summary card, and single-click PDF export."

### Interview Interface Goals

- candidate context sidebar;
- Atlas interviewer identity;
- question counter;
- live timer;
- conversation history;
- answer input;
- submit state;
- typing/streaming effect;
- current curriculum day;
- current topic;
- difficulty context;
- code sandbox;
- responsive layout.

---

## Prompt 16.2 — Streaming Atlas Responses

> **RECONSTRUCTED**
>
> "Make Atlas responses feel live without requiring actual token streaming from every provider. Simulate natural word-by-word response streaming while preserving the final response exactly."

### Result

The interview page splits the response into words/whitespace and progressively renders them.

---

## Prompt 16.3 — Protect the Input While Busy

> **RECONSTRUCTED**
>
> "Prevent duplicate submissions while an answer is being processed. Disable sending during evaluation and restore the input after the response is complete."

---

# 17. Candidate Dashboard & Candidate Management

## Prompt 17.1 — Dashboard

> **RECONSTRUCTED**
>
> "Build an executive dashboard showing candidates ready for interview, readiness signals, active interview status, and navigation to candidate profiles."

### Dashboard Goals

- candidate count;
- readiness;
- candidate cards;
- active interview awareness;
- fast navigation.

---

## Prompt 17.2 — Candidate Profile

> **RECONSTRUCTED**
>
> "Create a candidate profile page showing candidate identity, role, cohort progress, strengths, weak topics, missions, and interview readiness without exposing interview answers before the interview."

---

## Prompt 17.3 — Candidate Selection

> **RECONSTRUCTED**
>
> "Create a dedicated candidate selection workflow where the interviewer can search, inspect, and start an interview for a specific candidate."

---

# 18. Technical Code Sandbox

## Prompt 18.1 — Add a Technical Scratchpad

> **RECONSTRUCTED**
>
> "Add a technical code sandbox to the interview interface. Support Python, JavaScript/Node, and SQL. Provide editable code, reset, copy, run/test feedback, and an option to attach the code to the candidate's answer."

### Supported Languages

```text
Python
JavaScript / Node
SQL
```

### Sandbox Actions

```text
Edit
Run Test
Copy
Reset
Attach Code to Answer
```

---

## Prompt 18.2 — Keep Sandbox Safe and Self-Contained

> **RECONSTRUCTED**
>
> "For the demo implementation, do not execute arbitrary user code on the host machine. Provide a deterministic mock execution/test result until a secure isolated execution service is connected."

### Result

The current sandbox uses simulated execution feedback rather than unsafe direct host execution.

---

# 19. Notifications & Session Lifecycle

## Prompt 19.1 — Add Interview Lifecycle Notifications

> **RECONSTRUCTED**
>
> "Create event-driven notifications for interview start, resume, completion, timeout, result generation, and manual ending. Deduplicate notifications by session and event type."

### Lifecycle Events

```text
STARTED
RESUMED
COMPLETED
EXPIRED
RESULT
ENDED
```

---

## Prompt 19.2 — Connect Notifications to Real Events

> **RECONSTRUCTED**
>
> "Do not generate fake notification activity on a timer. Notifications must be created from actual session lifecycle events."

### Result

Notifications are triggered from interview session operations.

---

# 20. Authentication & Protected Application Flow

## Prompt 20.1 — Protect Application Routes

> **RECONSTRUCTED**
>
> "Separate public landing/authentication routes from protected application routes. Users should authenticate before accessing dashboard, candidates, interviews, curriculum, feedback, or settings."

### Public Routes

```text
/
 /login
 /register
 /forgot-password
 /reset-password
 /oauth-consent
```

### Protected Routes

```text
/dashboard
/curriculum
/select
/candidate/:candidateId
/interview/:sessionId
/feedback/:sessionId
/settings
```

---

## Prompt 20.2 — Handle Authentication Loading

> **RECONSTRUCTED**
>
> "Do not render protected application content while authentication/public settings are still loading. Show a minimal loading state and route authentication errors appropriately."

---

# 21. Navigation, Atlas Control Center & UX

## Prompt 21.1 — Build a Persistent Top Navigation

> **RECONSTRUCTED**
>
> "Create a persistent top navigation containing Dashboard, Candidates, Curriculum, theme controls, notifications, import actions, search, and an Atlas live-interview control."

---

## Prompt 21.2 — Atlas Live State

> **RECONSTRUCTED**
>
> "The Atlas navigation control must reflect the actual latest interview state. It should distinguish Ready, Active, Paused/Legacy, and Completed."

### State Mapping

```text
No session       → Ready
Active session   → Interview in progress
Paused session   → Interview paused
Completed        → Interview completed
```

---

## Prompt 21.3 — Remove Confusing Actions

> **RECONSTRUCTED**
>
> "Keep the Atlas control focused on the interview state. Remove redundant or confusing actions from the Atlas icon/menu and keep continuation, report, end, and reset actions logically separated."

---

# 22. Import, Seed Data & Data Safety

## Prompt 22.1 — Candidate Import

> **RECONSTRUCTED**
>
> "Support importing candidate data from structured JSON/CSV-like data, normalize it into the internal candidate schema, merge it with existing candidates, and avoid duplicate candidate IDs."

---

## Prompt 22.2 — Seed Fallback Candidates

> **RECONSTRUCTED**
>
> "If no candidate data is available locally, automatically seed valid fallback candidates so the demo remains usable after a fresh deployment."

### Result

`ensureSeedData()`:

1. reads stored candidates;
2. normalizes seed candidates;
3. creates seed data if empty;
4. merges missing seed records;
5. persists the merged list.

---

## Prompt 22.3 — Remove Unwanted Sample Data

> **RECONSTRUCTED**
>
> "Prevent unwanted placeholder/sample identity data from appearing in the production candidate list. Apply the filtering at the normalization boundary so it cannot leak through different import paths."

### Result

The candidate normalization layer filters the blocked sample identity:

```text
utkarsh gupta
```

This is performed before candidates reach the main UI.

---

# 23. Feedback Report & Transcript

## Prompt 23.1 — Feedback Page

> **RECONSTRUCTED**
>
> "Create a polished final feedback page that clearly communicates interview completion, timeout status when applicable, executive summary, strengths, improvement areas, next steps, competency radar, and the complete interview timeline."

---

## Prompt 23.2 — Timeout Report

> **RECONSTRUCTED**
>
> "When the interview expires, preserve all answered questions and generate feedback from the available evaluation data. Clearly indicate that the interview ended automatically because the 60-minute limit was reached."

### Result

The feedback page displays:

```text
Time expired · Interview ended automatically
```

when:

```text
endedBy === "timeout"
```

---

## Prompt 23.3 — Transcript Export

> **RECONSTRUCTED**
>
> "Allow the completed report to be downloaded as a readable text artifact containing candidate name, session ID, summary, strengths, gaps, next steps, and the interview transcript."

### Result

The current supplied implementation generates a `.txt` report containing:

```text
INTERVIEW COMPLETE
SESSION
SUMMARY
STRENGTHS
AREAS TO IMPROVE
NEXT STEPS
TRANSCRIPT
```

---

# 24. Responsive / Dark-Light / Premium UI Refinement

## Prompt 24.1 — Premium Enterprise Visual System

> **RECONSTRUCTED**
>
> "Refine the application into a premium enterprise AI product rather than a basic student dashboard. Use clean spacing, strong typography, subtle borders, glass surfaces where appropriate, responsive layouts, consistent iconography, and restrained motion."

---

## Prompt 24.2 — Dark/Light Theme

> **RECONSTRUCTED**
>
> "Support both dark and light themes without duplicating component logic. Components should use semantic design tokens rather than hard-coded theme-specific colors."

### Result

The application includes:

```text
ThemeProvider
Dark mode
Light mode
Theme toggle
Semantic UI classes
```

---

## Prompt 24.3 — Responsive Interview Layout

> **RECONSTRUCTED**
>
> "On large screens use a candidate/context sidebar plus main interview workspace. On smaller screens stack the context and conversation areas while preserving the timer and answer controls."

---

# 25. GitHub Pages & Routing

## Prompt 25.1 — Fix GitHub Pages Routing

> **RECONSTRUCTED**
>
> "The application is deployed as a static Vite site on GitHub Pages. Prevent direct-route 404s and ensure navigation works from the deployed project subpath."

### Result

The application moved to:

```text
HashRouter
```

for static hosting compatibility.

A fallback `404.html` is also included.

---

## Prompt 25.2 — Configure Vite Base Path

> **RECONSTRUCTED**
>
> "Configure the Vite base path for the GitHub Pages project URL so assets resolve correctly when the app is served from `/Interview-Agent-AI/` rather than `/`."

### Result

The project deployment history includes a base-path fix for:

```text
/Interview-Agent-AI/
```

---

## Prompt 25.3 — Deployment Workflow

> **DOCUMENTED**
>
> "Push the repository to GitHub, configure GitHub Pages to use GitHub Actions, build the Vite application, and deploy the `dist` directory."

### Supported Deployment

```text
npm run build
npm run deploy
```

and GitHub Actions workflow support.

---

# 26. Build, Lint & Type Validation

## Prompt 26.1 — Validate Before Delivery

> **RECONSTRUCTED**
>
> "Before considering the application complete, run the project's build, lint, and type-check commands. Fix all blocking errors and verify that the production bundle is generated successfully."

### Validation Commands

```bash
npm run lint
npm run typecheck
npm run build
```

---

## Prompt 26.2 — Avoid Build-Only Success

> **RECONSTRUCTED**
>
> "A successful build is not enough. Verify the actual interview flow: candidate selection, start, answer submission, skip, gibberish, question progression, timeout, completion, feedback, and navigation."

---

# 27. Bug Fixing & Regression Prompts

## Prompt 27.1 — Fix Timer Drift

> **RECONSTRUCTED**
>
> "The timer must remain accurate after navigation, re-rendering, refresh, or returning to the interview. Replace decrement-only state logic with timestamp-based calculation."

### Fixed With

```text
interviewEndTime
```

rather than:

```text
remaining -= 1000
```

as the source of truth.

---

## Prompt 27.2 — Fix Interview Continuing in Background

> **RECONSTRUCTED**
>
> "If the user leaves the interview page, the interview must not silently stop respecting the deadline. Add a global expiry watcher to the top navigation."

---

## Prompt 27.3 — Fix Duplicate Active Sessions

> **RECONSTRUCTED**
>
> "Prevent a second active session from being created without confirmation. The UI must explicitly explain that starting another interview will replace the current live session."

---

## Prompt 27.4 — Fix Gibberish Advancing the Interview

> **RECONSTRUCTED**
>
> "Messages such as 'nice question', 'lol', or random filler must not advance the interview. Persist the message for the transcript but keep the same question active."

---

## Prompt 27.5 — Fix Skip Penalty

> **RECONSTRUCTED**
>
> "A skip should not be treated as a communication failure. Record it as skipped, lower future difficulty, and continue to the next topic."

---

## Prompt 27.6 — Fix Feedback After Timeout

> **RECONSTRUCTED**
>
> "Even if the candidate answers only part of the interview before time expires, feedback must still be generated from the evaluations already recorded."

---

## Prompt 27.7 — Fix Session State Across Components

> **RECONSTRUCTED**
>
> "Use one source of truth for session state. When the session changes, notify other components so the navigation, interview page, timer, notifications, and feedback page remain synchronized."

### Result

The application uses a session-change event mechanism to synchronize major UI surfaces.

---

# 28. Final Production Hardening

## Prompt 28.1 — Failure-Tolerant Interview Engine

> **RECONSTRUCTED**
>
> "The interview must remain usable if an external LLM fails. Treat LLM failure as a degraded mode, not a fatal application error."

---

## Prompt 28.2 — Preserve User Data During Errors

> **RECONSTRUCTED**
>
> "If answer processing fails, do not permanently lose the candidate's message. Restore the input state or remove only the optimistic message that could not be committed, and show a clear error."

---

## Prompt 28.3 — Avoid Hidden State Mutations

> **RECONSTRUCTED**
>
> "Every session mutation should update `updatedAt`, persist the session, and trigger the appropriate UI lifecycle event."

---

## Prompt 28.4 — Final UX Audit

> **RECONSTRUCTED**
>
> "Perform a complete UX audit of the application. Look for confusing labels, redundant actions, inaccessible controls, inconsistent spacing, broken mobile layouts, unclear active states, timer ambiguity, and dead-end navigation."

---

# 29. Final System Prompts Used by Atlas

This section records the most important dynamic prompt templates represented in the final interview engine.

---

## 29.1 Opening Question Prompt

```javascript
`You are Atlas, an expert AI Technical Interviewer.
Introduce yourself briefly to candidate ${candidate.name} (${candidate.jobRole}).
State that you will conduct an 8-question technical interview grounded
in their cohort curriculum.

Then ask Question 1 of 8 focusing on Day ${initialQ.day}
(${initialQ.topic}) at difficulty 5/10.

Formulate an engaging, practical technical opening question.`
```

---

## 29.2 Intent Classification Prompt

```javascript
`You are Atlas, an AI Technical Interviewer.

The current technical interview topic is: "${currentTopic}".
The candidate typed: "${userText}"

Analyze if this candidate response is:

1. GIBBERISH
   Random letters, filler words, "nice question", "ok", "hi",
   "lol", or completely off-topic banter.

2. SKIP
   Explicitly says "I don't know", "idk", "skip", "pass",
   "no idea", or equivalent.

3. VALID_ANSWER
   Contains technical thoughts, explanation, reasoning,
   implementation detail, or a genuine attempt to answer.

Reply strictly in valid JSON format:

{
  "category": "GIBBERISH" | "SKIP" | "VALID_ANSWER",
  "acknowledgment": "1 short friendly sentence reacting appropriately"
}`
```

---

## 29.3 Normal Answer Follow-Up Prompt

```text
You are Atlas, an expert AI Technical Interviewer.

Review the recent interview context and the candidate's latest
technical response.

Acknowledge the response in 1–2 concise sentences without revealing
hidden numerical scores.

Then transition to Question ${nextQNum} of 8.

The next topic is:
Day ${nextQ.day} — ${nextQ.topic}

Current difficulty:
${session.difficulty}/10

Ask a practical technical question that explores architecture,
implementation, reasoning, or engineering trade-offs.
```

---

## 29.4 Skip Follow-Up Prompt

```text
You are Atlas, an expert AI Technical Interviewer.

The candidate chose to skip or pass on the previous question.

Acknowledge the skip politely without shaming the candidate and
without unnecessarily praising the skip.

Then move to Question ${nextQNum} of 8.

Focus on:
Day ${nextQ.day} — ${nextQ.topic}

Difficulty:
${session.difficulty}/10

Ask a clear, practical technical question.
```

---

## 29.5 Gibberish Redirect Prompt

```text
You are Atlas, an AI Technical Interviewer.

The candidate has not provided a meaningful technical answer.

Do not advance the interview question counter.

Respond with one short, friendly sentence asking the candidate
to provide their technical reasoning for Question ${currentQNum}.
Do not provide the answer yourself.
```

---

## 29.6 Final Executive Report Prompt

```javascript
`You are Atlas, an expert AI Technical Interview Evaluator.

Review the complete 8-question technical interview transcript for
${candidate.name} (${candidate.jobRole}).

Synthesize a comprehensive executive evaluation report.

Return valid JSON:

{
  "summary": "2-3 sentence executive assessment",
  "strengths": [
    "3 key technical strengths observed"
  ],
  "gaps": [
    "2-3 specific knowledge or implementation gaps"
  ],
  "next": [
    "3 actionable learning recommendations"
  ],
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

# 30. Engineering Decisions & Trade-offs

## Decision 1 — 8 Primary Questions

**Why:**  
The specification explicitly requires an 8-question interview.

**Trade-off:**  
The system prioritizes breadth across curriculum topics over unlimited conversational depth.

---

## Decision 2 — One Global 60-Minute Clock

**Why:**  
A single interview-level deadline is easier to reason about and prevents candidates from receiving unlimited time simply because they navigate away from the page.

**Trade-off:**  
A difficult question does not automatically receive additional time.

---

## Decision 3 — Timestamp-Based Timing

**Why:**  
Intervals drift and can pause/throttle in browser environments.

**Trade-off:**  
The UI must continuously calculate remaining time from the stored deadline.

---

## Decision 4 — Deterministic Fallback Engine

**Why:**  
The demo should continue functioning without an external AI provider.

**Trade-off:**  
Fallback responses are less semantically rich than a production LLM.

---

## Decision 5 — Optional Gemini Integration

**Why:**  
Gemini can provide more natural classification and question generation.

**Trade-off:**  
External API availability, credentials, latency, quota, and malformed output must be handled.

---

## Decision 6 — Candidate-Aware Questions

**Why:**  
A candidate should be assessed on material they actually encountered in the curriculum.

**Trade-off:**  
Question generation depends on the quality and completeness of candidate mission data.

---

## Decision 7 — Gibberish Does Not Consume a Question

**Why:**  
A filler message is not evidence of technical performance.

**Trade-off:**  
A candidate could technically send repeated filler, so the system must still enforce the global timer.

---

## Decision 8 — Skip Lowers Difficulty

**Why:**  
The interviewer should adapt to demonstrated uncertainty instead of repeatedly asking questions that are clearly too difficult.

**Trade-off:**  
Skipping can lower subsequent question difficulty even when the candidate could have answered another topic well.

---

## Decision 9 — Single Active Session

**Why:**  
It prevents ambiguous ownership of the global timer and avoids two live interviews competing for the same interviewer interface.

**Trade-off:**  
The interviewer must explicitly finish/replace the current session before starting another.

---

## Decision 10 — Static-Friendly Routing

**Why:**  
GitHub Pages is a static hosting platform and does not provide arbitrary server-side route handling.

**Trade-off:**  
Hash-based routing is less aesthetically clean than traditional browser history routing.

---

# 31. Implementation Evidence Map

The following map connects the AI-assisted design decisions to the supplied repository.

| Capability | Evidence in repository |
|---|---|
| Interview engine | `src/lib/interviewApi.js` |
| Candidate normalization | `src/lib/candidateData.js` |
| Candidate persistence | `src/lib/apiClient.js` |
| Seed data | `src/lib/seedCandidates.js` |
| Timer | `src/hooks/useInterviewTimer.js` |
| Interview timer UI | `src/components/InterviewTimer.jsx` |
| Interview starter | `src/hooks/useInterviewStarter.js` |
| Live interview UI | `src/pages/Interview.jsx` |
| Feedback UI | `src/pages/Feedback.jsx` |
| Competency radar | `src/components/RadarScore.jsx` |
| Code sandbox | `src/components/CodeSandbox.jsx` |
| Active interview switching | `src/components/InterviewSwitchDialog.jsx` |
| Persistent Atlas state | `src/components/TopNav.jsx` |
| Notifications | `src/lib/notifications.js` |
| Dashboard | `src/pages/Dashboard.jsx` |
| Candidate profile | `src/pages/CandidateProfile.jsx` |
| Candidate selection | `src/pages/SelectCandidate.jsx` |
| Curriculum | `src/pages/Curriculum.jsx` |
| Authentication | `src/lib/AuthContext.jsx` |
| Protected routing | `src/components/ProtectedRoute.jsx` |
| Application routes | `src/App.jsx` |
| Deployment configuration | `vite.config.js`, workflow/template files |
| Curriculum source | `hackethon document/curriculum.json` |
| Candidate source | `hackethon document/candidates.json` |
| Technical specification | `hackethon document/technical-spec.md` |

---

# 32. Final AI-Assisted Development Summary

## 32.1 Development Lifecycle

The complete AI-assisted construction can be represented as:

```text
REQUIREMENTS
     ↓
SPEC ANALYSIS
     ↓
ARCHITECTURE
     ↓
DATA MODEL
     ↓
CANDIDATE NORMALIZATION
     ↓
SESSION STATE MACHINE
     ↓
QUESTION BANK
     ↓
ADAPTIVE ENGINE
     ↓
ATLAS PERSONA
     ↓
INTENT CLASSIFICATION
     ↓
ANSWER EVALUATION
     ↓
LLM INTEGRATION
     ↓
FEEDBACK ENGINE
     ↓
GLOBAL TIMER
     ↓
INTERVIEW UI
     ↓
CODE SANDBOX
     ↓
CANDIDATE MANAGEMENT
     ↓
AUTHENTICATION
     ↓
NOTIFICATIONS
     ↓
SINGLE-SESSION SAFETY
     ↓
RESPONSIVE UI
     ↓
DEPLOYMENT
     ↓
BUG FIXES
     ↓
REGRESSION TESTING
     ↓
PRODUCTION HARDENING
```

---

## 32.2 AI Engineering Responsibilities

AI coding assistants were used as an engineering accelerator across:

### Planning

- requirements decomposition;
- architecture design;
- state-machine planning;
- data-model design;
- API-contract analysis.

### Backend / Engine Logic

- session state;
- question progression;
- adaptive difficulty;
- response classification;
- feedback generation;
- timer enforcement;
- fallback behavior.

### Frontend

- React pages;
- reusable components;
- interview chat;
- timer UI;
- candidate cards;
- feedback visualization;
- navigation;
- dialogs;
- notifications.

### AI Integration

- Atlas system prompts;
- intent classification;
- structured evaluation;
- final report synthesis;
- fallback strategy.

### Quality

- build debugging;
- routing fixes;
- timer regression fixes;
- active-session fixes;
- state synchronization;
- responsive UI refinement.

### Deployment

- Vite configuration;
- GitHub Pages base path;
- HashRouter migration;
- 404 fallback;
- deployment workflow;
- production build validation.

---

## 32.3 Key Technologies

```text
Frontend
--------
React 18
Vite
React Router
Tailwind CSS
Radix UI
Framer Motion
Recharts
Lucide React

Application Logic
-----------------
JavaScript / JSX
Local persistence layer
Session state machine
Candidate normalization
Adaptive question engine
Notification event system

AI
--
Atlas interviewer persona
Gemini 1.5 Flash integration path
Deterministic heuristic fallback
Structured JSON evaluation
Intent classification

Assessment
----------
8-question interview
4+ curriculum days
1–10 adaptive difficulty
7 competency dimensions
Executive feedback
Transcript

Developer Experience
--------------------
ESLint
TypeScript/jsconfig checking
Vite production build
Git
GitHub
GitHub Pages

Deployment
----------
Static Vite build
HashRouter
GitHub Pages
```

---

# Appendix A — Core Interview Data Contract

A typical live session follows this conceptual structure:

```json
{
  "sessionId": "unique-session-id",
  "candidate": {
    "candidateId": "candidate-id",
    "name": "Candidate",
    "jobRole": "AI Engineer"
  },
  "status": "active",
  "messages": [],
  "currentDay": 1,
  "currentTopic": "VS Code & Python Environment Setup",
  "difficulty": 5,
  "coveredDays": [1],
  "targetQuestions": 8,
  "questionNumber": 1,
  "evaluations": [],
  "feedback": null,
  "interviewStartedAt": "ISO_TIMESTAMP",
  "interviewEndTime": "ISO_TIMESTAMP",
  "endedBy": null
}
```

---

# Appendix B — Interview Evaluation Contract

```json
{
  "technicalCorrectness": 8,
  "depth": 7,
  "reasoning": 8,
  "communication": 9,
  "skipped": false,
  "newDifficulty": 6
}
```

---

# Appendix C — Feedback Contract

```json
{
  "summary": "Executive assessment",
  "strengths": [
    "Technical strength",
    "Architecture strength",
    "Communication strength"
  ],
  "gaps": [
    "Knowledge gap",
    "Implementation gap"
  ],
  "next": [
    "Actionable recommendation",
    "Practice recommendation",
    "Production recommendation"
  ],
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
}
```

---

# Appendix D — Interview State Rules

```text
RULE 01
A session starts with Question 1 of 8.

RULE 02
The interview has one global 60-minute timer.

RULE 03
The timer is derived from the absolute end timestamp.

RULE 04
GIBBERISH does not advance the question number.

RULE 05
SKIP advances to the next technical question.

RULE 06
SKIP lowers difficulty by approximately two levels.

RULE 07
Difficulty remains bounded between 1 and 10.

RULE 08
A valid answer is evaluated and advances the interview.

RULE 09
Question 8 completes the interview.

RULE 10
Timeout completes the interview automatically.

RULE 11
Timeout feedback uses only evaluations already collected.

RULE 12
Only one active/paused live session is allowed.

RULE 13
Starting another live interview requires an explicit replacement flow.

RULE 14
Continue must not reset an active session's original timer.

RULE 15
All session changes must persist.

RULE 16
External LLM failure must not destroy the interview.

RULE 17
The final report contains strengths, gaps, next steps, and competency scores.

RULE 18
The transcript remains available after completion.
```

---

# Appendix E — Suggested Future Production Prompts

These are intentionally documented as **future engineering prompts**, not claims about functionality already present.

## Future Prompt E.1 — Secure Server-Side Sessions

> "Move interview session state from browser persistence to a server-side session store backed by Redis or a relational database. Make the server authoritative for session ownership, candidate authorization, timer enforcement, and completion state."

## Future Prompt E.2 — Secure LLM Gateway

> "Move all LLM API calls behind a server-side gateway. Never expose provider secrets in browser JavaScript or client-visible environment variables."

## Future Prompt E.3 — Real Code Execution

> "Replace the demo code sandbox with an isolated execution service using containers or a secure code runner. Enforce CPU, memory, runtime, filesystem, network, and process limits."

## Future Prompt E.4 — Evaluation Observability

> "Add structured logs and metrics for interview latency, model errors, classification failures, question completion rate, timeout rate, and feedback-generation failures without logging unnecessary candidate-sensitive content."

## Future Prompt E.5 — Persistent Audit Trail

> "Create an append-only audit trail for session creation, question delivery, candidate response, evaluation, completion, timeout, and report generation. Include timestamps and immutable event IDs."

## Future Prompt E.6 — Human Review

> "Add an interviewer review workflow where a human can inspect the transcript, adjust competency scores, add notes, and approve the final report without overwriting the original AI evaluation."

## Future Prompt E.7 — Evaluation Benchmark

> "Create a benchmark set of labeled technical answers and measure intent-classification precision/recall, scoring consistency, difficulty adaptation, and feedback quality across multiple LLM providers."

---

# Appendix F — Final Verification Checklist

```text
[ ] Repository analyzed before changes
[ ] Technical specification reviewed
[ ] Candidate schema normalized
[ ] Curriculum schema understood
[ ] Candidate readiness calculated
[ ] Interview session created
[ ] Session ID persisted
[ ] 8-question target enforced
[ ] 4+ curriculum days covered
[ ] Candidate-specific topics supported
[ ] Question difficulty tracked
[ ] VALID_ANSWER detected
[ ] SKIP detected
[ ] GIBBERISH detected
[ ] Gibberish does not advance question number
[ ] Skip does not unfairly penalize communication
[ ] Difficulty adapts
[ ] Difficulty bounded 1–10
[ ] Gemini integration optional
[ ] LLM fallback available
[ ] Structured JSON parsing protected
[ ] 60-minute timer implemented
[ ] Timer based on absolute timestamp
[ ] Background/global expiry supported
[ ] Timeout feedback generated
[ ] Single live session enforced
[ ] Continue interview supported
[ ] Replacement confirmation supported
[ ] Atlas navigation state synchronized
[ ] Candidate dashboard implemented
[ ] Candidate profile implemented
[ ] Code sandbox implemented
[ ] Feedback report implemented
[ ] 7-competency radar implemented
[ ] Transcript preserved
[ ] Report download implemented
[ ] Notifications connected to lifecycle events
[ ] Authentication flow protected
[ ] Dark/light theme supported
[ ] Responsive UI considered
[ ] GitHub Pages routing handled
[ ] Vite base path handled
[ ] Production build checked
[ ] Lint checked
[ ] Type checking checked
[ ] Deployment path verified
```

---

# Final Note

This `PROMPTS.md` is intended to document the **engineering reasoning and AI-assisted construction history** of the Enterprise AI Interview Agent from initial requirements through the final deployed application.

The most important distinction in this document is between:

- **DOCUMENTED** — prompt wording already present in the previously supplied prompt-history material;
- **RECONSTRUCTED** — prompt wording recreated from the supplied repository's implementation, architecture, UI behavior, commit history, and existing documentation;
- **FUTURE** — proposed production improvements that are not represented as completed functionality.

This distinction keeps the document useful as an AI-assisted engineering record without claiming that reconstructed prompts are verbatim historical chat logs.

---

*End of `PROMPTS.md` — Enterprise AI Interview Agent*
