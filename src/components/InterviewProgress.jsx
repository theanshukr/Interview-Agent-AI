import React, { useEffect, useState } from "react";
import { Clock, Gauge, MessageSquareText } from "lucide-react";

function difficultyLabel(level) {
  const l = Math.max(1, Math.min(10, Math.round(level)));
  if (l <= 2) return "Foundational";
  if (l <= 4) return "Junior";
  if (l <= 6) return "Mid";
  if (l <= 8) return "Senior";
  return "Staff";
}

export default function InterviewProgress({ questionNumber, target = 8, difficulty, startedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60000)).padStart(2, "0");
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
  const pct = Math.min(100, Math.round(((questionNumber || 0) / target) * 100));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary/70" />
          <span className="font-mono tabular-nums text-foreground/90">{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquareText className="h-4 w-4 text-primary/70" />
          <span className="text-foreground/90">Q {questionNumber || 0}<span className="text-muted-foreground">/{target}+</span></span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="h-4 w-4 text-primary/70" />
          <span className="text-foreground/90">Difficulty {Math.round(difficulty || 5)}/10</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
            {difficultyLabel(difficulty || 5)}
          </span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}