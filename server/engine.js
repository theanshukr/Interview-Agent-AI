// Server Interview Engine
// Compliant with technical-spec.md POST /api/interview contract
// Handles adaptive interview progression, 60-minute server timer enforcement, and candidate validation

import { sessionStore } from "./sessionStore.js";
import { getAdaptiveQuestion } from "./curriculum.js";
import {
  isGibberish,
  isNonAnswer,
  evaluateAnswerAndAdapt,
  generateFeedbackSummary,
  callGeminiText,
} from "./llmEvaluator.js";

const INTERVIEW_DURATION_MS = 60 * 60 * 1000;

export async function processInterviewRequest(payload, apiKey = null) {
  const { sessionId, candidate, message } = payload || {};

  if (!sessionId) {
    throw { status: 400, message: "sessionId is required." };
  }

  // 1. Start Interview flow: { sessionId, candidate }
  if (candidate && !message) {
    const existing = sessionStore.get(sessionId);
    if (existing && existing.candidate) {
      // Validate candidate consistency
      const existingId = existing.candidate.candidateId || existing.candidate.id;
      const incomingId = candidate.candidateId || candidate.id;
      if (existingId && incomingId && existingId !== incomingId) {
        throw { status: 400, message: "sessionId is already assigned to a different candidate." };
      }
    }

    const initialQ = getAdaptiveQuestion(candidate, 0, 5);
    const now = Date.now();
    const startedAt = new Date(now).toISOString();
    const endTime = new Date(now + INTERVIEW_DURATION_MS).toISOString();

    let initialReply = null;
    if (apiKey) {
      const prompt = `You are Atlas, an expert AI Technical Interviewer. Introduce yourself briefly to candidate ${candidate.name || "there"} (${candidate.jobRole || "AI Engineer"}). State that you will conduct an 8-question technical interview grounded in their cohort curriculum. Then ask Question 1 of 8 focusing on Day ${initialQ.day} (${initialQ.topic}) at difficulty 5/10. Formulate an engaging, practical technical opening question.`;
      initialReply = await callGeminiText(prompt, apiKey);
    }

    if (!initialReply) {
      initialReply = `Hi ${candidate.name || "there"} — I'm Atlas, your AI Technical Interviewer. I'll assess your readiness for the ${candidate.jobRole || "AI Engineering"} role through an 8-question interview based on your cohort learning journey.\n\nLet's start with **Question 1 of 8** (Day ${initialQ.day}: ${initialQ.topic}):\n\n${initialQ.question}`;
    }

    const newSession = {
      sessionId,
      candidate,
      status: "active",
      messages: [{ role: "interviewer", content: initialReply }],
      currentDay: initialQ.day,
      currentTopic: initialQ.topic,
      difficulty: 5,
      coveredDays: [initialQ.day],
      targetQuestions: 8,
      questionNumber: 1,
      evaluations: [],
      feedback: null,
      interviewStartedAt: startedAt,
      interviewEndTime: endTime,
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    sessionStore.set(sessionId, newSession);

    return {
      reply: initialReply,
      done: false,
      // Telemetry fields for UI sync
      sessionId,
      candidate,
      status: "active",
      questionNumber: 1,
      currentDay: initialQ.day,
      currentTopic: initialQ.topic,
      difficulty: 5,
      coveredDays: [initialQ.day],
      targetQuestions: 8,
      interviewStartedAt: startedAt,
      interviewEndTime: endTime,
    };
  }

  // 2. Conversation Turn flow: { sessionId, message }
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw { status: 404, message: `Session '${sessionId}' not found. Please start the interview first.` };
  }

  // Candidate spoofing validation if candidate is passed in turn
  if (candidate) {
    const existingId = session.candidate?.candidateId || session.candidate?.id;
    const incomingId = candidate.candidateId || candidate.id;
    if (existingId && incomingId && existingId !== incomingId) {
      throw { status: 400, message: "Candidate ID mismatch for this sessionId." };
    }
  }

  // Server-side 60-minute timer enforcement
  const now = Date.now();
  const sessionEndTime = new Date(session.interviewEndTime).getTime();
  if (now > sessionEndTime || session.status === "completed") {
    if (session.status !== "completed") {
      session.status = "completed";
      session.endedBy = "timeout";
      session.feedback = await generateFeedbackSummary(
        session.candidate,
        session.evaluations || [],
        session.difficulty || 5,
        { timedOut: true, answeredCount: session.evaluations.length },
        session.messages,
        apiKey
      );
      sessionStore.set(sessionId, session);
    }
    return {
      reply: "The 60-minute interview limit has been reached. Interview completed.",
      done: true,
      feedback: session.feedback,
    };
  }

  const userMessage = (message || "").trim();



  // Record candidate turn
  session.messages.push({ role: "candidate", content: userMessage });

  // Real LLM / Heuristic evaluation of answer
  const evalResult = await evaluateAnswerAndAdapt(userMessage, session.currentTopic, session.difficulty || 5, apiKey);
  session.evaluations.push(evalResult);
  session.difficulty = evalResult.newDifficulty;

  const currentQNum = session.questionNumber || 1;
  const isDone = currentQNum >= (session.targetQuestions || 8);
  const skipped = isNonAnswer(userMessage);

  let reply = "";
  if (isDone) {
    session.status = "completed";
    session.feedback = await generateFeedbackSummary(
      session.candidate,
      session.evaluations,
      session.difficulty,
      { timedOut: false, answeredCount: session.evaluations.length },
      session.messages,
      apiKey
    );

    reply = `Thank you, ${session.candidate?.name || "candidate"}. That completes all 8 technical questions of your interview! I have compiled your structured feedback, strengths, gaps, and recommended next steps.`;
    session.messages.push({ role: "interviewer", content: reply });
    sessionStore.set(sessionId, session);

    return {
      reply,
      done: true,
      feedback: session.feedback,
      sessionId,
      candidate: session.candidate,
      status: session.status,
      questionNumber: currentQNum,
      currentDay: session.currentDay,
      currentTopic: session.currentTopic,
      difficulty: session.difficulty,
      coveredDays: session.coveredDays,
      targetQuestions: session.targetQuestions,
      interviewEndTime: session.interviewEndTime,
    };
  }

  // Advance to next question
  const answeredTopic = session.currentTopic || "AI Engineering Core";
  const nextQNum = currentQNum + 1;
  session.questionNumber = nextQNum;
  const nextQ = getAdaptiveQuestion(session.candidate, nextQNum - 1, session.difficulty);
  session.currentDay = nextQ.day;
  session.currentTopic = nextQ.topic;
  session.coveredDays = Array.from(new Set([...(session.coveredDays || []), nextQ.day]));

  if (apiKey) {
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
Evaluate the candidate's last response in 1-2 brief sentences specifically for "${answeredTopic}". If their response is off-topic or mentions an unrelated topic, note the mismatch politely.
Then seamlessly transition to Question ${nextQNum} of 8 focusing on Day ${nextQ.day} (${nextQ.topic}) at difficulty ${session.difficulty}/10. Ask an intelligent technical question exploring architecture or trade-offs.`;

    const llmReply = await callGeminiText(systemPrompt, apiKey);
    if (llmReply) reply = llmReply;
  }

  if (!reply) {
    if (skipped) {
      reply = `No problem at all — it's completely okay to pass on a specific topic. Let's move on to the next module.\n\nMoving to **Question ${nextQNum} of ${session.targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
    } else {
      const text = (userMessage || "").trim();
      const wordCount = text ? text.split(/\s+/).length : 0;
      
      const isEmbeddingsAnswer = ["vector", "embedding", "pinecone", "chroma", "recall@k", "cosine"].filter((kw) => text.toLowerCase().includes(kw)).length >= 2;
      const isReactAnswer = ["react", "vite", "fastapi", "cors", "component", "endpoint"].filter((kw) => text.toLowerCase().includes(kw)).length >= 2;
      const topicLower = answeredTopic.toLowerCase();

      let feedback = "";
      if (!topicLower.includes("embedding") && !topicLower.includes("vector") && isEmbeddingsAnswer) {
        feedback = `Thank you for sharing those details on vector embeddings. Note that the previous question was specifically regarding **${answeredTopic}**. Make sure your response addresses the target topic. Let's move to the next topic.`;
      } else if (!topicLower.includes("react") && !topicLower.includes("fastapi") && isReactAnswer) {
        feedback = `Thank you for sharing those details on React & FastAPI. Note that the previous question was specifically regarding **${answeredTopic}**. Make sure your response addresses the target topic. Let's move to the next topic.`;
      } else {
        const detailedFeedback = [
          `Thank you for that breakdown of ${answeredTopic}. Your technical explanation covers the core design considerations and trade-offs well.`,
          `Good analysis regarding ${answeredTopic}. I appreciate how you structured your practical approach and validation steps.`,
          `Clear and structured response on ${answeredTopic}. That demonstrates practical awareness for a production system.`,
          `Understood — that gives a solid overview of your work with ${answeredTopic}. Your reasoning aligns well with cohort standards.`,
        ];
        const briefFeedback = [
          `Got it — thank you for summarizing your approach to ${answeredTopic}.`,
          `Makes sense. Good summary of your technical strategy for ${answeredTopic}.`,
          `Understood. That gives me a clear picture of your implementation for ${answeredTopic}.`,
        ];
        const feedbackList = wordCount > 25 ? detailedFeedback : briefFeedback;
        feedback = feedbackList[(nextQNum + wordCount) % feedbackList.length];
      }

      reply = `${feedback}\n\nMoving to **Question ${nextQNum} of ${session.targetQuestions}** (Day ${nextQ.day}: ${nextQ.topic}):\n\n${nextQ.question}`;
    }
  }

  session.messages.push({ role: "interviewer", content: reply });
  sessionStore.set(sessionId, session);

  return {
    reply,
    done: false,
    sessionId,
    candidate: session.candidate,
    status: session.status,
    questionNumber: session.questionNumber,
    currentDay: session.currentDay,
    currentTopic: session.currentTopic,
    difficulty: session.difficulty,
    coveredDays: session.coveredDays,
    targetQuestions: session.targetQuestions,
    interviewEndTime: session.interviewEndTime,
  };
}
