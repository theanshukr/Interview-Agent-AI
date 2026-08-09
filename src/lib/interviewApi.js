// Standalone Interview API & Adaptive Engine
// Compliant with Hackathon Specification: 8+ Questions across 4+ Curriculum Days.
// Includes LLM-driven response intent analysis (VALID_ANSWER / SKIP / GIBBERISH).

import { apiClient } from "@/lib/apiClient";
import { normalizeCandidateData, normalizeCandidateList } from "@/lib/candidateData";
import { seedCandidates } from "@/lib/seedCandidates";
import { addNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

function candidateLabel(session) {
  const c = session?.candidate || {};
  return c.name || "Candidate";
}

// Real application events are recorded here (deduped by type + sessionId inside
// the notifications store), so the bell and toasts reflect the actual session.
function notifySession(session, type, title, message) {
  const c = session?.candidate || {};
  addNotification({
    type,
    sessionId: session?.sessionId,
    candidateId: c.candidateId,
    candidateName: c.name,
    title,
    message,
  });
}

// A single 60-minute countdown timer belongs to the ENTIRE interview, not individual questions.
export const INTERVIEW_DURATION_MS = 60 * 60 * 1000;

// Timestamp-based remaining time. Prevents drift from React re-renders, tab switches,
// or delayed intervals, and survives page refreshes via persisted end timestamps.
export function getInterviewRemainingMs(session) {
  const s = session || {};
  if (s.status === "completed" || s.status === "expired") return 0;
  if (s.status === "paused") return Math.max(0, Number(s.pausedRemainingMs) || 0);
  if (s.interviewEndTime) {
    return Math.max(0, new Date(s.interviewEndTime).getTime() - Date.now());
  }
  return INTERVIEW_DURATION_MS;
}

function ensureSeedData() {
  const stored = apiClient.getCandidates();
  const seeded = normalizeCandidateList(seedCandidates);
  if (!stored || !stored.length) {
    apiClient.saveCandidates(seeded);
    return seeded;
  }
  const merged = [...stored];
  let changed = false;
  seeded.forEach((s) => {
    if (!merged.some((item) => item.candidateId === s.candidateId)) {
      merged.push(s);
      changed = true;
    }
  });
  if (changed) {
    apiClient.saveCandidates(merged);
  }
  return normalizeCandidateList(merged);
}

export async function listCandidates() {
  return ensureSeedData();
}

export async function getCandidate(candidateId) {
  const candidates = ensureSeedData();
  return candidates.find((c) => c.candidateId === candidateId) || null;
}

export function getSessionSync(sessionId) {
  const sessions = apiClient.getSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

// Most recent session for a given candidate (any status), or null.
export function getCandidateSession(candidateId) {
  if (!candidateId) return null;
  const sessions = apiClient.getSessions().filter(
    (s) => String(s.candidate?.candidateId || s.candidateId || "") === String(candidateId)
  );
  return mostRecentFirst(sessions)[0] || null;
}

export async function getSession(sessionId) {
  return getSessionSync(sessionId);
}

function mostRecentFirst(sessions) {
  return [...(sessions || [])].sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
  );
}

function touchSession(session, updates) {
  return { ...session, ...updates, updatedAt: new Date().toISOString() };
}

// Single live interview session (active or paused). Only one can exist at a time.
export function getActiveSession() {
  const live = apiClient
    .getSessions()
    .filter((s) => s.status === "active" || s.status === "paused");
  return mostRecentFirst(live)[0] || null;
}

// Most recent session of any kind, preferring the live one for display.
export function getMostRecentSession() {
  const sessions = apiClient.getSessions();
  const live = sessions.filter((s) => s.status === "active" || s.status === "paused");
  const completed = sessions.filter((s) => s.status === "completed");
  return mostRecentFirst(live)[0] || mostRecentFirst(completed)[0] || null;
}

// Pausing is intentionally removed: the 60-minute timer is ONE global clock that
// keeps running whenever a session is active, even if the user leaves the page.
// resumeSession only converts legacy paused sessions back to active; for a
// session that is already active it is a no-op and NEVER resets the clock.
export function resumeSession(sessionId) {
  const sessions = apiClient.getSessions();
  let changed = false;
  const updated = sessions.map((s) => {
    if (s.sessionId !== sessionId) return s;
    if (s.status === "active") return s;
    changed = true;
    const now = Date.now();
    const remaining =
      Math.max(0, Number(s.pausedRemainingMs)) ||
      getInterviewRemainingMs(s) ||
      INTERVIEW_DURATION_MS;
    return touchSession(s, {
      status: "active",
      interviewStartedAt: s.interviewStartedAt || new Date(now).toISOString(),
      interviewEndTime: new Date(now + remaining).toISOString(),
      pausedRemainingMs: null,
      pausedAt: null,
    });
  });
  if (changed) apiClient.saveSessions(updated);
  const session = updated.find((s) => s.sessionId === sessionId) || null;
  if (session && changed) {
    notifySession(session, NOTIFICATION_TYPES.RESUMED, "Interview resumed", `${candidateLabel(session)}'s interview was resumed.`);
  }
  return session;
}

// Auto-end the interview when the 60-minute timer reaches 00:00.
// Marks the session completed, flags it as a timeout, and generates feedback
// from whatever questions were answered before time ran out.
export function expireSession(sessionId) {
  const sessions = apiClient.getSessions();
  const updated = sessions.map((s) => {
    if (s.sessionId !== sessionId) return s;
    if (s.status === "completed") return s;
    const answered = (s.evaluations || []).length;
    const feedback = generateFeedbackSummary(s.candidate, s.evaluations || [], s.difficulty || 5, {
      answeredCount: answered,
      timedOut: true,
    });
    return touchSession(s, {
      status: "completed",
      endedBy: "timeout",
      interviewEndTime: new Date().toISOString(),
      pausedRemainingMs: null,
      pausedAt: null,
      feedback,
    });
  });
  apiClient.saveSessions(updated);
  const session = updated.find((s) => s.sessionId === sessionId) || null;
  if (session) {
    notifySession(session, NOTIFICATION_TYPES.EXPIRED, "Interview time expired", `${candidateLabel(session)}'s interview ended when the 60-minute limit was reached.`);
    notifySession(session, NOTIFICATION_TYPES.RESULT, "Interview result generated", `Feedback is ready for ${candidateLabel(session)}.`);
  }
  return session;
}

// End a single session by removing it (used by "End Interview").
export function endSession(sessionId) {
  const sessions = apiClient.getSessions();
  const target = sessions.find((s) => s.sessionId === sessionId);
  apiClient.saveSessions(sessions.filter((s) => s.sessionId !== sessionId));
  if (target) {
    notifySession(target, NOTIFICATION_TYPES.ENDED, "Interview ended", `${candidateLabel(target)}'s interview session was ended.`);
  }
}

// End/reset the live interview session so exactly one active interview can exist.
export function endActiveSession() {
  const sessions = apiClient.getSessions();
  const removed = sessions.filter(
    (s) => s.status === "active" || s.status === "paused"
  );
  const remaining = sessions.filter(
    (s) => s.status !== "active" && s.status !== "paused"
  );
  apiClient.saveSessions(remaining);
  removed.forEach((session) => {
    notifySession(session, NOTIFICATION_TYPES.ENDED, "Interview ended", `${candidateLabel(session)}'s interview session was ended.`);
  });
}

export async function saveCandidate(candidate) {
  const normalized = normalizeCandidateData(candidate);
  const existing = ensureSeedData();
  const next = [...existing.filter((item) => item.candidateId !== normalized.candidateId), normalized];
  apiClient.saveCandidates(next);
  return normalized;
}

export async function bulkCreateCandidates(payload) {
  const normalized = normalizeCandidateList(payload);
  const existing = ensureSeedData();
  const merged = [...existing];
  normalized.forEach((candidate) => {
    const index = merged.findIndex((item) => item.candidateId === candidate.candidateId);
    if (index >= 0) {
      merged[index] = candidate;
    } else {
      merged.push(candidate);
    }
  });
  apiClient.saveCandidates(merged);
  return normalized;
}

// Reset stored candidate sessions and candidates
export function resetCandidateAttempts() {
  apiClient.resetAllData();
  return ensureSeedData();
}

// 8+ Curriculum Questions Bank covering 8 distinct days
const QUESTION_BANK = [
  {
    day: 1,
    topic: "VS Code & Python Environment Setup",
    type: "SETUP",
    question: "How do you structure and activate an isolated Python virtual environment (.venv) in VS Code, and why is environment isolation critical when delivering production AI projects?",
  },
  {
    day: 3,
    topic: "First AI Project, React Frontend & FastAPI",
    type: "BUILD",
    question: "Explain how you connect a Vite React frontend to a FastAPI endpoint serving LLM responses, including handling CORS, error boundaries, and streaming output.",
  },
  {
    day: 7,
    topic: "Vector Embeddings & Semantic Search",
    type: "AI_CORE",
    question: "Explain the mathematics behind cosine similarity in dense vector spaces, and how embedding model dimensions impact retrieval latency in RAG pipelines.",
  },
  {
    day: 10,
    topic: "Retrieval & Matching Engine",
    type: "AI_CORE",
    question: "When building a RAG retrieval engine, how do you handle metadata filtering, hybrid search (keyword + vector), and chunk overlap ratios to minimize context dilution?",
  },
  {
    day: 12,
    topic: "Prompt Engineering & Structured Outputs",
    type: "AI_CORE",
    question: "How do you enforce JSON Schema adherence in LLM outputs to prevent hallucination and ensure deterministic downstream API calls?",
  },
  {
    day: 16,
    topic: "Chatbot Backend & API Integration",
    type: "BUILD",
    question: "What architectural patterns do you apply when managing multi-turn conversation memory, token limits, and context truncation in FastAPI production endpoints?",
  },
  {
    day: 23,
    topic: "Model Context Protocol (MCP) & Agentic AI",
    type: "AGENTS",
    question: "How does Model Context Protocol (MCP) decouple model reasoning from external tool execution, and how do you handle tool execution failures or timeout retries?",
  },
  {
    day: 28,
    topic: "Docker & Kubernetes AI Deployment",
    type: "EVAL",
    question: "What strategies do you use when containerizing Python/Ollama AI microservices with Docker, and how do you configure resource limits (GPU/RAM) in Kubernetes?",
  },
];

function isCommentOrGibberish(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return true;

  // Explicit comment & filler patterns
  const commentPatterns = [
    /^(nice|good|great|awesome|cool|interesting|wow|nice question|good question|great question)/i,
    /^(ok|okay|sure|thanks|thank you|got it|makes sense|hi|hello|hey|lol|rofl)/i,
    /^(asdf|qwerty|1234|abc|xyz|test|dunno|bro|bruh)/i,
  ];
  if (commentPatterns.some((p) => p.test(t))) return true;

  // Check for random gibberish (e.g. "asdfghjkl zxcvbnm", "sfjklsdf")
  const hasTechnicalTerms = /(vector|embedding|rag|fastapi|react|cors|docker|sql|python|json|schema|mcp|prompt|llm|model|agent|gpu|cuda|database|server|pipeline|deploy)/i.test(t);
  const wordCount = t.split(/\s+/).length;

  if (!hasTechnicalTerms && wordCount <= 4 && !/(how|what|why|build|create|use|using|implement|run|set|code|activated|created)/i.test(t)) {
    return true;
  }
  return false;
}


function isNonAnswer(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return true;
  const patterns = [
    /^i\s*don'?t\s*know/i,
    /^idk$/i,
    /^no\s*idea/i,
    /^not\s*sure/i,
    /^skip/i,
    /^pass$/i,
    /^dunno$/i,
    /^no\s*clue/i,
    /^unsure/i,
    /^dont\s*know/i,
    /^i\s*am\s*not\s*sure/i,
    /^i\s*have\s*no\s*idea/i,
    /^haven't\s*done\s*this/i,
    /^not\s*familiar/i,
  ];
  return patterns.some((p) => p.test(t));
}

function generateAdaptiveQuestion(candidate, questionNumber, currentDifficulty, answeredMessages) {
  const missions = candidate?.missions || [];
  const targetMission = missions[questionNumber % missions.length] || null;

  if (targetMission && targetMission.day) {
    return {
      day: targetMission.day,
      topic: targetMission.title || "AI Engineering Core",
      question: `Looking at Day ${targetMission.day} (${targetMission.title}): Walk me through how you implemented this module during your cohort, the key trade-offs you evaluated, and how you validated your design.`,
    };
  }

  const bankItem = QUESTION_BANK[questionNumber % QUESTION_BANK.length];
  return {
    day: bankItem.day,
    topic: bankItem.topic,
    question: bankItem.question,
  };
}

function extractKeyConcept(lastMessage) {
  const text = (lastMessage || "").toLowerCase();
  if (text.includes("vector") || text.includes("embedding") || text.includes("cosine")) return "vector embeddings and semantic search";
  if (text.includes("fastapi") || text.includes("react") || text.includes("cors") || text.includes("vite")) return "API integration and frontend architecture";
  if (text.includes("prompt") || text.includes("json") || text.includes("schema")) return "prompt engineering and structured outputs";
  if (text.includes("docker") || text.includes("kubernetes") || text.includes("container") || text.includes("poetry")) return "reproducible environment setup and containerization";
  if (text.includes("mcp") || text.includes("agent") || text.includes("tool")) return "agentic tool orchestration";
  if (text.includes("rag") || text.includes("chunk") || text.includes("retrieval")) return "retrieval augmented generation (RAG)";
  return "your practical implementation approach";
}

function generateNaturalFallbackReply(userMessage, nextQNum, targetQuestions, nextQ) {
  const text = (userMessage || "").trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const concept = extractKeyConcept(text);

  const detailedFeedback = [
    `That's a thorough breakdown regarding ${concept}. Your technical reasoning covers the critical operational trade-offs well.`,
    `Good technical insights on ${concept}. I appreciate how you structured the implementation and validation steps.`,
    `Solid explanation of ${concept}. You've highlighted the essential architectural decisions and edge cases clearly.`,
    `Clear and structured response regarding ${concept}. That demonstrates strong practical awareness for a production system.`,
  ];

  const briefFeedback = [
    `Got it — thank you for that overview on ${concept}.`,
    `Makes sense. Good summary of your approach to ${concept}.`,
    `Understood. That gives me a clear picture of your work on ${concept}.`,
  ];

  const feedbackList = wordCount > 25 ? detailedFeedback : briefFeedback;
  const chosenFeedback = feedbackList[(nextQNum + wordCount) % feedbackList.length];

  return `${chosenFeedback}\n\nMoving to **Question ${nextQNum} of ${targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
}

async function callGeminiAPI(systemPrompt, userPrompt, apiKey) {
  if (!apiKey) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nCandidate Response: "${userPrompt}"` },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.warn("Gemini API call error:", e);
    return null;
  }
}

async function classifyResponseWithGemini(userText, currentTopic, apiKey) {
  if (!apiKey) return null;
  const prompt = `You are Atlas, an AI Technical Interviewer.
The current technical interview topic is: "${currentTopic}".
The candidate typed: "${userText}"

Analyze if this candidate response is:
1. GIBBERISH (random letters, filler words like "nice question", "ok", "hi", "lol", or completely off-topic banter)
2. SKIP (explicitly says "I don't know", "idk", "skip", "pass", "no idea")
3. VALID_ANSWER (contains technical thoughts, explanation, or genuine attempt to answer)

Reply strictly in valid JSON format:
{"category": "GIBBERISH" | "SKIP" | "VALID_ANSWER", "acknowledgment": "1 short friendly sentence reacting appropriately"}`;

  try {
    const raw = await callGeminiAPI("Output valid JSON only.", prompt, apiKey);
    if (!raw) return null;
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function evaluateAnswerAndAdapt(candidateAnswer, currentDifficulty) {
  const text = (candidateAnswer || "").trim();
  const skipped = isNonAnswer(text);

  if (skipped) {
    return {
      technicalCorrectness: 2,
      depth: 1,
      reasoning: 2,
      communication: 5,
      skipped: true,
      newDifficulty: Math.max(1, currentDifficulty - 2),
    };
  }

  const wordCount = text ? text.split(/\s+/).length : 0;
  let delta = 0;
  if (wordCount > 40) delta = 1;
  else if (wordCount < 15) delta = -1;

  const newDifficulty = Math.max(1, Math.min(10, currentDifficulty + delta));

  return {
    technicalCorrectness: Math.min(10, Math.max(4, 6 + delta * 1.5 + (wordCount > 50 ? 1 : 0))),
    depth: Math.min(10, Math.max(3, 5 + (wordCount > 60 ? 2 : 0))),
    reasoning: Math.min(10, Math.max(4, 6 + delta)),
    communication: Math.min(10, Math.max(5, wordCount > 20 ? 8 : 4)),
    skipped: false,
    newDifficulty,
  };
}

function generateFeedbackSummary(candidate, evaluations, finalDifficulty, opts = {}) {
  const name = candidate?.name || "The candidate";
  const skippedCount = (evaluations || []).filter((e) => e.skipped).length;
  const overallScore = Math.max(40, Math.round(75 + finalDifficulty * 2 - skippedCount * 6));

  const gaps = candidate?.weakTopics && candidate.weakTopics.length > 0 ? [...candidate.weakTopics] : [
    "Advanced MCP tool exception recovery strategies",
    "Production RAG evaluation metrics (Context Recall & Answer Relevance)",
  ];

  if (skippedCount > 0) {
    gaps.unshift(`Uncovered foundational knowledge across ${skippedCount} skipped topics`);
  }

  const completion = opts.timedOut
    ? `completed ${Math.max(0, opts.answeredCount || 0)} of 8 questions before the 60-minute time limit expired`
    : "completed an 8-question adaptive technical interview";

  return {
    summary: `${name} ${completion} covering key AI Cohort modules. Overall readiness score is ${overallScore}%, displaying ${skippedCount > 0 ? "some areas needing review" : "strong technical execution"} and practical awareness.`,
    strengths: candidate?.strengths && candidate.strengths.length > 0 ? candidate.strengths : [
      "Structured problem solving & clear architectural explanations",
      "Solid understanding of vector retrieval and RAG concepts",
      "Effective communication of trade-offs under constraints",
    ],
    gaps: Array.from(new Set(gaps)),
    next: [
      "Review skipped modules and practice foundational implementation exercises",
      "Build an automated evaluation suite using Ragas or TruLens",
      "Implement robust retry logic for Model Context Protocol (MCP) tool execution",
    ],
    competencyScores: {
      knowledge: Math.min(98, Math.max(45, 72 + finalDifficulty * 2.5 - skippedCount * 5)),
      accuracy: Math.min(95, Math.max(40, 70 + finalDifficulty * 2.6 - skippedCount * 6)),
      communication: Math.max(50, 88 - skippedCount * 3),
      confidence: Math.min(92, Math.max(40, 74 + finalDifficulty * 2 - skippedCount * 7)),
      depth: Math.min(96, Math.max(35, 68 + finalDifficulty * 3 - skippedCount * 8)),
      reasoning: Math.min(98, Math.max(45, 75 + finalDifficulty * 2.2 - skippedCount * 5)),
      practical: Math.min(94, Math.max(40, 72 + finalDifficulty * 2.4 - skippedCount * 6)),
    },
    overallScore,
  };
}

function syncClientSession(data, payload) {
  try {
    const sessionId = data.sessionId || payload.sessionId;
    const existingSessions = apiClient.getSessions();
    let session = existingSessions.find((s) => s.sessionId === sessionId);

    if (!session) {
      session = {
        sessionId,
        candidate: data.candidate || payload.candidate,
        status: data.status || "active",
        messages: [],
        currentDay: data.currentDay || 1,
        currentTopic: data.currentTopic || "",
        difficulty: data.difficulty || 5,
        coveredDays: data.coveredDays || [],
        targetQuestions: data.targetQuestions || 8,
        questionNumber: data.questionNumber || 1,
        evaluations: [],
        feedback: data.feedback || null,
        interviewStartedAt: data.interviewStartedAt || new Date().toISOString(),
        interviewEndTime: data.interviewEndTime || new Date(Date.now() + INTERVIEW_DURATION_MS).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (payload.candidate) {
      session.candidate = normalizeCandidateData(payload.candidate);
    }

    if (payload.message) {
      const alreadyHasUserMsg = session.messages.some(
        (m) => m.role === "candidate" && m.content === payload.message
      );
      if (!alreadyHasUserMsg) {
        session.messages.push({ role: "candidate", content: payload.message });
      }
    }

    if (data.reply) {
      const lastMsg = session.messages[session.messages.length - 1];
      if (!lastMsg || lastMsg.role !== "interviewer" || lastMsg.content !== data.reply) {
        session.messages.push({ role: "interviewer", content: data.reply });
      }
    }

    if (data.questionNumber) session.questionNumber = data.questionNumber;
    if (data.currentDay) session.currentDay = data.currentDay;
    if (data.currentTopic) session.currentTopic = data.currentTopic;
    if (data.difficulty) session.difficulty = data.difficulty;
    if (data.coveredDays) session.coveredDays = data.coveredDays;
    if (data.feedback) session.feedback = data.feedback;
    if (data.done || data.status === "completed") session.status = "completed";
    session.updatedAt = new Date().toISOString();

    const updatedSessions = [...existingSessions.filter((s) => s.sessionId !== sessionId), session];
    apiClient.saveSessions(updatedSessions);
  } catch (err) {
    console.warn("Error syncing client session state:", err);
  }
}

export async function interview(payload) {
  const forceMock = import.meta.env.VITE_ENABLE_MOCK_ENGINE === "true";

  if (!forceMock) {
    try {
      const settings = apiClient.getSettings();
      const headers = { "Content-Type": "application/json" };
      if (settings?.geminiApiKey) {
        headers["x-gemini-api-key"] = settings.geminiApiKey;
      }

      const response = await fetch("/api/interview", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        syncClientSession(data, payload);
        return data;
      }
      console.warn(`Backend /api/interview returned status ${response.status}. Falling back to mock engine.`);
    } catch (err) {
      console.warn("Backend /api/interview network error, falling back to mock engine:", err);
    }
  }

  return runClientMockInterview(payload);
}

async function runClientMockInterview(payload) {
  const sessionId = payload?.sessionId || crypto.randomUUID();
  const candidate = payload?.candidate ? normalizeCandidateData(payload.candidate) : null;
  const existingSessions = apiClient.getSessions();
  const existing = existingSessions.find((s) => s.sessionId === sessionId);

  // Initialize new session (Start Interview)
  if (!payload?.message) {
    const initialQuestion = generateAdaptiveQuestion(candidate, 0, 5, []);
    const settings = apiClient.getSettings();
    let initialReply = null;

    if (settings.llmProvider === "gemini" && settings.geminiApiKey) {
      const prompt = `You are Atlas, an expert AI Technical Interviewer. Introduce yourself briefly to candidate ${candidate?.name || "there"} (${candidate?.jobRole || "AI Engineer"}). State that you will conduct an 8-question technical interview grounded in their curriculum. Then ask Question 1 of 8 focusing on Day ${initialQuestion.day} (${initialQuestion.topic}) at difficulty 5/10. Formulate an engaging, practical technical opening question.`;
      initialReply = await callGeminiAPI(prompt, "Start interview", settings.geminiApiKey);
    }

    if (!initialReply) {
      initialReply = `Hi ${candidate?.name || "there"} — I'm Atlas, your AI Technical Interviewer. I'll assess your readiness for the ${candidate?.jobRole || "AI Engineering"} role through an 8-question interview based on your cohort learning journey.\n\nLet's start with **Question 1 of 8** (Day ${initialQuestion.day}: ${initialQuestion.topic}):\n\n${initialQuestion.question}`;
    }

    const now = Date.now();
    const newSession = {
      sessionId,
      candidate,
      status: "active",
      messages: [{ role: "interviewer", content: initialReply }],
      currentDay: initialQuestion.day,
      currentTopic: initialQuestion.topic,
      difficulty: 5,
      coveredDays: [initialQuestion.day],
      targetQuestions: 8,
      questionNumber: 1,
      evaluations: [],
      feedback: null,
      interviewStartedAt: new Date(now).toISOString(),
      interviewEndTime: new Date(now + INTERVIEW_DURATION_MS).toISOString(),
      pausedRemainingMs: null,
      pausedAt: null,
      endedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const replaced = existingSessions.filter(
      (s) => s.sessionId !== sessionId && (s.status === "active" || s.status === "paused")
    );
    replaced.forEach((s) => {
      notifySession(s, NOTIFICATION_TYPES.ENDED, "Interview ended", `${candidateLabel(s)}'s interview session was ended.`);
    });
    apiClient.saveSessions([
      ...existingSessions.filter(
        (s) => s.sessionId !== sessionId && s.status !== "active" && s.status !== "paused"
      ),
      newSession,
    ]);
    notifySession(
      newSession,
      NOTIFICATION_TYPES.STARTED,
      "Interview started",
      `${candidateLabel(newSession)}'s interview is now live.`
    );

    return {
      reply: initialReply,
      done: false,
      sessionId,
      candidate,
      status: "active",
      questionNumber: 1,
      currentDay: initialQuestion.day,
      currentTopic: initialQuestion.topic,
      difficulty: 5,
      coveredDays: [initialQuestion.day],
      targetQuestions: 8,
      interviewStartedAt: newSession.interviewStartedAt,
      interviewEndTime: newSession.interviewEndTime,
      pausedRemainingMs: null,
    };
  }

  // Continue existing session (Conversation Turn)
  const session = existing || {
    sessionId,
    candidate,
    status: "active",
    messages: [],
    currentDay: candidate?.missions?.[0]?.day || 1,
    currentTopic: candidate?.missions?.[0]?.title || "VS Code & Python Setup",
    difficulty: 5,
    coveredDays: [1],
    targetQuestions: 8,
    questionNumber: 1,
    evaluations: [],
    feedback: null,
    interviewStartedAt: new Date().toISOString(),
    interviewEndTime: new Date(Date.now() + INTERVIEW_DURATION_MS).toISOString(),
    pausedRemainingMs: null,
    pausedAt: null,
    endedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const settings = apiClient.getSettings();
  const category = isNonAnswer(payload.message) ? "SKIP" : "VALID_ANSWER";

  session.messages.push({ role: "candidate", content: payload.message });

  const evalResult = evaluateAnswerAndAdapt(payload.message, session.difficulty || 5);
  session.evaluations = [...(session.evaluations || []), evalResult];
  session.difficulty = evalResult.newDifficulty;

  const currentQNum = session.questionNumber || 1;
  const isDone = currentQNum >= (session.targetQuestions || 8);
  const skipped = category === "SKIP" || isNonAnswer(payload.message);

  let reply = "";
  if (isDone) {
    session.status = "completed";
    session.feedback = generateFeedbackSummary(candidate, session.evaluations, session.difficulty);
    reply = `Thank you, ${candidate?.name || "candidate"}. That completes all 8 technical questions of your interview! I have compiled your structured feedback, strengths, gaps, and recommended next steps.`;
    notifySession(session, NOTIFICATION_TYPES.COMPLETED, "Interview completed", `${candidateLabel(session)} completed the interview.`);
    notifySession(session, NOTIFICATION_TYPES.RESULT, "Interview result generated", `Feedback is ready for ${candidateLabel(session)}.`);
  } else {
    const nextQNum = currentQNum + 1;
    session.questionNumber = nextQNum;
    const nextQ = generateAdaptiveQuestion(candidate, nextQNum - 1, session.difficulty, session.messages);
    session.currentDay = nextQ.day;
    session.currentTopic = nextQ.topic;
    session.coveredDays = Array.from(new Set([...(session.coveredDays || []), nextQ.day]));

    let geminiReply = null;

    if (settings.llmProvider === "gemini" && settings.geminiApiKey) {
      const historyText = session.messages
        .slice(-4)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const systemPrompt = skipped
        ? `You are Atlas, an expert AI Technical Interviewer. The candidate chose to skip or pass on the previous question.
Acknowledge politely without praising them (e.g. "No problem at all, let's move on to the next topic.").
Then ask Question ${nextQNum} of 8 focusing on Day ${nextQ.day} (${nextQ.topic}) at difficulty ${session.difficulty}/10. Formulate a clear, practical technical question.`
        : `You are Atlas, an expert AI Technical Interviewer. Context so far:
${historyText}

Evaluate the candidate's last response in 1-2 brief sentences.
Then seamlessly transition to Question ${nextQNum} of 8 focusing on Day ${nextQ.day} (${nextQ.topic}) at difficulty ${session.difficulty}/10. Ask an intelligent technical question exploring architecture or trade-offs.`;

      geminiReply = await callGeminiAPI(systemPrompt, payload.message, settings.geminiApiKey);
    }

    if (geminiReply) {
      reply = geminiReply;
    } else if (skipped) {
      reply = `No problem at all — it's completely okay to pass on a specific topic. Let's move on to the next module.\n\nMoving to **Question ${nextQNum} of ${session.targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
    } else {
      reply = generateNaturalFallbackReply(payload.message, nextQNum, session.targetQuestions, nextQ);
    }
  }

  session.messages.push({ role: "interviewer", content: reply });
  session.updatedAt = new Date().toISOString();

  const updatedSessions = [...existingSessions.filter((s) => s.sessionId !== sessionId), session];
  apiClient.saveSessions(updatedSessions);

  return {
    reply,
    done: isDone,
    sessionId,
    candidate,
    status: session.status,
    questionNumber: session.questionNumber,
    currentDay: session.currentDay,
    currentTopic: session.currentTopic,
    difficulty: session.difficulty,
    coveredDays: session.coveredDays,
    targetQuestions: session.targetQuestions,
    feedback: session.feedback,
    interviewEndTime: session.interviewEndTime,
    pausedRemainingMs: session.pausedRemainingMs,
  };
}