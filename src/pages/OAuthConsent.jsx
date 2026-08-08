import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Link } from "react-router-dom";

export default function OAuthConsent() {
  const [submitting, setSubmitting] = useState(false);
  const [decided, setDecided] = useState("");

  const handleDecision = (approved) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDecided(approved ? "approved" : "denied");
    }, 400);
  };

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Client Authorization"
      subtitle="Grant permission to access AI Interview Agent services"
      footer={
        <Link to="/dashboard" className="text-primary font-medium hover:underline text-xs">
          Return to Dashboard
        </Link>
      }
    >
      {decided ? (
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">
            {decided === "approved" ? "Access Granted" : "Access Denied"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {decided === "approved"
              ? "Your client application has been successfully authorized."
              : "The authorization request was declined."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4 text-xs space-y-2">
            <div className="font-semibold text-foreground">Requested Scope</div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Candidate Curriculum & Readiness Records</li>
              <li>AI Adaptive Interview Execution & Session Logs</li>
              <li>7-Competency Feedback & Evaluation Synthesis</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11"
              disabled={submitting}
              onClick={() => handleDecision(false)}
            >
              Deny
            </Button>
            <Button
              className="flex-1 h-11 bg-primary text-primary-foreground font-semibold"
              disabled={submitting}
              onClick={() => handleDecision(true)}
            >
              Approve Access
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
