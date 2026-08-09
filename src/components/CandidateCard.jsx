import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Calendar, CheckCircle2, Clock, FileText, Github, GraduationCap, Linkedin, PauseCircle, Play, TriangleAlert } from "lucide-react";
import Avatar from "@/components/Avatar";
import { getCandidateSession } from "@/lib/interviewApi";
import { useInterviewTimer } from "@/hooks/useInterviewTimer";
import { cn } from "@/lib/utils";

function MiniRing({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const size = 40;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = v >= 75 ? "hsl(var(--success))" : v >= 50 ? "hsl(var(--primary))" : v >= 30 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums" style={{ color }}>{v}</span>
    </div>
  );
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Small status pill reflecting the candidate's real interview session state.
function SessionState({ session, remaining }) {
  if (!session) return null;
  if (session.status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success/50 dot-pulse" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        Live · {formatClock(remaining)} remaining
      </span>
    );
  }
  if (session.status === "paused") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
        <PauseCircle className="h-3 w-3" /> Paused
      </span>
    );
  }
  if (session.endedBy === "timeout") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
        <TriangleAlert className="h-3 w-3" /> Time expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
}

export default function CandidateCard({ candidate, onStart, onView, selected, starting }) {
  const c = candidate;
  const isStarting = starting === c.candidateId;

  const [session, setSession] = useState(() => getCandidateSession(c.candidateId));
  useEffect(() => {
    const update = () => setSession(getCandidateSession(c.candidateId));
    update();
    window.addEventListener("sessions-changed", update);
    return () => window.removeEventListener("sessions-changed", update);
  }, [c.candidateId]);

  const live = session && (session.status === "active" || session.status === "paused");
  const cardTimer = useInterviewTimer({
    status: session?.status === "active" ? "active" : "ready",
    interviewEndTime: session?.status === "active" ? session.interviewEndTime : null,
    pausedRemainingMs: session?.status === "paused" ? session.pausedRemainingMs : null,
  });

  const missions = c.missions || [];
  const completed = missions.filter((m) => !m.skipped && m.passed).length;
  const totalDays = 31;
  const progressPct = Math.round((completed / totalDays) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={c.name} size={46} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold text-foreground">{c.name}</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                {c.status || "Active"}
              </span>
            </div>
            <p className="truncate text-[13px] text-muted-foreground">{c.currentPosition || c.jobRole}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.yearsExperience} yrs</span>
              <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{c.education}</span>
            </div>
          </div>
        </div>
        <MiniRing value={c.readinessScore} />
      </div>

      {session && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SessionState session={session} remaining={cardTimer.remaining} />
          {session.status === "active" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> Question {session.questionNumber || 1}/{session.targetQuestions || 8}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>AI cohort progress</span>
          <span className="font-medium text-foreground">{completed}/{totalDays} days · {progressPct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weak topics</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(c.weakTopics || []).slice(0, 2).map((t) => (
              <span key={t} className="rounded-full border border-destructive/30 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {t}
              </span>
            ))}
            {!c.weakTopics?.length && <span className="text-[11px] text-muted-foreground">—</span>}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Strengths</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(c.strengths || []).slice(0, 2).map((t) => (
              <span key={t} className="rounded-full border border-foreground/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
                {t}
              </span>
            ))}
            {!c.strengths?.length && <span className="text-[11px] text-muted-foreground">—</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-muted-foreground">
          <a href={c.resumeUrl || "#"} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground" aria-label="Resume"><FileText className="h-4 w-4" /></a>
          <a href={c.githubUrl || "#"} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground" aria-label="GitHub"><Github className="h-4 w-4" /></a>
          <a href={c.linkedinUrl || "#"} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
          {c.lastInterviewDate && (
            <span className="ml-1 inline-flex items-center gap-1 text-[11px]">
              <Calendar className="h-3 w-3" /> {new Date(c.lastInterviewDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onStart}
          disabled={isStarting}
          className={cn(
            "flex-1 rounded-xl px-3 py-2.5 text-[13px] font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
            live ? "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15" : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isStarting ? "Starting…" : live ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Play className="h-3.5 w-3.5" /> Continue interview
            </span>
          ) : "Start interview"}
        </button>
        <button
          onClick={onView}
          className="rounded-xl border border-border px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          View
        </button>
      </div>
    </motion.div>
  );
}
