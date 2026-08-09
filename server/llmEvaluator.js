// Server LLM Evaluator
// Structured JSON evaluation using Gemini / OpenAI / Ollama with graceful heuristic fallback

const GIBBERISH_PATTERNS = [
  /^(nice|good|great|awesome|cool|interesting|wow|nice question|good question|great question)/i,
  /^(ok|okay|sure|thanks|thank you|got it|makes sense|hi|hello|hey|lol|rofl)/i,
  /^(asdf|qwerty|1234|abc|xyz|test|dunno|bro|bruh)/i,
];

const NON_ANSWER_PATTERNS = [
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

export function isGibberish(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return true;
  if (GIBBERISH_PATTERNS.some((p) => p.test(t))) return true;

  const hasTechnicalTerms = /(vector|embedding|rag|fastapi|react|cors|docker|sql|python|json|schema|mcp|prompt|llm|model|agent|gpu|cuda|database|server|pipeline|deploy)/i.test(t);
  const wordCount = t.split(/\s+/).length;
  if (!hasTechnicalTerms && wordCount <= 4 && !/(how|what|why|build|create|use|using|implement|run|set|code|activated|created)/i.test(t)) {
    return true;
  }
  return false;
}

export function isNonAnswer(text) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return true;
  return NON_ANSWER_PATTERNS.some((p) => p.test(t));
}

// Low-level Gemini API Call with JSON Schema enforcement
export async function callGeminiStructured(systemPrompt, userPrompt, apiKey, jsonSchema = null) {
  if (!apiKey) return null;
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nCandidate Submission:\n"${userPrompt}"` }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      };

      if (jsonSchema) {
        payload.generationConfig.response_schema = jsonSchema;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleaned);
        }
      } else {
        const errText = await response.text();
        console.warn(`Gemini structured API (${model}) status ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn(`Gemini structured API (${model}) error:`, err);
    }
  }
  return null;
}

// General text generation helper for interview responses
export async function callGeminiText(prompt, apiKey) {
  if (!apiKey) return null;
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errText = await response.text();
        console.warn(`Gemini text API (${model}) status ${response.status}:`, errText);
      }
    } catch (e) {
      console.warn(`Gemini text API (${model}) error:`, e);
    }
  }
  return null;
}

// 1. Grade individual candidate answer against curriculum topic (1-10 scale)
export async function evaluateAnswerAndAdapt(candidateAnswer, currentTopic, currentDifficulty = 5, apiKey = null) {
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
      scoringMethod: "heuristic",
    };
  }

  // Attempt real LLM evaluation if API key is provided
  if (apiKey) {
    const systemPrompt = `You are Atlas, an expert technical interviewer evaluating a candidate's answer for the topic "${currentTopic}".
Grade the candidate's response strictly on a scale from 1 to 10 for each dimension:
- technicalCorrectness (1-10)
- depth (1-10)
- reasoning (1-10)
- communication (1-10)

Also calculate the target difficulty for the next question (newDifficulty: 1-10, current is ${currentDifficulty}).
Set skipped to false.`;

    const schema = {
      type: "OBJECT",
      properties: {
        technicalCorrectness: { type: "INTEGER" },
        depth: { type: "INTEGER" },
        reasoning: { type: "INTEGER" },
        communication: { type: "INTEGER" },
        newDifficulty: { type: "INTEGER" },
        skipped: { type: "BOOLEAN" },
      },
      required: ["technicalCorrectness", "depth", "reasoning", "communication", "newDifficulty", "skipped"]
    };

    const llmResult = await callGeminiStructured(systemPrompt, text, apiKey, schema);
    if (llmResult && typeof llmResult.technicalCorrectness === "number") {
      return {
        technicalCorrectness: Math.min(10, Math.max(1, llmResult.technicalCorrectness)),
        depth: Math.min(10, Math.max(1, llmResult.depth)),
        reasoning: Math.min(10, Math.max(1, llmResult.reasoning)),
        communication: Math.min(10, Math.max(1, llmResult.communication)),
        skipped: false,
        newDifficulty: Math.min(10, Math.max(1, llmResult.newDifficulty || currentDifficulty)),
        scoringMethod: "ai",
      };
    }
  }

  // Fallback Heuristic evaluation when no LLM API key is present
  const cleanText = text.toLowerCase();
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
    scoringMethod: "heuristic",
  };
}

// 2. Generate post-interview feedback summary (LLM + heuristic fallback)
export async function generateFeedbackSummary(candidate, evaluations = [], finalDifficulty = 5, opts = {}, messages = [], apiKey = null) {
  const name = candidate?.name || "The candidate";
  const evals = evaluations || [];
  const count = Math.max(1, evals.length);
  const hasAiScoring = evals.some((e) => e.scoringMethod === "ai");

  if (apiKey && messages.length > 0) {
    const transcriptText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are Atlas, Senior AI Engineering Assessor.
Synthesize a comprehensive post-interview feedback report for candidate ${name} based on the full interview transcript.
Return a structured JSON object with the following fields:
- summary: String (2-3 concise, professional sentences detailing performance and curriculum readiness)
- strengths: Array of 3-4 strings (concise actionable technical strengths)
- gaps: Array of 2-4 strings (concise technical areas needing improvement)
- next: Array of 3 strings (actionable next steps/recommendations)
- competencyScores: Object with integer scores (0-100) for knowledge, accuracy, communication, confidence, depth, reasoning, practical
- overallScore: Integer (0-100)`;

    const schema = {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING" },
        strengths: { type: "ARRAY", items: { type: "STRING" } },
        gaps: { type: "ARRAY", items: { type: "STRING" } },
        next: { type: "ARRAY", items: { type: "STRING" } },
        competencyScores: {
          type: "OBJECT",
          properties: {
            knowledge: { type: "INTEGER" },
            accuracy: { type: "INTEGER" },
            communication: { type: "INTEGER" },
            confidence: { type: "INTEGER" },
            depth: { type: "INTEGER" },
            reasoning: { type: "INTEGER" },
            practical: { type: "INTEGER" },
          },
          required: ["knowledge", "accuracy", "communication", "confidence", "depth", "reasoning", "practical"]
        },
        overallScore: { type: "INTEGER" },
      },
      required: ["summary", "strengths", "gaps", "next", "competencyScores", "overallScore"]
    };

    const llmFeedback = await callGeminiStructured(systemPrompt, transcriptText, apiKey, schema);
    if (llmFeedback && llmFeedback.summary && Array.isArray(llmFeedback.strengths)) {
      return {
        ...llmFeedback,
        scoringMethod: hasAiScoring ? "ai" : "heuristic",
      };
    }
  }

  // Heuristic synthesis fallback
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
    scoringMethod: hasAiScoring ? "ai" : "heuristic",
  };
}
