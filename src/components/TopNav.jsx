import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, FileText, Info, Menu, Moon, Play, RefreshCw, Search, Settings, Sparkle, Square, Sun, Upload, X } from "lucide-react";
import Logo from "@/components/Logo";
import ImportDataModal from "@/components/ImportDataModal";
import NotificationCenter from "@/components/NotificationCenter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/apiClient";
import { endSession, expireSession, getMostRecentSession, resumeSession } from "@/lib/interviewApi";
import { useInterviewTimer } from "@/hooks/useInterviewTimer";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/select" },
  { label: "Curriculum", to: "/curriculum" },
];

function formatClock(ms) {
  const total = Math.max(0, Math.ceil((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [atlasMenuOpen, setAtlasMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [atlasState, setAtlasState] = useState({
    status: "ready",
    statusLabel: "Ready",
    session: null,
  });

  const [navSearch, setNavSearch] = useState("");
  const searchRef = React.useRef(null);

  useEffect(() => {
    const handleOpenModal = () => setImportOpen(true);
    window.addEventListener("open-import-modal", handleOpenModal);
    return () => window.removeEventListener("open-import-modal", handleOpenModal);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function resolveAtlasState() {
    const current = getMostRecentSession();
    if (!current) {
      setAtlasState({ status: "ready", statusLabel: "Ready", session: null });
      return;
    }
    if (current.status === "completed") {
      setAtlasState({
        status: "completed",
        statusLabel: "Interview completed",
        session: current,
      });
    } else if (current.status === "paused") {
      setAtlasState({
        status: "paused",
        statusLabel: "Interview paused",
        session: current,
      });
    } else if (current.status === "active") {
      setAtlasState({
        status: "active",
        statusLabel: "Interview in progress",
        session: current,
      });
    } else {
      setAtlasState({ status: "ready", statusLabel: "Ready", session: null });
    }
  }

  useEffect(() => {
    resolveAtlasState();
    window.addEventListener("sessions-changed", resolveAtlasState);
    return () => window.removeEventListener("sessions-changed", resolveAtlasState);
  }, [location.pathname]);

  // A session left running while the user is elsewhere must still hit the
  // 60-minute deadline. When we are NOT on the interview page (which owns its
  // own timer), auto-end the session at 00:00.
  const isInterviewPage = location.pathname.startsWith("/interview/");
  const handleGlobalExpiry = useCallback(() => {
    const s = getMostRecentSession();
    if (!s || s.status !== "active") return;
    expireSession(s.sessionId);
    toast({
      title: "Interview time expired",
      description: "The 60-minute limit was reached. The interview was submitted automatically.",
      variant: "destructive",
    });
  }, [toast]);

  const liveSession = atlasState.session;
  const liveTimer = useInterviewTimer({
    status: !isInterviewPage && liveSession?.status === "active" ? "active" : "ready",
    interviewEndTime: !isInterviewPage && liveSession?.status === "active" ? liveSession?.interviewEndTime : null,
    pausedRemainingMs: !isInterviewPage && liveSession?.status === "paused" ? liveSession?.pausedRemainingMs : null,
    onExpire: handleGlobalExpiry,
  });

  function handleLiveChipClick() {
    const s = atlasState.session;
    if (!s) return;
    if (s.status === "paused") resumeSession(s.sessionId);
    navigate(`/interview/${s.sessionId}`);
  }

  const sessionCandidate = atlasState.session?.candidate?.member || atlasState.session?.candidate || null;
  const sessionCandidateName = sessionCandidate?.name || "Candidate";
  const sessionCandidateRole =
    sessionCandidate?.currentPosition || sessionCandidate?.jobRole || "";
  const sessionTotal = atlasState.session?.targetQuestions || 8;
  const sessionQuestion = Math.min(
    sessionTotal,
    atlasState.session?.questionNumber || 1
  );

  function handleContinueInterview() {
    const s = atlasState.session;
    if (!s) return;
    resumeSession(s.sessionId);
    setAtlasMenuOpen(false);
    navigate(`/interview/${s.sessionId}`);
  }

  function handleEndInterview() {
    setAtlasMenuOpen(false);
    setEndConfirmOpen(true);
  }

  function confirmEndInterview() {
    const s = atlasState.session;
    if (s) {
      endSession(s.sessionId);
      toast({ title: "Interview ended", description: "The active interview session was ended." });
      if (location.pathname.startsWith(`/interview/${s.sessionId}`)) {
        navigate("/select");
      }
    }
    setEndConfirmOpen(false);
  }

  function handleViewReport() {
    const s = atlasState.session;
    if (!s) return;
    setAtlasMenuOpen(false);
    navigate(`/feedback/${s.sessionId}`);
  }

  function handleResetInterview() {
    apiClient.resetSessions();
    setResetConfirmOpen(false);
    toast({ title: "Interview reset", description: "Interview session state cleared. You can start a fresh interview." });
    if (location.pathname.startsWith("/interview/")) {
      navigate("/select");
    }
  }

  function handleNavSearchSubmit(e) {
    e.preventDefault();
    const q = navSearch.trim();
    setMobileMenuOpen(false);
    navigate(q ? `/select?q=${encodeURIComponent(q)}` : "/select");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 pr-2">
            <Logo size={30} tile />
            <span className="text-[15px] font-bold tracking-tight text-foreground sm:inline">
              Interview Agent
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Search */}
          <form onSubmit={handleNavSearchSubmit} className="ml-4 hidden flex-1 max-w-xs lg:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full rounded-lg border border-border bg-secondary/60 py-1.5 pl-8 pr-10 text-xs outline-none transition-colors focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1.5">
            {!isInterviewPage && liveSession && (atlasState.status === "active" || atlasState.status === "paused") && (
              <button
                type="button"
                onClick={handleLiveChipClick}
                title={`${atlasState.status === "paused" ? "Paused" : "Live"} interview — continue`}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:px-3",
                  atlasState.status === "active"
                    ? "border-success/30 bg-success/5 text-success hover:bg-success/10"
                    : "border-warning/30 bg-warning/5 text-warning hover:bg-warning/10"
                )}
              >
                <span className="relative flex h-2 w-2">
                  {atlasState.status === "active" && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success/50 dot-pulse" />
                  )}
                  <span className={cn("relative inline-flex h-2 w-2 rounded-full", atlasState.status === "active" ? "bg-success" : "bg-warning")} />
                </span>
                {atlasState.status === "active" ? (
                  <>
                    LIVE · {formatClock(liveTimer.remaining)}
                  </>
                ) : (
                  "PAUSED"
                )}
                <span className="hidden text-muted-foreground md:inline">Q{sessionQuestion}/{sessionTotal}</span>
              </button>
            )}

            <NotificationCenter />

            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-border/80 sm:px-3"
            >
              <Upload className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Import Data</span>
            </button>

            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-foreground" />}
            </button>

            <Link
              to="/settings"
              aria-label="Settings"
              className="hidden sm:grid h-9 w-9 place-items-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <DropdownMenu open={atlasMenuOpen} onOpenChange={setAtlasMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Atlas AI Interview Agent — ${atlasState.statusLabel}`}
                  title="Atlas AI Interview Agent"
                  className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-border/80 hover:bg-secondary data-[state=open]:border-border/80 data-[state=open]:bg-secondary sm:px-3"
                >
                  <Sparkle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="hidden sm:inline">Atlas</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-80 rounded-xl bg-popover p-0 shadow-lg">
                <div className="px-4 pb-2 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                      <Sparkle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold tracking-tight text-foreground">ATLAS</div>
                      <div className="text-[11px] text-muted-foreground">AI Interview Agent</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-surface/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className="inline-flex items-center gap-1.5 text-right font-semibold text-foreground">
                        {atlasState.status === "completed" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success" />
                            {atlasState.statusLabel}
                          </>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                atlasState.status === "active" && "bg-success animate-pulse",
                                atlasState.status === "paused" && "bg-warning",
                                atlasState.status === "ready" && "bg-muted-foreground/60"
                              )}
                            />
                            {atlasState.statusLabel}
                          </>
                        )}
                      </span>
                    </div>
                    {atlasState.status === "ready" && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground">No active candidate</div>
                    )}
                  </div>

                  {atlasState.session && (
                    <>
                      <div className="mt-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Current candidate
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold text-foreground">{sessionCandidateName}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {sessionCandidateRole || "AI Engineering"}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Interview
                        </div>
                        <div className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                          Question {sessionQuestion} of {sessionTotal}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Day {atlasState.session.currentDay} · {atlasState.session.currentTopic}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">Context</span>
                          <span className="font-semibold text-foreground">Maintained</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {atlasState.session && (
                  <>
                    <DropdownMenuSeparator className="-mx-1 my-1" />
                    <div className="p-1.5">
                      {atlasState.status === "completed" ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleViewReport();
                          }}
                          className="cursor-pointer rounded-lg focus:bg-secondary"
                        >
                          <FileText className="h-4 w-4" />
                          View Report
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleContinueInterview();
                            }}
                            className="cursor-pointer rounded-lg focus:bg-secondary"
                          >
                            <Play className="h-4 w-4" />
                            Continue Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleEndInterview();
                            }}
                            className="cursor-pointer rounded-lg focus:bg-secondary"
                          >
                            <Square className="h-4 w-4" />
                            End Interview
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
                  </>
                )}

                <div className="p-1.5">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setAtlasMenuOpen(false);
                      setAboutOpen(true);
                    }}
                    className="cursor-pointer rounded-lg focus:bg-secondary"
                  >
                    <Info className="h-4 w-4" />
                    About Atlas
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setAtlasMenuOpen(false);
                      setResetConfirmOpen(true);
                    }}
                    className="cursor-pointer rounded-lg focus:bg-secondary"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Interview
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <form onSubmit={handleNavSearchSubmit} className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full rounded-lg border border-border bg-secondary/60 py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
              >
                Go
              </button>
            </form>

            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Upload className="h-3.5 w-3.5 text-primary" /> Import Data
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Toggle dark mode"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary"
                >
                  {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
                </button>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Settings"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <ImportDataModal open={importOpen} onClose={() => setImportOpen(false)} />

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the current interview session state. Candidate profiles and curriculum data are not affected.
              You can start a fresh interview afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetInterview}>Reset Interview</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endConfirmOpen} onOpenChange={setEndConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This ends the active interview session and clears its progress. Candidate profiles and curriculum data are
              not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndInterview}>End Interview</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About Atlas</DialogTitle>
            <DialogDescription>
              Atlas is an AI-powered technical interviewer that conducts personalized, multi-turn interviews based on
              the candidate's completed AI Engineering curriculum.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}