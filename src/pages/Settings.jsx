import React, { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

import { apiClient } from "@/lib/apiClient";

const DEFAULTS = {
  model: "gemini",
  llmProvider: "gemini",
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  temperature: 30, // 0-100 -> 0.0-1.0
  difficulty: "5",
  duration: "30",
  feedbackDetail: "standard",
  language: "en",
  theme: "dark",
};

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    try {
      const stored = apiClient.getSettings();
      setS({ ...DEFAULTS, ...stored, model: stored.llmProvider || stored.model || "gemini" });
    } catch {
      /* ignore */
    }
  }, []);

  function save(next) {
    setS(next);
    setSaved(false);
  }

  function commit() {
    const updated = { ...s, llmProvider: s.model };
    apiClient.saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">

      <TopNav />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how the AI Interview Agent runs. Preferences are stored locally on this device.
        </p>

        <div className="card mt-6 grid gap-5 rounded-2xl p-6">
          <Field label="LLM Provider Engine" hint="Select how Atlas processes technical interview responses.">
            <Select value={s.model} onValueChange={(v) => save({ ...s, model: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google AI Studio (Gemini 1.5 / 2.0 Flash)</SelectItem>
                <SelectItem value="built-in">Built-in Standalone Engine (Offline / Zero API dependency)</SelectItem>
                <SelectItem value="ollama">Local Ollama Server (http://localhost:11434)</SelectItem>
                <SelectItem value="openai">OpenAI API (GPT-4o / GPT-4o-mini)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {s.model === "gemini" && (
            <div className="rounded-xl border border-border/80 bg-surface/50 p-4 space-y-3 text-xs">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>Google AI Studio Configuration</span>
                <span className="text-emerald-500 font-mono text-[11px]">● API Key Active</span>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground">Gemini API Key</label>
                <input
                  type="password"
                  value={s.geminiApiKey || ""}
                  onChange={(e) => save({ ...s, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {s.model === "ollama" && (
            <div className="rounded-xl border border-border/80 bg-surface/50 p-3 space-y-2 text-xs">
              <div className="font-semibold text-foreground">Ollama Configuration</div>
              <p className="text-muted-foreground">Ensure Ollama is running locally with <code className="bg-background px-1 py-0.5 rounded text-primary">ollama run qwen2.5-coder</code>.</p>
            </div>
          )}


          <Field label={`Temperature · ${(s.temperature / 100).toFixed(2)}`} hint="Lower = more focused. Higher = more exploratory.">
            <Slider value={[s.temperature]} min={0} max={100} step={5} onValueChange={([v]) => save({ ...s, temperature: v })} />
          </Field>

          <Field label="Default question difficulty" hint="Starting difficulty on a 1–10 scale.">
            <Select value={s.difficulty} onValueChange={(v) => save({ ...s, difficulty: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 · Foundational</SelectItem>
                <SelectItem value="5">5 · Mid</SelectItem>
                <SelectItem value="7">7 · Senior</SelectItem>
                <SelectItem value="9">9 · Staff</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Interview duration" hint="Target length before Atlas wraps up.">
            <Select value={s.duration} onValueChange={(v) => save({ ...s, duration: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Feedback detail" hint="How verbose the final report is.">
            <Select value={s.feedbackDetail} onValueChange={(v) => save({ ...s, feedbackDetail: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">Theme</div>
              <div className="text-xs text-muted-foreground">Toggle dark mode across the entire app. Persists after refresh.</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{isDark ? "Dark" : "Light"}</span>
              <Switch
                checked={isDark}
                onCheckedChange={toggle}
                aria-label="Theme toggle"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={commit}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save preferences
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-sm text-success animate-fade-in">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
            </div>

            <button
              onClick={() => {
                if (window.confirm("Reset candidates and interview session data to seed defaults?")) {
                  localStorage.removeItem("ia_candidates");
                  localStorage.removeItem("ia_sessions");
                  window.dispatchEvent(new CustomEvent("candidates-changed"));
                  alert("Local candidate data re-initialized!");
                }
              }}
              className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              Reset local candidate storage
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}