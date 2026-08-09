// Curriculum data loader using hackethon document/curriculum.json as the source of truth
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const curriculumPath = join(__dirname, "..", "hackethon document", "curriculum.json");

let curriculumData = null;

export function loadCurriculum() {
  if (curriculumData) return curriculumData;
  try {
    const raw = readFileSync(curriculumPath, "utf-8");
    curriculumData = JSON.parse(raw);
    return curriculumData;
  } catch (err) {
    console.error("Failed to load curriculum.json:", err);
    return { days: [], modules: [] };
  }
}

const DEFAULT_DAYS = [1, 3, 7, 10, 12, 16, 23, 28];

export function getDayData(dayNumber) {
  const data = loadCurriculum();
  return data.days.find((d) => d.day === Number(dayNumber)) || null;
}

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

export function getAdaptiveQuestion(candidate, questionIndex, difficulty = 5) {
  const missions = candidate?.missions || [];
  const targetMission = missions[questionIndex % missions.length] || null;

  if (targetMission && targetMission.day && CURRICULUM_QUESTIONS_BY_DAY[targetMission.day]) {
    const qData = CURRICULUM_QUESTIONS_BY_DAY[targetMission.day];
    return {
      day: targetMission.day,
      topic: qData.topic,
      question: qData.question,
    };
  }

  const fallbackDayNum = DEFAULT_DAYS[questionIndex % DEFAULT_DAYS.length];
  const dayData = getDayData(fallbackDayNum);
  const qData = CURRICULUM_QUESTIONS_BY_DAY[fallbackDayNum] || {
    topic: dayData?.title || "AI Engineering Core",
    question: `Focusing on Day ${fallbackDayNum}: Explain your practical implementation approach, key architecture decisions, and trade-offs.`,
  };

  return {
    day: fallbackDayNum,
    topic: qData.topic,
    question: qData.question,
  };
}
