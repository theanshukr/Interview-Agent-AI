import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowLeft, SendHorizonal, Square, Code, Sparkles, Cpu } from "lucide-react";
import TopNav from "@/components/TopNav";
import Avatar from "@/components/Avatar";
import TypingIndicator from "@/components/TypingIndicator";
import CodeSandbox from "@/components/CodeSandbox";
import InterviewTimer from "@/components/InterviewTimer";
import { interview, getSession, getSessionSync, resumeSession, expireSession } from "@/lib/interviewApi";
import { useInterviewTimer } from "@/hooks/useInterviewTimer";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

function difficultyLabel(level) {
  const l = Math.max(1, Math.min(10, Math.round(level)));
  if (l <= 2) return "Foundational";
  if (l <= 4) return "Easy";
  if (l <= 6) return "Medium";
  if (l <= 8) return "Advanced";
  return "Expert";
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


function Bubble({ role, content, streaming }) {
  const isAI = role === "interviewer";
  return (
    <div className={cn("flex gap-3", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-foreground text-[10px] font-bold text-background">IA</span>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
          isAI ? "bg-surface text-foreground ring-1 ring-border" : "bg-primary text-primary-foreground"
        )}
      >
        {content}
        {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current align-middle" />}
      </div>
      {!isAI && (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-[10px] font-bold text-accent">YOU</span>
      )}
    </div>
  );
}

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initial = location.state || {};
  const { toast } = useToast();

  const [messages, setMessages] = useState(initial.reply ? [{ role: "interviewer", content: initial.reply }] : []);
  const [candidate, setCandidate] = useState(initial.candidate || null);
  const [questionNumber, setQuestionNumber] = useState(initial.questionNumber || 0);
  const [currentDay, setCurrentDay] = useState(initial.currentDay || null);
  const [currentTopic, setCurrentTopic] = useState(initial.currentTopic || "");
  const [difficulty, setDifficulty] = useState(initial.difficulty || 5);
  const [coveredDays, setCoveredDays] = useState(initial.coveredDays || (initial.currentDay ? [initial.currentDay] : []));
  const [targetQuestions, setTargetQuestions] = useState(initial.targetQuestions || 8);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!initial.reply);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState("");
  const [showSandbox, setShowSandbox] = useState(false);
  const [scoringMethod, setScoringMethod] = useState(initial.scoringMethod || "heuristic");

  // Interview-wide 60-minute countdown state (persisted via timestamps on the session).
  // Lazily restore timestamps from the stored session so a page refresh never restarts the clock.
  const [status, setStatus] = useState(() => {
    if (initial.status) return initial.status;
    return getSessionSync(sessionId)?.status || "active";
  });
  const [interviewEndTime, setInterviewEndTime] = useState(() => {
    if (initial.interviewEndTime) return initial.interviewEndTime;
    return getSessionSync(sessionId)?.interviewEndTime || null;
  });
  const [pausedRemainingMs, setPausedRemainingMs] = useState(() => {
    if (initial.pausedRemainingMs) return initial.pausedRemainingMs;
    return getSessionSync(sessionId)?.pausedRemainingMs || null;
  });
  const [expired, setExpired] = useState(false);
  const expireHandledRef = useRef(false);

  const scrollRef = useRef(null);
  const streamTimer = useRef(null);

  function applySession(s) {
    if (!s) return;
    setStatus(s.status || "active");
    setInterviewEndTime(s.interviewEndTime || null);
    setPausedRemainingMs(s.pausedRemainingMs || null);
    setMessages(s.messages || []);
    setCandidate(s.candidate || null);
    setQuestionNumber(s.questionCount || s.questionNumber || 0);
    setCurrentDay(s.currentDay);
    setCurrentTopic(s.currentTopic || "");
    setDifficulty(s.difficulty || 5);
    setCoveredDays(s.coveredDays || []);
    setTargetQuestions(s.targetQuestions || 8);
    const hasAiEval = (s.evaluations || []).some((e) => e.scoringMethod === "ai") || s.scoringMethod === "ai";
    setScoringMethod(hasAiEval ? "ai" : "heuristic");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession(sessionId);
        if (cancelled || !s) return;
        if (s.status === "paused") resumeSession(sessionId);
        const live = await getSession(sessionId);
        if (cancelled || !live) return;
        applySession(live);
        if (live.status === "completed") {
          navigate(`/feedback/${sessionId}`, { replace: true });
          return;
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Keep the page in sync with the stored session (e.g. other tabs ending it,
  // or the global expiry watcher finishing the session at 00:00).
  useEffect(() => {
    const sync = () => {
      getSession(sessionId).then((s) => {
        if (s && s.status !== "completed") applySession(s);
      });
    };
    window.addEventListener("sessions-changed", sync);
    return () => window.removeEventListener("sessions-changed", sync);
  }, [sessionId]);

  function handleTimeExpired() {
    if (expireHandledRef.current) return;
    expireHandledRef.current = true;
    setExpired(true);
    setBusy(true);
    expireSession(sessionId);
    toast({
      title: "Interview Time Expired",
      description: "The 60-minute limit has been reached. Submitting your interview automatically.",
      variant: "destructive",
    });
    setTimeout(() => {
      navigate(`/feedback/${sessionId}`, { replace: true });
    }, 1600);
  }

  const { remaining, expired: timerExpired } = useInterviewTimer({
    status,
    interviewEndTime,
    pausedRemainingMs,
    disabled: loading,
    onExpire: handleTimeExpired,
  });

  useEffect(() => {
    if (timerExpired) setExpired(true);
  }, [timerExpired]);

  useEffect(() => {
    return () => {
      if (streamTimer.current) clearInterval(streamTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText, busy]);

  function streamReply(fullText) {
    return new Promise((resolve) => {
      if (streamTimer.current) clearInterval(streamTimer.current);
      const words = fullText.split(/(\s+)/);
      let i = 0;
      setStreamingText("");
      streamTimer.current = setInterval(() => {
        i += 1;
        setStreamingText(words.slice(0, i).join(""));
        if (i >= words.length) {
          clearInterval(streamTimer.current);
          streamTimer.current = null;
          setStreamingText("");
          resolve(fullText);
        }
      }, 28);
    });
  }

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy || expired) return;
    setInput("");
    setBusy(true);
    setError(null);

    const candidateMsg = { role: "candidate", content: text };
    setMessages((prev) => [...prev, candidateMsg]);

    try {
      const data = await interview({ sessionId, message: text });
      const fullReply = data.done ? "That wraps up the interview. Generating your feedback — one moment." : data.reply;
      await streamReply(fullReply);

      setMessages((prev) => [...prev, { role: "interviewer", content: fullReply }]);
      setQuestionNumber(data.questionNumber ?? questionNumber + 1);
      if (data.currentDay) setCurrentDay(data.currentDay);
      if (data.currentTopic) setCurrentTopic(data.currentTopic);
      if (data.difficulty) setDifficulty(data.difficulty);
      if (data.coveredDays) setCoveredDays(data.coveredDays);

      if (data.done) {
        setTimeout(() => navigate(`/feedback/${sessionId}`), 900);
      }
    } catch (err) {
      const credits = err?.creditsExhausted || /limit of integrations|upgrade your plan|credits exhausted/i.test(err?.message || "");
      const friendly = credits
        ? "Integration credits exhausted — the workspace is out of AI credits. Upgrade your plan or wait for credits to reset to continue."
        : err?.message || "Something went wrong. Try sending again.";
      setError(friendly);
      toast({ title: "Interview interrupted", description: friendly, variant: "destructive" });
      setMessages((prev) => prev.filter((m) => m !== candidateMsg));
    } finally {
      setBusy(false);
    }
  }

  const uniqueDays = new Set(coveredDays).size;
  const member = candidate?.member || candidate || {};
  const candidateName = member.name || candidate?.name || "Candidate";
  const candidateRole = member.role || member.jobRole || candidate?.jobRole || "";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors lg:h-screen lg:overflow-hidden">

      <TopNav />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-3 py-3 sm:px-6 lg:overflow-hidden">
        <div className="grid flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
          {/* LEFT — candidate context (no scores revealed) */}
          <aside className="order-2 lg:order-1 lg:overflow-y-auto">
            <div className="card rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Square className="h-3.5 w-3.5 text-primary" /> Interview
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Question</div>
                  <div className="font-display text-2xl font-bold tabular-nums text-foreground">
                    {Math.max(1, questionNumber)}
                    <span className="text-base font-medium text-muted-foreground"> / {targetQuestions}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums text-foreground/80">
                      {expired || timerExpired ? "00:00" : formatClock(remaining)}
                    </span>
                    <span>{expired || timerExpired ? "· time expired" : status === "paused" ? "· paused" : "remaining"}</span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <div className="text-xs text-muted-foreground">Curriculum</div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">
                    {currentDay ? `Day ${currentDay}` : "—"}
                    {currentTopic ? <span className="block text-xs font-normal text-muted-foreground">{currentTopic}</span> : null}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Difficulty</div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">{difficultyLabel(difficulty)}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Coverage</div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">{uniqueDays} curriculum days</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Evaluation Mode</div>
                  <div className="mt-1">
                    {scoringMethod === "ai" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        <Sparkles className="h-3 w-3" /> AI-Graded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        <Cpu className="h-3 w-3" /> Heuristic
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <button
                  onClick={() => setShowSandbox((prev) => !prev)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary"
                >
                  <Code className="h-4 w-4 text-primary" />
                  {showSandbox ? "Hide Code Sandbox" : "Open Code Sandbox"}
                </button>

                <div className="h-px bg-border" />

                <div className="flex items-center gap-3">
                  <Avatar name={candidateName} size={36} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{candidateName}</div>
                    <div className="truncate text-xs text-muted-foreground">{candidateRole}</div>
                  </div>
                </div>
              </div>

              <Link to="/select" className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Exit interview
              </Link>
            </div>
          </aside>

          {/* RIGHT — conversation */}
          <section className="order-1 flex min-h-[60vh] flex-col lg:order-2 lg:min-h-0 lg:overflow-hidden">
            <div className="card flex flex-wrap items-center justify-between gap-3 rounded-t-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-[10px] font-bold text-background">IA</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">AI Cohort Interviewer</div>
                  <div className="text-[11px] text-success">● {status === "paused" ? "Paused" : expired ? "Time expired" : "Live · adaptive"}</div>
                </div>
              </div>
              <InterviewTimer
                remaining={remaining}
                questionNumber={Math.max(1, questionNumber)}
                target={targetQuestions}
                status={status}
                expired={expired || timerExpired}
              />
              <span className="hidden text-xs text-muted-foreground md:block">Session {String(sessionId || "").slice(0, 12)}…</span>
            </div>

            {showSandbox && (
              <div className="border-x border-b border-border bg-background/50 p-3">
                <CodeSandbox onInsertCode={(snippet) => setInput((prev) => (prev ? `${prev}\n\n${snippet}` : snippet))} />
              </div>
            )}


            <div ref={scrollRef} className="card flex-1 space-y-5 overflow-y-auto rounded-none border-x border-b p-4 sm:p-6">
              {loading ? (
                <div className="grid place-items-center py-16">
                  <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-primary animate-spin" />
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <Bubble key={i} role={m.role} content={m.content} />
                  ))}
                  {busy && streamingText && <Bubble role="interviewer" content={streamingText} streaming />}
                  {busy && !streamingText && <TypingIndicator />}
                  {error && (
                    <div className="mx-auto max-w-md rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* composer */}
            <div className="card mt-3 rounded-2xl p-2.5">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Type your answer…"
                  className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/60"
                  style={{ minHeight: 44 }}
                  disabled={busy || expired}
                />
                <button
                  type="submit"
                  disabled={busy || expired || !input.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {busy ? (
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </button>
              </form>
              {expired && (
                <div className="mt-1 px-2 text-[11px] font-medium text-destructive">
                  Time expired — the interview was submitted automatically.
                </div>
              )}
              <div className="mt-1 flex justify-between px-2 text-[11px] text-muted-foreground">
                <span>{expired ? "Interview complete" : "Enter to send · Shift+Enter for newline"}</span>
                <button onClick={() => navigate(`/feedback/${sessionId}`)} className="flex items-center gap-1 transition-colors hover:text-foreground">
                  <Square className="h-3 w-3" /> End & view feedback
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {expired && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm rounded-2xl p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
              Interview Time Expired
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The 60-minute interview limit has been reached. Your interview was submitted automatically and feedback is being prepared.
            </p>
            <button
              onClick={() => navigate(`/feedback/${sessionId}`)}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}