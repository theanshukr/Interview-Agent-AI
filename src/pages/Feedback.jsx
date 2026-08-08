import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import TopNav from "@/components/TopNav";
import RadarScore from "@/components/RadarScore";
import { getSession } from "@/lib/interviewApi";
import { cn } from "@/lib/utils";

export default function Feedback() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession(sessionId);
        if (cancelled) return;
        setSession(s);
        if (!s?.feedback) setError("Feedback not ready — finish the interview first.");
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load feedback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const f = session?.feedback || null;
  const candidate = session?.candidate || {};
  const member = candidate.member || candidate;
  const candidateName = member.name || candidate.name || "Candidate";
  const competencyScores = f?.competencyScores;

  function downloadReport() {
    if (!f) return;
    const lines = [];
    lines.push(`INTERVIEW COMPLETE — ${candidateName}`);
    lines.push(`Session: ${sessionId}`);
    lines.push("");
    lines.push("SUMMARY");
    lines.push(f.summary || "");
    lines.push("");
    if (f.strengths?.length) {
      lines.push("STRENGTHS");
      f.strengths.forEach((x) => lines.push(`✓ ${x}`));
      lines.push("");
    }
    if (f.gaps?.length) {
      lines.push("AREAS TO IMPROVE");
      f.gaps.forEach((x) => lines.push(`× ${x}`));
      lines.push("");
    }
    if (f.next?.length) {
      lines.push("NEXT STEPS");
      f.next.forEach((x) => lines.push(`→ ${x}`));
    }
    if (session?.messages?.length) {
      lines.push("");
      lines.push("TRANSCRIPT");
      session.messages.forEach((m) => {
        lines.push(`${m.role === "interviewer" ? "Interviewer" : candidateName}: ${m.content}`);
        lines.push("");
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-feedback-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors">

        <TopNav />
        <div className="grid place-items-center py-24">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-secondary border-t-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Loading feedback…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !f) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors">

        <TopNav />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <div className="card rounded-2xl p-8">
            <TriangleAlert className="mx-auto h-8 w-8 text-warning" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Feedback not ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error || "Finish the interview first."}</p>
            <Link to="/select" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to candidates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">

      <TopNav />
      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <Link to="/select" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> New interview
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20">
            <Sparkles className="h-3.5 w-3.5" /> Interview complete
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{candidateName}</h1>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <div className="card mt-4 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{f.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={downloadReport} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                <Download className="h-3.5 w-3.5" /> Download report
              </button>
              <Link to="/select" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                <RotateCcw className="h-3.5 w-3.5" /> Start another
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Strengths / Gaps / Next */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Section title="Strengths" icon={CheckCircle2} tone="success" items={f.strengths} mark="✓" />
          <Section title="Areas to improve" icon={TriangleAlert} tone="warning" items={f.gaps} mark="×" />
          <Section title="Next steps" icon={TrendingUp} tone="primary" items={f.next} mark="→" />
        </div>

        {/* Optional analytics */}
        {competencyScores && (
          <div className="card mt-4 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competency radar</h2>
            <div className="mt-3">
              <RadarScore scores={competencyScores} />
            </div>
          </div>
        )}

        {/* Transcript */}
        {session?.messages?.length > 0 && (
          <div className="card mt-4 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interview timeline</h2>
            <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-2">
              {session.messages.map((m, i) => (
                <div key={i} className="text-sm">
                  <span className={cn("mr-2 text-xs font-semibold uppercase tracking-wide", m.role === "interviewer" ? "text-primary" : "text-muted-foreground")}>
                    {m.role === "interviewer" ? "Interviewer" : candidateName}
                  </span>
                  <span className={m.role === "interviewer" ? "text-foreground/80" : "text-foreground"}>{m.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, tone, items, mark }) {
  const tones = {
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/10 text-warning ring-warning/20",
    primary: "bg-primary/10 text-primary ring-primary/20",
  };
  return (
    <div className="card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg ring-1", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2">
        {(items || []).map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/85">
            <span className="font-mono text-muted-foreground">{mark}</span>
            <span>{it}</span>
          </li>
        ))}
        {!items?.length && <li className="text-sm text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}