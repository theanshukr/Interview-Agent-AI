import React from "react";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function MessageBubble({ role, content, topic, evaluation }) {
  const isInterviewer = role === "interviewer";
  return (
    <div className={cn("flex w-full animate-fade-up", isInterviewer ? "justify-start" : "justify-end")}>
      <div className={cn("flex max-w-[90%] gap-3 sm:max-w-[82%]", isInterviewer ? "flex-row" : "flex-row-reverse")}>
        <div
          className={cn(
            "mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
            isInterviewer
              ? "bg-foreground text-background"
              : "bg-primary/10 text-primary ring-1 ring-primary/20"
          )}
        >
          {isInterviewer ? "IA" : "You"}
        </div>
        <div className={cn("flex flex-col", isInterviewer ? "items-start" : "items-end")}>
          {topic && isInterviewer && (
            <span className="mb-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {topic}
            </span>
          )}
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed",
              isInterviewer
                ? "card rounded-tl-sm text-foreground/90"
                : "bg-primary text-primary-foreground rounded-tr-sm"
            )}
          >
            <MarkdownRenderer content={content} />
          </div>
          {evaluation && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {[
                ["Knowledge", evaluation.knowledge],
                ["Depth", evaluation.depth],
                ["Reasoning", evaluation.reasoning],
                ["Practical", evaluation.practical],
              ].map(([label, val]) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1",
                    (val || 0) >= 7
                      ? "bg-success/10 text-success ring-success/20"
                      : (val || 0) >= 4
                      ? "bg-warning/10 text-warning ring-warning/20"
                      : "bg-destructive/10 text-destructive ring-destructive/20"
                  )}
                  title={evaluation.rationale}
                >
                  {label} {val}/10
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}