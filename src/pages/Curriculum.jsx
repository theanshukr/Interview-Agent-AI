import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TopNav from "@/components/TopNav";
import { cn } from "@/lib/utils";

const MODULES = [
  { n: 1, title: "Environment & Tooling", days: [1, 3] },
  { n: 2, title: "Data Foundations", days: [4, 6] },
  { n: 3, title: "Embeddings & Vector Search", days: [7, 10] },
  { n: 4, title: "LLM Core, Prompting & Fine-Tuning", days: [11, 15] },
  { n: 5, title: "Chatbot Application Build", days: [16, 20] },
  { n: 6, title: "Agentic AI & MCP", days: [21, 24] },
  { n: 7, title: "Evaluation, Security & Deployment", days: [25, 28] },
  { n: 8, title: "Production & Capstone", days: [29, 31] },
];

const DAYS = [
  { day: 1, title: "VS Code & Python Environment Setup", type: "SETUP", tools: ["VS Code", "Python", "Pylance", "Virtual Environment"] },
  { day: 2, title: "Local LLM & AI Coding Assistant Setup", type: "SETUP", tools: ["Ollama", "Qwen2.5-Coder", "GitHub Copilot", "Cline"] },
  { day: 3, title: "First AI Project, React Frontend & GitHub", type: "BUILD", tools: ["Python", "Ollama", "FastAPI", "React", "Vite", "Git", "GitHub"] },
  { day: 4, title: "Reading & Processing Structured Data", type: "BUILD", tools: ["Pandas", "SQLite", "SQL", "SQLAlchemy"] },
  { day: 5, title: "Reading & Processing Unstructured Data", type: "BUILD", tools: ["pdfplumber", "PyPDF", "python-docx", "Tesseract OCR", "BeautifulSoup", "Requests"] },
  { day: 6, title: "Building the Knowledge Base", type: "BUILD", tools: ["LangChain Text Splitters", "JSONL", "Python"] },
  { day: 7, title: "Embeddings Explained", type: "AI_CORE", tools: ["Sentence Transformers", "OpenAI Embeddings", "Scikit-learn", "Matplotlib"] },
  { day: 8, title: "Vector Databases Overview", type: "BUILD", tools: ["ChromaDB", "Pinecone"] },
  { day: 9, title: "Building & Populating the Vector Database", type: "BUILD", tools: ["ChromaDB", "Sentence Transformers"] },
  { day: 10, title: "The Retrieval & Matching Engine", type: "SHIP_IT", tools: ["SQLite", "ChromaDB", "Python"] },
  { day: 11, title: "RAG End-to-End & LLM API Basics", type: "BUILD", tools: ["OpenAI SDK", "Ollama", "Groq", "Python"] },
  { day: 12, title: "Prompt Engineering Fundamentals", type: "LEARN", tools: ["LLMs", "Prompt Templates"] },
  { day: 13, title: "Advanced Prompting: Function Calling & Structured Outputs", type: "BUILD", tools: ["OpenAI Function Calling", "Pydantic", "Python"] },
  { day: 14, title: "Fine-Tuning: Concepts & When to Use It", type: "LEARN", tools: ["JSONL", "OpenAI", "LoRA", "QLoRA"] },
  { day: 15, title: "Fine-Tuning: Hands-On with LoRA & QLoRA", type: "SHIP_IT", tools: ["PEFT", "Transformers", "BitsAndBytes", "OpenAI Fine-Tuning", "LoRA"] },
  { day: 16, title: "Chatbot Backend & API Integration", type: "BUILD", tools: ["FastAPI", "SQLite", "Python"] },
  { day: 17, title: "Chatbot Frontend Development", type: "BUILD", tools: ["Streamlit", "Requests", "UUID"] },
  { day: 18, title: "Full-Stack Integration & Streaming Responses", type: "BUILD", tools: ["FastAPI", "StreamingResponse", "Server-Sent Events", "Streamlit"] },
  { day: 19, title: "Response Formatting & Rich Outputs", type: "BUILD", tools: ["Pydantic", "Markdown", "Streamlit"] },
  { day: 20, title: "Conversation Memory & Context Management", type: "SHIP_IT", tools: ["SQLite", "FastAPI", "LLM", "Token Management"] },
  { day: 21, title: "Agentic Frameworks: LangChain Agents & Tool Use", type: "BUILD", tools: ["LangChain", "LangChain Agents", "ReAct", "Python"] },
  { day: 22, title: "Multi-Agent Orchestration", type: "BUILD", tools: ["CrewAI", "LangGraph", "Python"] },
  { day: 23, title: "Model Context Protocol (MCP)", type: "BUILD", tools: ["MCP Python SDK", "Claude Desktop", "Cline", "Python"] },
  { day: 24, title: "Agentic Chatbot Integration", type: "SHIP_IT", tools: ["LangChain", "MCP", "FastAPI", "Python"] },
  { day: 25, title: "Chatbot Evaluation & Testing", type: "SHIP_IT", tools: ["Python", "Evaluation Dataset", "Automated Testing"] },
  { day: 26, title: "Performance Optimization & Cost Management", type: "OPTIMIZE", tools: ["tiktoken", "Python", "FastAPI"] },
  { day: 27, title: "Security, Privacy & Guardrails", type: "BUILD", tools: ["FastAPI", "Python", "Authentication", "Input Validation"] },
  { day: 28, title: "Docker & Kubernetes Deployment", type: "SHIP_IT", tools: ["Docker", "Kubernetes", "FastAPI", "React"] },
  { day: 29, title: "Monitoring, Logging & Observability", type: "BUILD", tools: ["Python Logging", "Prometheus", "Grafana"] },
  { day: 30, title: "Production Readiness & Final Testing", type: "SHIP_IT", tools: ["FastAPI", "Docker", "Kubernetes", "Python"] },
  { day: 31, title: "Capstone Project & Final Demo", type: "CAPSTONE", tools: ["FastAPI", "React", "LangChain", "MCP", "Docker", "Kubernetes"] },
];

const TYPE_STYLES = {
  SETUP: "bg-muted text-muted-foreground ring-border",
  BUILD: "bg-primary/10 text-primary ring-primary/20",
  AI_CORE: "bg-accent/10 text-accent ring-accent/20",
  LEARN: "bg-accent/15 text-accent ring-accent/25",
  SHIP_IT: "bg-success/10 text-success ring-success/20",
  OPTIMIZE: "bg-warning/10 text-warning ring-warning/20",
  CAPSTONE: "bg-destructive/10 text-destructive ring-destructive/20",
};

export default function Curriculum() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <TopNav />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Cohort Map</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            AI Engineering Curriculum
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            31 days · 8 modules · the full enterprise AI stack. Atlas draws questions only from modules a
            candidate has completed.
          </p>
        </motion.section>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.04 }}
              className="card rounded-2xl p-4"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
                  {m.n}
                </span>
                <span className="text-xs text-muted-foreground">Days {m.days[0]}–{m.days[1]}</span>
              </div>
              <h3 className="mt-2.5 text-sm font-semibold leading-snug text-foreground">{m.title}</h3>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-10 pb-16">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border sm:left-[14px]" />
          <div className="space-y-3">
            {DAYS.map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 8) * 0.03 }}
                className="relative pl-10 sm:pl-12"
              >
                <span className="absolute left-0 top-3 grid h-6 w-6 place-items-center rounded-full bg-card text-[10px] font-bold text-primary ring-1 ring-primary/30 sm:h-7 sm:w-7 sm:text-xs">
                  {d.day}
                </span>
                <div className="card card-hover rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1", TYPE_STYLES[d.type])}>
                      {d.type.replace("_", " ")}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground sm:text-base">{d.title}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.tools.map((t) => (
                      <span key={t} className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pb-12 text-center">
          <Link
            to="/select"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Start an interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}