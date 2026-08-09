import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  endActiveSession,
  getActiveSession,
  interview,
  resumeSession,
} from "@/lib/interviewApi";
import { useToast } from "@/components/ui/use-toast";

// Ensures only ONE candidate can have an active interview at a time.
// - If a live interview exists for a DIFFERENT candidate, asks for confirmation
//   before replacing the current session.
// - If a live interview exists for the SAME candidate, resumes it instead of
//   starting over (restores the exact previous interview state).
export function useInterviewStarter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startingId, setStartingId] = useState(null);
  const [switchInfo, setSwitchInfo] = useState(null);

  const beginNewInterview = useCallback(
    async (candidate) => {
      setStartingId(candidate.candidateId);
      try {
        const sessionId = crypto.randomUUID();
        const res = await interview({ sessionId, candidate });
        navigate(`/interview/${sessionId}`, {
          state: {
            reply: res.reply,
            candidate,
            status: res.status,
            questionNumber: res.questionNumber,
            currentDay: res.currentDay,
            currentTopic: res.currentTopic,
            difficulty: res.difficulty,
            coveredDays: res.coveredDays,
            targetQuestions: res.targetQuestions,
            interviewStartedAt: res.interviewStartedAt,
            interviewEndTime: res.interviewEndTime,
            pausedRemainingMs: res.pausedRemainingMs,
          },
        });
      } catch (e) {
        const credits =
          e?.creditsExhausted ||
          /limit of integrations|upgrade your plan|credits exhausted/i.test(e?.message || "");
        toast({
          title: credits ? "Integration credits exhausted" : "Could not start interview",
          description: credits
            ? "The workspace is out of AI integration credits. Upgrade your plan or wait for credits to reset to run interviews."
            : e?.message || "unknown error",
          variant: "destructive",
        });
      } finally {
        setStartingId(null);
      }
    },
    [navigate, toast]
  );

  const startInterview = useCallback(
    (candidate) => {
      const active = getActiveSession();
      const activeId = active?.candidate?.candidateId;
      if (active && activeId && activeId !== candidate.candidateId) {
        setSwitchInfo({ activeSession: active, targetCandidate: candidate });
        return;
      }
      if (active && activeId === candidate.candidateId) {
        resumeSession(active.sessionId);
        navigate(`/interview/${active.sessionId}`);
        return;
      }
      beginNewInterview(candidate);
    },
    [beginNewInterview, navigate]
  );

  const confirmSwitch = useCallback(async () => {
    if (!switchInfo) return;
    const target = switchInfo.targetCandidate;
    setSwitchInfo(null);
    endActiveSession();
    await beginNewInterview(target);
  }, [switchInfo, beginNewInterview]);

  const continueActive = useCallback(() => {
    if (!switchInfo) return;
    const active = switchInfo.activeSession;
    setSwitchInfo(null);
    if (active?.status === "paused") resumeSession(active.sessionId);
    navigate(`/interview/${active.sessionId}`);
  }, [switchInfo, navigate]);

  const cancelSwitch = useCallback(() => setSwitchInfo(null), []);

  return { startingId, switchInfo, startInterview, confirmSwitch, continueActive, cancelSwitch };
}
