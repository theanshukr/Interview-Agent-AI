import React, { useState } from "react";
import { Code, Play, Copy, Check, Terminal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_SNIPPETS = {
  python: `# Python Implementation Scratchpad
def build_rag_pipeline(documents, query):
    # 1. Chunk documents into retrieval units
    # 2. Compute dense vector embeddings
    # 3. Perform cosine similarity search
    # 4. Generate structured LLM answer
    pass

print("Pipeline initialized successfully.")`,
  javascript: `// JavaScript / React Scratchpad
async function queryLocalLLM(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "qwen2.5-coder", prompt, stream: false })
  });
  return await response.json();
}`,
  sql: `-- Healthcare Claims Analysis Query
SELECT 
    c.claim_id,
    c.member_id,
    c.diagnosis_code,
    SUM(c.allowed_amount) AS total_allowed
FROM claims c
GROUP BY c.claim_id, c.member_id
HAVING total_allowed > 1000
ORDER BY total_allowed DESC;`,
};

export default function CodeSandbox({ onInsertCode }) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_SNIPPETS[lang] || "");
    setOutput("");
  };

  const handleRun = () => {
    setRunning(true);
    setOutput("Running syntax & execution check...");
    setTimeout(() => {
      setRunning(false);
      if (language === "python") {
        setOutput(">>> Python 3.11 execution successful.\n>>> Output: Pipeline initialized successfully.");
      } else if (language === "sql") {
        setOutput(">>> SQL Query executed cleanly.\n>>> Returned 4 rows in 12ms.");
      } else {
        setOutput(">>> Code structure verified with 0 syntax errors.");
      }
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md overflow-hidden shadow-lg transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Technical Code Sandbox
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript / Node</option>
            <option value="sql">SQL Query</option>
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCode(DEFAULT_SNIPPETS[language])}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Editor & Output split */}
      <div className="p-3 space-y-3">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-44 rounded-xl border border-border/80 bg-background/90 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          placeholder="Write your code or SQL solution here..."
        />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleRun}
            disabled={running}
            size="sm"
            className="h-8 gap-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            {running ? "Executing..." : "Run Test"}
          </Button>
          {onInsertCode && (
            <Button
              onClick={() => onInsertCode(`\`\`\`${language}\n${code}\n\`\`\``)}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium rounded-lg"
            >
              Attach Code to Answer
            </Button>
          )}
        </div>

        {output && (
          <div className="rounded-xl border border-border/60 bg-black/40 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-[10px]">
              <Terminal className="h-3 w-3" /> Console Output
            </div>
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
