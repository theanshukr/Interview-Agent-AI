import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors">
      {/* soft ambient wash */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8 sm:px-10">
        <Link to="/" className="flex items-center">
          <Logo size={28} />
        </Link>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Operations dashboard
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[900px] flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Adaptive · curriculum-grounded · evidence-based
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-8 font-display text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-7xl"
        >
          AI Cohort
          <br />
          <span className="text-primary">Interviewer</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Your learning journey.
          <br />
          Your technical interview.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10"
        >
          <Link
            to="/select"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            Start Interview
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          The interviewer listens, understands what you know, and decides what to ask next.
        </motion.p>
      </main>
    </div>
  );
}
