import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  Sparkles,
} from "lucide-react";
import TopNav from "@/components/TopNav";
import Avatar from "@/components/Avatar";
import ScoreRing from "@/components/ScoreRing";
import RadarScore from "@/components/RadarScore";
import { getCandidate, interview } from "@/lib/interviewApi";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MODULES = [
  { n: 1, title: "Environment", days: [1, 3] },
  { n: 2, title: "Data Foundations", days: [4, 6] },
  { n: 3, title: "Embeddings", days: [7, 10] },
  { n: 4, title: "LLM & Prompting", days: [11, 15] },
  { n: 5, title: "Chatbot Build", days: [16, 20] },
  { n: 6, title: "Agents & MCP", days: [21, 24] },
  { n: 7, title: "Eval & Deploy", days: [25, 28] },
  { n: 8, title: "Production", days: [29, 31] },
];

function Stat({ label, value }) {
  return (
    <div className="card rounded-xl p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function CandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();

  async function handleStart(candidate) {
    setStarting(true);
    try {
      const sessionId = crypto.randomUUID();
      const res = await interview({ sessionId, candidate });
      navigate(`/interview/${sessionId}`, {
        state: {
          reply: res.reply,
          candidate,
          questionNumber: res.questionNumber,
          currentDay: res.currentDay,
          currentTopic: res.currentTopic,
          difficulty: res.difficulty,
          coveredDays: res.coveredDays,
          targetQuestions: res.targetQuestions,
        },
      });
    } catch (e) {
      toast({
        title: e?.creditsExhausted ? "Integration credits exhausted" : "Could not start interview",
        description: e?.creditsExhausted
          ? "The workspace is out of AI integration credits. Upgrade your plan or wait for credits to reset to run interviews."
          : e?.message || "unknown error",
        variant: "destructive",
      });
      setStarting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getCandidate(candidateId);
        if (!cancelled) setC(next);
      } catch (e) {
        if (!cancelled) setC(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  // Derived: module completion + first-try trend
  const moduleData = useMemo(() => {
    if (!c) return { radar: [], trend: [], completed: 0 };
    const missions = c.missions || [];
    const radar = MODULES.map((m) => {
      const inMod = missions.filter((x) => x.day >= m.days[0] && x.day <= m.days[1]);
      const done = inMod.filter((x) => !x.skipped && x.passed).length;
      const total = m.days[1] - m.days[0] + 1;
      return { metric: m.title, value: total ? Math.round((done / total) * 10) : 0 };
    });
    const trend = MODULES.map((m) => {
      const inMod = missions.filter((x) => x.day >= m.days[0] && x.day <= m.days[1] && !x.skipped);
      const firstTry = inMod.filter((x) => x.attempts <= 1).length;
      const rate = inMod.length ? Math.round((firstTry / inMod.length) * 100) : 0;
      return { module: `M${m.n}`, rate };
    });
    const completed = missions.filter((x) => !x.skipped && x.passed).length;
    return { radar, trend, completed };
  }, [c]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors">

        <TopNav />
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <div className="h-48 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors">

        <TopNav />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-xl font-semibold">Candidate not found</h1>
          <Link to="/select" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  const missions = c.missions || [];
  const completedList = missions.filter((m) => !m.skipped && m.passed);
  const weakList = missions.filter((m) => !m.skipped && (m.attempts >= 4 || m.passed === false));
  const skippedList = missions.filter((m) => m.skipped);
  const signals = c.signals || {};

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">

      <TopNav />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/select" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Candidates
        </Link>

        {/* Header */}
        <div className="card mt-4 rounded-2xl p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={c.name} size={64} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{c.name}</h1>
              <p className="text-sm text-muted-foreground">{c.currentPosition || c.jobRole}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{c.yearsExperience} years experience</span>
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{c.education}</span>
                {c.lastInterviewDate && (
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Last interview {new Date(c.lastInterviewDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={c.resumeUrl || "#"} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Resume"><FileText className="h-4 w-4" /></a>
              <a href={c.githubUrl || "#"} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="GitHub"><Github className="h-4 w-4" /></a>
              <a href={c.linkedinUrl || "#"} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
              <button
                onClick={() => handleStart(c)}
                disabled={starting}
                className="ml-1 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" /> {starting ? "Starting…" : "Interview"}
              </button>
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Cohort progress" value={`${moduleData.completed}/31`} />
          <Stat label="Commit days" value={signals.commitDays ?? "—"} />
          <Stat label="First-try passes" value={signals.missionsFirstTry ?? "—"} />
          <div className="card flex items-center justify-between rounded-xl p-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Readiness</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{c.readinessScore ?? "—"}/100</div>
            </div>
            <ScoreRing value={c.readinessScore} size={44} stroke={5} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Skill radar */}
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground">Skill radar</h2>
            <p className="text-xs text-muted-foreground">Module mastery across the cohort (0–10).</p>
            <div className="mt-2">
              <RadarScore scores={Object.fromEntries(moduleData.radar.map((d) => [d.metric, d.value]))} height={260} />
            </div>
          </div>

          {/* Confidence trend */}
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground">Confidence trend</h2>
            <p className="text-xs text-muted-foreground">First-try pass rate by module.</p>
            <div className="mt-2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moduleData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="module" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                    formatter={(v) => [`${v}%`, "First-try rate"]}
                  />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--chart-1))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Strengths / Weak areas */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground">Strength areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(c.strengths || []).map((s) => (
                <span key={s} className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-success/15">{s}</span>
              ))}
              {!c.strengths?.length && <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground">Weak areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(c.weakTopics || []).map((s) => (
                <span key={s} className="rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning ring-1 ring-warning/15">{s}</span>
              ))}
              {!c.weakTopics?.length && <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
        </div>

        {/* Curriculum progress */}
        <div className="card mt-4 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground">Curriculum progress</h2>
          <p className="text-xs text-muted-foreground">Daily mission outcomes. Atlas interviews only on completed days.</p>
          <div className="mt-4 space-y-1.5">
            {missions.map((m) => {
              const state = m.skipped ? "skipped" : m.passed === false || m.attempts >= 4 ? "weak" : "done";
              const dot = state === "done" ? "bg-success" : state === "weak" ? "bg-warning" : "bg-muted-foreground/40";
              return (
                <div key={m.day} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/50">
                  <span className={cn("h-2 w-2 rounded-full", dot)} />
                  <span className="w-10 text-xs font-medium text-muted-foreground">Day {m.day}</span>
                  <span className="flex-1 truncate text-sm text-foreground">{m.title}</span>
                  <span className="text-[11px] text-muted-foreground">{m.skipped ? "Skipped" : `${m.attempts || 0} attempt${(m.attempts || 0) === 1 ? "" : "s"}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}