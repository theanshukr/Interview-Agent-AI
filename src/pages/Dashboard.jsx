import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles, Upload, Users, Zap } from "lucide-react";
import TopNav from "@/components/TopNav";
import SystemHealth from "@/components/SystemHealth";
import Avatar from "@/components/Avatar";
import { listCandidates } from "@/lib/interviewApi";

const STEPS = [
  { icon: Users, title: "Select a candidate", body: "Atlas reads each cohort profile — completed days, weak topics, and learning signals." },
  { icon: Zap, title: "AI conducts the interview", body: "Curriculum-aware questions, contextual follow-ups, and live difficulty adaptation." },
  { icon: Sparkles, title: "Structured feedback", body: "A seven-competency rubric, radar, and a recommended learning path — downloadable." },
];

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);

  async function loadData() {
    try {
      const data = await listCandidates();
      setCandidates(data || []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener("candidates-changed", handleChanged);
    return () => window.removeEventListener("candidates-changed", handleChanged);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <TopNav />
      <main className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="py-10 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success/40 dot-pulse" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              AI Interview Operations
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Enterprise AI Interview Agent
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              Conduct adaptive technical interviews using curriculum-aware reasoning, contextual
              follow-up questions, and AI-powered evaluation. The AI is the interviewer — candidates
              are the entities it interviews.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/select"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Start new interview <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-import-modal"))}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <Upload className="h-4 w-4 text-primary" /> Import candidate profiles
              </button>
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <BookOpen className="h-4 w-4" /> View curriculum map
              </Link>
            </div>
          </motion.div>
        </section>

        {/* System health */}
        <SystemHealth />

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How it works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="card rounded-2xl p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="mt-4 text-xs font-medium text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Candidates ready for interview */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Candidates ready for interview ({candidates.length})
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Active cohort candidates ready for technical evaluation.</p>
            </div>
            <Link to="/select" className="text-xs font-semibold text-primary hover:underline">
              View all ({candidates.length}) →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl skeleton" />
                ))
              : candidates.slice(0, 6).map((c) => (
                  <Link
                    key={c.candidateId}
                    to={`/candidate/${c.candidateId}`}
                    className="card card-hover flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl p-4 transition-all"
                  >
                    <Avatar name={c.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.currentPosition || c.jobRole}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-foreground">{c.readinessScore ?? "—"}</div>
                      <div className="text-[10px] font-semibold uppercase text-success">Ready</div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      </main>
    </div>
  );
}