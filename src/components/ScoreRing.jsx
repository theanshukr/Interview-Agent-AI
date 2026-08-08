import React from "react";
import { cn } from "@/lib/utils";

// Animated circular score ring (0–100). Color shifts with score.
export default function ScoreRing({ value = 0, label, size = 120, stroke = 10, className }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  const color =
    v >= 75 ? "hsl(var(--success))" : v >= 50 ? "hsl(var(--primary))" : v >= 30 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-2xl font-bold tabular-nums" style={{ color }}>
            {v}
          </div>
          {label && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
        </div>
      </div>
    </div>
  );
}