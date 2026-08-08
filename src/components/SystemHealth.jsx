import React from "react";
import { cn } from "@/lib/utils";

const SERVICES = [
  { name: "AI Model", detail: "GPT-4o · operational" },
  { name: "Vector Store", detail: "Connected" },
  { name: "Retriever", detail: "Hybrid · ready" },
  { name: "Prompt Engine", detail: "Live" },
  { name: "Context Memory", detail: "Session-aware" },
  { name: "Question Generator", detail: "Curriculum-aware" },
  { name: "Feedback Engine", detail: "7-competency rubric" },
];

function StatusDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-success/40 dot-pulse" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
    </span>
  );
}

export default function SystemHealth({ className }) {
  return (
    <div className={cn("card rounded-2xl p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">System health</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            All interview subsystems operational
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success ring-1 ring-success/20">
          <StatusDot /> All systems go
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <StatusDot />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-foreground">{s.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}