import React from "react";
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

function displayName(entity) {
  const c = entity?.candidate || entity || {};
  const member = c.member || c;
  return member.name || c.name || "Candidate";
}

// Warns the user before replacing the current live interview session with a
// different candidate's interview. Nothing is changed unless confirmed.
export default function InterviewSwitchDialog({ activeSession, targetCandidate, onConfirm, onContinue, onCancel }) {
  const currentName = displayName(activeSession);
  const targetName = displayName(targetCandidate);
  const isPaused = activeSession?.status === "paused";
  const currentState = isPaused ? "paused" : "active";

  return (
    <AlertDialog open={!!(activeSession && targetCandidate)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Active Interview in Progress</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              {currentName}&rsquo;s interview is currently {currentState}.
            </p>
            <p className="mt-2">
              Starting {targetName}&rsquo;s interview will reset {currentName}&rsquo;s current interview
              session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2 sm:justify-between">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {onContinue && (
              <AlertDialogAction
                onClick={onContinue}
                className="border border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
              >
                Continue {currentName}&rsquo;s interview
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={onConfirm}>Start {targetName}</AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
