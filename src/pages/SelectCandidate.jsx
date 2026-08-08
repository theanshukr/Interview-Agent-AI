import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Upload } from "lucide-react";
import TopNav from "@/components/TopNav";
import CandidateCard from "@/components/CandidateCard";
import { listCandidates, interview } from "@/lib/interviewApi";
import { useToast } from "@/components/ui/use-toast";

export default function SelectCandidate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  async function load() {
    try {
      setLoading(true);
      const next = await listCandidates();
      setCandidates(next || []);
    } catch (e) {
      console.error(e);
      setCandidates([]);
      toast({ title: "Could not load candidates", description: e?.message || "Please try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("candidates-changed", handler);
    return () => window.removeEventListener("candidates-changed", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const hay = [
        c.candidateId,
        c.name,
        c.currentPosition,
        c.jobRole,
        c.education,
        `${c.yearsExperience} years`,
        `${c.yearsExperience} yrs`,
        ...(c.weakTopics || []),
        ...(c.strengths || []),
        `${c.readinessScore}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [candidates, query]);

  async function handleStart(candidate) {
    setStarting(candidate.candidateId);
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
        description: e?.creditsExhausted ? "The workspace is out of AI integration credits. Upgrade your plan or wait for credits to reset to run interviews." : e?.message || "unknown error",
        variant: "destructive",
      });
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <TopNav />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Candidate operations</div>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Candidates</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Atlas personalizes each interview from the candidate's completed modules, weak topics, and
                learning signals. Select a profile to begin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, role, weak topics…"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-import-modal"))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import Candidates</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CandidateCard
                key={c.candidateId}
                candidate={c}
                starting={starting}
                onStart={() => handleStart(c)}
                onView={() => navigate(`/candidate/${c.candidateId}`)}
              />
            ))}
            {!filtered.length && (
              <div className="col-span-full card rounded-2xl p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No candidates match "{query}".
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Clear search query
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}