import { Clock, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(ms) {
  const total = Math.max(0, Math.ceil((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function InterviewTimer({ remaining, questionNumber, target, status, expired }) {
  const totalSec = Math.max(0, Math.ceil((remaining || 0) / 1000));
  const urgent = !expired && totalSec <= 60;
  const strongWarning = !expired && totalSec <= 5 * 60;
  const warning = !expired && totalSec <= 10 * 60;

  const tone = urgent || expired
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : strongWarning
      ? "border-warning/40 bg-warning/10 text-warning"
      : warning
        ? "border-warning/30 bg-warning/5 text-warning"
        : "border-border bg-background text-foreground";

  const label = expired
    ? "Time Expired"
    : status === "paused"
      ? "Paused"
      : urgent
        ? "Under 1 min"
        : strongWarning
          ? "Under 5 min"
          : warning
            ? "Under 10 min"
            : "Time remaining";

  return (
    <div
      role="timer"
      aria-label={expired ? "Interview time expired" : `Time remaining ${formatTime(remaining)}`}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-colors",
        tone,
        urgent && "animate-pulse-soft"
      )}
    >
      {expired ? (
        <TimerReset className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" />
      )}
      <div className="leading-tight">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</div>
        <div className="font-mono text-sm font-semibold tabular-nums">
          {expired ? "00:00" : formatTime(remaining)}
        </div>
      </div>
      <span className="mx-0.5 h-6 w-px bg-current opacity-20" aria-hidden="true" />
      <div className="leading-tight">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">Question</div>
        <div className="text-sm font-semibold tabular-nums">
          {questionNumber}<span className="font-medium opacity-70"> / {target}</span>
        </div>
      </div>
    </div>
  );
}
