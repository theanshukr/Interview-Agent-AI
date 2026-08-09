import { useEffect, useRef, useState } from "react";
import { subscribeNow } from "@/lib/nowTicker";

// A single 60-minute countdown timer belongs to the ENTIRE interview.
export const INTERVIEW_DURATION_MS = 60 * 60 * 1000;

// Reliable start/end timestamp approach. Rather than decrementing a state
// variable every second, we derive remaining time from persisted timestamps so
// the countdown stays accurate across re-renders, tab switches, and refreshes.
function getRemainingMs({ status, interviewEndTime, pausedRemainingMs }) {
  if (status === "completed" || status === "expired") return 0;
  if (status === "paused") return Math.max(0, Number(pausedRemainingMs) || 0);
  if (interviewEndTime) {
    return Math.max(0, new Date(interviewEndTime).getTime() - Date.now());
  }
  return INTERVIEW_DURATION_MS;
}

export function useInterviewTimer({ status, interviewEndTime, pausedRemainingMs, onExpire, disabled = false }) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingMs({ status, interviewEndTime, pausedRemainingMs })
  );
  const [expired, setExpired] = useState(false);

  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Recompute immediately whenever the authoritative inputs change
  // (e.g. pause/resume events, refresh restoring a timestamp).
  useEffect(() => {
    setRemaining(getRemainingMs({ status, interviewEndTime, pausedRemainingMs }));
  }, [status, interviewEndTime, pausedRemainingMs]);

  // Tick off the shared app heartbeat. The interval lives in nowTicker so
  // multiple components never create competing countdown timers.
  useEffect(() => {
    const isRunning = status === "active" && !disabled && interviewEndTime;
    if (!isRunning) return undefined;

    const tick = () => {
      const r = Math.max(0, new Date(interviewEndTime).getTime() - Date.now());
      setRemaining(r);
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true;
        setExpired(true);
      }
    };

    tick();
    return subscribeNow(tick);
  }, [status, interviewEndTime, disabled]);

  useEffect(() => {
    if (expired) onExpireRef.current?.();
  }, [expired]);

  return { remaining, expired };
}
