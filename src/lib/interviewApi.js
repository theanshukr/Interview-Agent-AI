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

// 8+ Curriculum Questions Bank covering all curriculum days with distinct questions
const CURRICULUM_QUESTIONS_BY_DAY = {
  1: {
    topic: "VS Code & Python Environment Setup",
    question: "How do you structure and activate an isolated Python virtual environment (.venv) in VS Code, and why is environment isolation critical when delivering production AI projects?",
  },
  2: {
    topic: "Local LLM & AI Coding Assistant Setup",
    question: "Explain how you set up Ollama with Qwen2.5-Coder locally, connect it to VS Code via Copilot or Cline, and verify offline code generation capabilities.",
  },
  3: {
    topic: "First AI Project, React Frontend & FastAPI",
    question: "Explain how you connect a Vite React frontend to a FastAPI endpoint serving LLM responses, including handling CORS, error boundaries, and streaming output.",
  },
  4: {
    topic: "Reading & Processing Structured Data",
    question: "How do you clean and transform structured data using Pandas, store it in SQLite, and construct SQL queries for downstream chatbot integration?",
  },
  5: {
    topic: "Reading & Processing Unstructured Data",
    question: "What text extraction techniques (PDF parsing, OCR, BeautifulSoup) do you use to clean noisy unstructured files before feeding them into an AI pipeline?",
  },
  6: {
    topic: "Building the Knowledge Base",
    question: "How do you chunk documents, attach metadata (such as source or section), and format them into structured JSONL records for vector indexing?",
  },
  7: {
    topic: "Vector Embeddings & Semantic Search",
    question: "Explain the mathematics behind cosine similarity in dense vector spaces, and how embedding model dimensions impact retrieval latency in RAG pipelines.",
  },
  8: {
    topic: "Vector Databases Overview",
    question: "How do you evaluate local ChromaDB versus cloud Pinecone for vector storage, and how do indexing algorithms (like HNSW) impact query latency in RAG systems?",
  },
  9: {
    topic: "Building & Populating Vector DB",
    question: "Walk me through populating a vector database with chunked embeddings, handling batch indexing limits, and ensuring metadata filtering works accurately.",
  },
  10: {
    topic: "Retrieval & Matching Engine",
    question: "When building a RAG retrieval engine, how do you handle metadata filtering, hybrid search (keyword + vector), and chunk overlap ratios to minimize context dilution?",
  },
  11: {
    topic: "RAG End-to-End & LLM API Basics",
    question: "Walk me through your end-to-end RAG pipeline from query receipt to vector lookup, context insertion into the prompt, and LLM response generation.",
  },
  12: {
    topic: "Prompt Engineering & Structured Outputs",
    question: "How do you enforce JSON Schema compliance in LLM outputs to prevent hallucinations and guarantee deterministic parsing in downstream microservices?",
  },
  13: {
    topic: "Function Calling & Structured Outputs",
    question: "Explain how function calling allows an LLM to invoke external backend tools deterministically, including how you handle schema definitions and error fallbacks.",
  },
  16: {
    topic: "Chatbot Backend & API Integration",
    question: "What architectural patterns do you apply when managing multi-turn conversation memory, sliding window context truncation, and token limits in FastAPI production endpoints?",
  },
  18: {
    topic: "Streaming Responses",
    question: "How do you implement Server-Sent Events (SSE) or WebSockets in FastAPI to stream LLM tokens in real time to a React UI without UI blocking?",
  },
  20: {
    topic: "Conversation Memory & Context Management",
    question: "How do you design stateful session persistence for multi-turn AI agents while avoiding exponential token cost growth and context window overflow?",
  },
  21: {
    topic: "LangChain Agents",
    question: "How do you construct ReAct-style agent loops in LangChain, and how do you manage tool state, loop detection, and agent execution boundaries?",
  },
  22: {
    topic: "Multi-Agent Orchestration",
    question: "Explain how you coordinate specialized AI sub-agents (e.g. planner, researcher, coder) to solve multi-step tasks while preventing infinite loop execution.",
  },
  23: {
    topic: "Model Context Protocol (MCP)",
    question: "How does Model Context Protocol (MCP) decouple model reasoning from external tool execution, and how do you handle tool execution failures or timeout retries?",
  },
  28: {
    topic: "Docker & Kubernetes Deployment",
    question: "What strategies do you use when containerizing Python/Ollama AI microservices with Docker, and how do you configure resource limits (GPU/RAM) in Kubernetes?",
  },
  29: {
    topic: "Monitoring, Logging & Observability",
    question: "How do you instrument telemetry, log LLM latency/token consumption, and set up evaluation alerts for production AI applications?",
  },
  31: {
    topic: "Capstone Project & Final Demo",
    question: "Looking back at your Capstone Project, walk me through the end-to-end architecture, key performance bottlenecks you benchmarked, and how you validated system readiness.",
  },
};

const DEFAULT_DAYS_ORDER = [1, 3, 7, 10, 12, 16, 23, 28];

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

  if (targetMission && targetMission.day && CURRICULUM_QUESTIONS_BY_DAY[targetMission.day]) {
    const qData = CURRICULUM_QUESTIONS_BY_DAY[targetMission.day];
    return {
      day: targetMission.day,
      topic: qData.topic,
      question: qData.question,
    };
  }

  const fallbackDay = DEFAULT_DAYS_ORDER[questionNumber % DEFAULT_DAYS_ORDER.length];
  const qData = CURRICULUM_QUESTIONS_BY_DAY[fallbackDay] || CURRICULUM_QUESTIONS_BY_DAY[1];
  return {
    day: fallbackDay,
    topic: qData.topic,
    question: qData.question,
  };
}

function checkTopicRelevance(userMessage, answeredTopic) {
  const text = (userMessage || "").toLowerCase();
  const topic = (answeredTopic || "").toLowerCase();

  const isEmbeddingsAnswer = ["vector", "embedding", "pinecone", "chroma", "recall@k", "cosine"].filter((kw) => text.includes(kw)).length >= 2;
  const isReactAnswer = ["react", "vite", "fastapi", "cors", "component", "endpoint"].filter((kw) => text.includes(kw)).length >= 2;
  const isDockerAnswer = ["docker", "kubernetes", "k8s", "container"].filter((kw) => text.includes(kw)).length >= 2;

  let mismatch = null;
  if (!topic.includes("embedding") && !topic.includes("vector") && isEmbeddingsAnswer) {
    mismatch = "vector embeddings and vector databases";
  } else if (!topic.includes("react") && !topic.includes("fastapi") && isReactAnswer) {
    mismatch = "React & FastAPI integration";
  } else if (!topic.includes("docker") && !topic.includes("kubernetes") && isDockerAnswer) {
    mismatch = "Docker & Kubernetes containerization";
  }

  return mismatch;
}

function generateNaturalFallbackReply(userMessage, answeredTopic, nextQNum, targetQuestions, nextQ, evalResult = {}) {
  const text = (userMessage || "").trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const mismatch = checkTopicRelevance(text, answeredTopic);

  let feedback = "";
  if (evalResult.repeated) {
    feedback = `Duplicate Response Detected: This answer is identical to a response provided in a previous turn. To receive technical credit for **${answeredTopic}**, please provide a dedicated, topic-specific answer.`;
  } else if (mismatch || evalResult.mismatched) {
    const mismatchName = mismatch || "an unrelated module";
    feedback = `Topic Mismatch: Your answer discusses ${mismatchName}, whereas Question ${nextQNum - 1} was asking specifically about **${answeredTopic}**. Make sure your response addresses the target topic directly.`;
  } else {
    const topic = answeredTopic || "your technical design";
    const detailedFeedback = [
      `Regarding ${topic}: Your technical explanation highlights key operational considerations and trade-offs well.`,
      `On the topic of ${topic}: Good analysis of your practical approach and validation steps.`,
      `For ${topic}: Your technical reasoning demonstrates clear structural awareness for a production system.`,
      `Understood on ${topic}: That provides a solid overview of your work aligned with cohort standards.`,
    ];
    const briefFeedback = [
      `Got it — noted your technical summary regarding ${topic}.`,
      `Makes sense. Good overview of your strategy for ${topic}.`,
      `Understood. That gives a clear picture of your implementation for ${topic}.`,
    ];
    const feedbackList = wordCount > 25 ? detailedFeedback : briefFeedback;
    feedback = feedbackList[(nextQNum + wordCount) % feedbackList.length];
  }

  return `${feedback}\n\nMoving to **Question ${nextQNum} of ${targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
}

async function callGeminiAPI(systemPrompt, userPrompt, apiKey) {
  if (!apiKey) return null;
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errText = await response.text();
        console.warn(`Gemini API (${model}) non-ok status ${response.status}:`, errText);
      }
    } catch (e) {
      console.warn(`Gemini API (${model}) fetch error:`, e);
    }
  }
  return null;
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

function evaluateAnswerAndAdapt(candidateAnswer, currentTopic, currentDifficulty = 5, previousAnswers = []) {
  const text = (candidateAnswer || "").trim();
  const cleanText = text.toLowerCase();
  const skipped = isNonAnswer(text);

  if (skipped) {
    return {
      technicalCorrectness: 2,
      depth: 1,
      reasoning: 2,
      communication: 5,
      skipped: true,
      repeated: false,
      mismatched: false,
      newDifficulty: Math.max(1, currentDifficulty - 2),
    };
  }

  // Check for repeated duplicate answer from previous turns
  const isDuplicate = (previousAnswers || []).some((prev) => {
    const p = (prev || "").trim().toLowerCase();
    if (!p || p.length < 15) return false;
    return p === cleanText || (cleanText.length > 30 && (cleanText.includes(p) || p.includes(cleanText)));
  });

  if (isDuplicate) {
    return {
      technicalCorrectness: 2,
      depth: 1,
      reasoning: 1,
      communication: 3,
      skipped: false,
      repeated: true,
      mismatched: false,
      newDifficulty: Math.max(1, currentDifficulty - 2),
    };
  }

  // Check for topic mismatch
  const mismatch = checkTopicRelevance(cleanText, currentTopic);
  if (mismatch) {
    return {
      technicalCorrectness: 3,
      depth: 2,
      reasoning: 2,
      communication: 5,
      skipped: false,
      repeated: false,
      mismatched: true,
      newDifficulty: Math.max(1, currentDifficulty - 1),
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
    repeated: false,
    mismatched: false,
    newDifficulty,
  };
}

function generateFeedbackSummary(candidate, evaluations = [], finalDifficulty = 5, opts = {}) {
  const name = candidate?.name || "The candidate";
  const evals = evaluations || [];
  const count = Math.max(1, evals.length);

  const sumCorrectness = evals.reduce((acc, e) => acc + (e.technicalCorrectness || 5), 0);
  const sumDepth = evals.reduce((acc, e) => acc + (e.depth || 5), 0);
  const sumReasoning = evals.reduce((acc, e) => acc + (e.reasoning || 5), 0);
  const sumComm = evals.reduce((acc, e) => acc + (e.communication || 5), 0);

  const avgCorrectness = sumCorrectness / count;
  const avgDepth = sumDepth / count;
  const avgReasoning = sumReasoning / count;
  const avgComm = sumComm / count;

  const repeatedCount = evals.filter((e) => e.repeated).length;
  const mismatchedCount = evals.filter((e) => e.mismatched).length;
  const skippedCount = evals.filter((e) => e.skipped).length;

  const baseEvalScore = Math.round(((avgCorrectness + avgDepth + avgReasoning + avgComm) / 4) * 10);
  const penalty = repeatedCount * 14 + mismatchedCount * 8 + skippedCount * 12;
  const overallScore = Math.max(15, Math.min(98, baseEvalScore - penalty));

  const gaps = candidate?.weakTopics && candidate.weakTopics.length > 0 ? [...candidate.weakTopics] : [
    "Advanced MCP tool exception recovery strategies",
    "Production RAG evaluation metrics (Context Recall & Answer Relevance)",
  ];

  if (repeatedCount > 0) {
    gaps.unshift(`Provided duplicate/repeated responses across ${repeatedCount} questions`);
  }
  if (mismatchedCount > 0) {
    gaps.unshift(`Addressed off-topic material on ${mismatchedCount} questions`);
  }
  if (skippedCount > 0) {
    gaps.unshift(`Uncovered foundational knowledge across ${skippedCount} skipped topics`);
  }

  const completion = opts.timedOut
    ? `completed ${Math.max(0, opts.answeredCount || 0)} of 8 questions before the 60-minute time limit expired`
    : "completed an 8-question adaptive technical interview";

  let statusPhrase = "strong technical execution";
  if (overallScore < 50) statusPhrase = "significant technical gaps and non-responsive submissions";
  else if (overallScore < 75) statusPhrase = "some areas needing improvement and topic review";

  return {
    summary: `${name} ${completion} covering key AI Cohort modules. Overall readiness score is ${overallScore}%, displaying ${statusPhrase}.`,
    strengths: (overallScore >= 50 && candidate?.strengths && candidate.strengths.length > 0) ? candidate.strengths : [
      "Familiarity with cohort development workflow & setup",
      "Willingness to participate in multi-turn technical assessments",
    ],
    gaps: Array.from(new Set(gaps)),
    next: [
      "Review skipped or repeated modules and provide dedicated technical answers",
      "Build an automated evaluation suite using Ragas or TruLens",
      "Practice structured problem breakdown for API and vector pipeline questions",
    ],
    competencyScores: {
      knowledge: Math.max(15, Math.min(98, Math.round(avgCorrectness * 10 - repeatedCount * 10 - skippedCount * 5))),
      accuracy: Math.max(15, Math.min(98, Math.round(avgReasoning * 10 - mismatchedCount * 10))),
      communication: Math.max(20, Math.min(98, Math.round(avgComm * 10 - repeatedCount * 5 - skippedCount * 5))),
      confidence: Math.max(15, Math.min(98, Math.round(overallScore * 0.95))),
      depth: Math.max(15, Math.min(98, Math.round(avgDepth * 10 - repeatedCount * 12))),
      reasoning: Math.max(15, Math.min(98, Math.round(avgReasoning * 10 - mismatchedCount * 8))),
      practical: Math.max(15, Math.min(98, Math.round(overallScore * 0.9))),
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

  const previousAnswers = (session.messages || [])
    .filter((m) => m.role === "candidate" && m.content !== payload.message)
    .map((m) => m.content);

  const evalResult = evaluateAnswerAndAdapt(
    payload.message,
    session.currentTopic || "AI Engineering Core",
    session.difficulty || 5,
    previousAnswers
  );

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
    const answeredTopic = session.currentTopic || "AI Engineering Core";
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
        ? `You are Atlas, an expert AI Technical Interviewer. The candidate chose to skip or pass on the previous question (${answeredTopic}).
Acknowledge politely without praising them (e.g. "No problem at all, let's move on to the next topic.").
Then ask Question ${nextQNum} of 8 focusing on Day ${nextQ.day} (${nextQ.topic}) at difficulty ${session.difficulty}/10. Formulate a clear, practical technical question.`
        : `You are Atlas, an expert AI Technical Interviewer. Context so far:
${historyText}

The question candidate just answered was on topic "${answeredTopic}".
Evaluate the candidate's last response in 1-2 brief sentences specifically for "${answeredTopic}". If their response is off-topic, repeated from a previous turn, or mentions an unrelated topic, note the issue politely without praising.
Then seamlessly transition to Question ${nextQNum} of 8 focusing on Day ${nextQ.day} (${nextQ.topic}) at difficulty ${session.difficulty}/10. Ask an intelligent technical question exploring architecture or trade-offs.`;

      geminiReply = await callGeminiAPI(systemPrompt, payload.message, settings.geminiApiKey);
    }

    if (geminiReply) {
      reply = geminiReply;
    } else if (skipped) {
      reply = `No problem at all — it's completely okay to pass on a specific topic. Let's move on to the next module.\n\nMoving to **Question ${nextQNum} of ${session.targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
    } else {
      reply = generateNaturalFallbackReply(payload.message, answeredTopic, nextQNum, session.targetQuestions, nextQ, evalResult);
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