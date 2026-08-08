import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function CodeBlock({ children, language }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{language || "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className }) {
  return (
    <div className={cn("markdown-body", className)} style={{ lineHeight: 1.65 }}>
      <ReactMarkdown
        components={{
          code({ inline, className: cls, children }) {
            const match = /language-(\w+)/.exec(cls || "");
            if (inline) {
              return (
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match ? match[1] : undefined}>{children}</CodeBlock>;
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>;
          },
          li({ children }) {
            return <li className="marker:text-muted-foreground">{children}</li>;
          },
          h1({ children }) {
            return <h3 className="mb-2 mt-3 text-lg font-semibold">{children}</h3>;
          },
          h2({ children }) {
            return <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>;
          },
          h3({ children }) {
            return <h4 className="mb-1.5 mt-2 text-sm font-semibold">{children}</h4>;
          },
          a({ children, href }) {
            return (
              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border border-border bg-surface px-2 py-1 text-left font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="border border-border px-2 py-1">{children}</td>;
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}