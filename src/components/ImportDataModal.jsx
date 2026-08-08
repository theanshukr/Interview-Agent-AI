import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Upload, X, FileJson, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";
import { normalizeCandidateData } from "@/lib/candidateData";
import { bulkCreateCandidates, saveCandidate } from "@/lib/interviewApi";
import { seedCandidates } from "@/lib/seedCandidates";
import { cn } from "@/lib/utils";

const COHORT = "ai-eng-v1";

const emptyForm = () => ({
  candidateId: "",
  name: "",
  jobRole: "",
  currentPosition: "",
  yearsExperience: "",
  education: "",
  status: "COMPLETED",
  commitDays: "",
  missionsCompleted: "",
  missionsFirstTry: "",
  missions: [{ day: "", title: "", passed: true, skipped: false, attempts: "1" }],
});

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeImported(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.candidates ? raw.candidates : [];
  return arr
    .map((item) => normalizeCandidateData(item))
    .filter((candidate) => candidate.candidateId && candidate.name)
    .map((candidate) => ({ ...candidate, cohort: COHORT }));
}

export default function ImportDataModal({ open, onClose, onImported }) {
  const [tab, setTab] = useState("manual");
  const [form, setForm] = useState(emptyForm());
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setDone(null);
      setParsed(null);
      setFileName("");
    }
  }, [open]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateMission(idx, field, value) {
    setForm((f) => {
      const ms = f.missions.map((m, i) => (i === idx ? { ...m, [field]: value } : m));
      return { ...f, missions: ms };
    });
  }

  function addMission() {
    setForm((f) => ({
      ...f,
      missions: [...f.missions, { day: "", title: "", passed: true, skipped: false, attempts: "1" }],
    }));
  }

  function removeMission(idx) {
    setForm((f) => ({ ...f, missions: f.missions.filter((_, i) => i !== idx) }));
  }

  function formToCandidate() {
    const missions = form.missions
      .filter((m) => m.day && m.title)
      .map((m) => ({
        day: Number(m.day),
        title: m.title,
        passed: m.skipped ? false : !!m.passed,
        skipped: !!m.skipped,
        attempts: Number(m.attempts) || 0,
      }));
    const completed = missions.filter((m) => !m.skipped && m.passed).length;
    const mc = Number(form.missionsCompleted) || completed;
    const mft = Number(form.missionsFirstTry) || missions.filter((m) => m.attempts <= 1).length;
    const firstTryRate = mc > 0 ? mft / mc : 0.5;
    const readinessScore = Math.round(
      Math.min(100, Math.max(0, (completed / 31) * 60 + firstTryRate * 40))
    );
    return {
      candidateId: form.candidateId.trim(),
      name: form.name.trim(),
      jobRole: form.jobRole.trim(),
      currentPosition: form.currentPosition.trim() || form.jobRole.trim(),
      yearsExperience: Number(form.yearsExperience) || 0,
      education: form.education.trim(),
      status: form.status || "COMPLETED",
      cohort: COHORT,
      readinessScore,
      weakTopics: [...new Set(missions.filter((m) => !m.skipped && (m.attempts >= 4 || m.passed === false)).map((m) => m.title))],
      strengths: [...new Set(missions.filter((m) => !m.skipped && m.passed && m.attempts <= 1).map((m) => m.title))],
      missions,
      signals: {
        commitDays: Number(form.commitDays) || 0,
        missionsCompleted: mc,
        missionsFirstTry: mft,
      },
    };
  }

  async function handleFile(file) {
    setError(null);
    setDone(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      let records = [];
      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        records = normalizeImported(json);
      } else {
        const rows = parseCsv(text);
        records = rows
          .map((r) => ({
            candidateId: String(r.candidateId || r.id || ""),
            name: r.name || "",
            jobRole: r.jobRole || "",
            currentPosition: r.currentPosition || r.jobRole || "",
            yearsExperience: Number(r.yearsExperience) || 0,
            education: r.education || "",
            status: r.status || "COMPLETED",
            missions: r.missions ? (typeof r.missions === "string" ? JSON.parse(r.missions) : r.missions) : [],
            signals: r.signals ? (typeof r.signals === "string" ? JSON.parse(r.signals) : r.signals) : {},
          }))
          .filter((r) => r.candidateId && r.name);
        records = normalizeImported(records);
      }
      if (!records.length) {
        setError("No valid candidates found in the file. Ensure each has an id/candidateId and name.");
        setParsed(null);
        return;
      }
      setParsed(records);
    } catch (e) {
      setError("Could not parse file: " + (e?.message || "invalid format"));
      setParsed(null);
    }
  }

  async function importParsed() {
    if (!parsed?.length) return;
    setBusy(true);
    setError(null);
    try {
      const created = await bulkCreateCandidates(parsed);
      const count = Array.isArray(created) ? created.length : parsed.length;
      setDone(`${count} candidate${count === 1 ? "" : "s"} imported successfully.`);
      setParsed(null);
      setFileName("");
      window.dispatchEvent(new CustomEvent("candidates-changed"));
      onImported?.();
    } catch (e) {
      setError("Import failed: " + (e?.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  }

  async function submitManual(e) {
    e?.preventDefault();
    setError(null);
    setDone(null);
    if (!form.candidateId.trim() || !form.name.trim()) {
      setError("Candidate ID and Name are required.");
      return;
    }
    setBusy(true);
    try {
      const candidate = formToCandidate();
      await saveCandidate(candidate);
      setDone(`${candidate.name} imported successfully.`);
      setForm(emptyForm());
      window.dispatchEvent(new CustomEvent("candidates-changed"));
      onImported?.();
    } catch (e) {
      setError("Import failed: " + (e?.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  }

  async function importSeedCandidates() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const payload = seedCandidates.map((candidate) => ({
        ...candidate,
        readinessScore: Math.round(
          Math.min(100, Math.max(0, (candidate.missions.filter((m) => !m.skipped && m.passed).length / 31) * 60 + ((candidate.missions.filter((m) => !m.skipped && m.attempts <= 1).length / Math.max(1, candidate.missions.filter((m) => !m.skipped && m.passed).length)) || 0.5) * 40))
        ),
      }));
      const created = await bulkCreateCandidates(payload);
      const count = Array.isArray(created) ? created.length : payload.length;
      setDone(`${count} seed candidates imported successfully.`);
      window.dispatchEvent(new CustomEvent("candidates-changed"));
      onImported?.();
    } catch (e) {
      setError("Import failed: " + (e?.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="card my-auto w-full max-w-2xl rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Import Candidates</h2>
                <p className="text-xs text-muted-foreground">Add profiles manually, upload a JSON/CSV file, or load the built-in 20-user seed set.</p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border px-6 pt-3">
              {[
                { id: "manual", label: "Manual entry" },
                { id: "upload", label: "Upload file" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
                    tab === t.id
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <div className="mb-4 rounded-xl border border-border bg-surface/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Seed 20 candidates</div>
                    <div className="text-xs text-muted-foreground">Load the built-in cohort dataset matching the app’s candidate schema.</div>
                  </div>
                  <button
                    type="button"
                    onClick={importSeedCandidates}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Import 20 users
                  </button>
                </div>
              </div>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
                  {error}
                </div>
              )}
              {done && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success ring-1 ring-success/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {done}
                </div>
              )}

              {tab === "manual" && (
                <form onSubmit={submitManual} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Candidate ID *">
                      <input className="modal-input" value={form.candidateId} onChange={(e) => update("candidateId", e.target.value)} placeholder="CAND-001" />
                    </Field>
                    <Field label="Name *">
                      <input className="modal-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Sarah Johnson" />
                    </Field>
                    <Field label="Job role">
                      <input className="modal-input" value={form.jobRole} onChange={(e) => update("jobRole", e.target.value)} placeholder="Senior Data Engineer" />
                    </Field>
                    <Field label="Current position">
                      <input className="modal-input" value={form.currentPosition} onChange={(e) => update("currentPosition", e.target.value)} placeholder="Senior Data Engineer" />
                    </Field>
                    <Field label="Years experience">
                      <input type="number" className="modal-input" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} placeholder="9" />
                    </Field>
                    <Field label="Education">
                      <input className="modal-input" value={form.education} onChange={(e) => update("education", e.target.value)} placeholder="MS Computer Science" />
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Commit days">
                      <input type="number" className="modal-input" value={form.commitDays} onChange={(e) => update("commitDays", e.target.value)} placeholder="28" />
                    </Field>
                    <Field label="Missions completed">
                      <input type="number" className="modal-input" value={form.missionsCompleted} onChange={(e) => update("missionsCompleted", e.target.value)} placeholder="30" />
                    </Field>
                    <Field label="First-try passes">
                      <input type="number" className="modal-input" value={form.missionsFirstTry} onChange={(e) => update("missionsFirstTry", e.target.value)} placeholder="20" />
                    </Field>
                  </div>

                  {/* Missions */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Missions</span>
                      <button type="button" onClick={addMission} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                        <Plus className="h-3 w-3" /> Add mission
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.missions.map((m, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-2.5">
                          <Field label="Day" compact>
                            <input type="number" className="modal-input-sm" value={m.day} onChange={(e) => updateMission(i, "day", e.target.value)} placeholder="7" />
                          </Field>
                          <div className="min-w-[140px] flex-1">
                            <Field label="Title" compact>
                              <input className="modal-input-sm" value={m.title} onChange={(e) => updateMission(i, "title", e.target.value)} placeholder="Embeddings Explained" />
                            </Field>
                          </div>
                          <Field label="Attempts" compact>
                            <input type="number" className="modal-input-sm" value={m.attempts} onChange={(e) => updateMission(i, "attempts", e.target.value)} placeholder="1" />
                          </Field>
                          <label className="flex items-center gap-1.5 pb-1.5 text-xs text-muted-foreground">
                            <input type="checkbox" checked={m.passed} onChange={(e) => updateMission(i, "passed", e.target.checked)} />
                            Passed
                          </label>
                          <label className="flex items-center gap-1.5 pb-1.5 text-xs text-muted-foreground">
                            <input type="checkbox" checked={m.skipped} onChange={(e) => updateMission(i, "skipped", e.target.checked)} />
                            Skipped
                          </label>
                          <button type="button" onClick={() => removeMission(i)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Remove mission">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Save candidate
                    </button>
                  </div>
                </form>
              )}

              {tab === "upload" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".json,.csv,application/json,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {fileName?.toLowerCase().endsWith(".csv") ? <FileSpreadsheet className="h-6 w-6" /> : <FileJson className="h-6 w-6" />}
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {fileName || "Click to choose a JSON or CSV file"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JSON: nested {`{ candidates: [{ member, missions, signals }] }`} or flat array. CSV: candidateId, name, jobRole, yearsExperience, education, status.
                    </p>
                  </div>

                  {parsed && (
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{parsed.length} candidate{parsed.length === 1 ? "" : "s"} ready to import</span>
                        <span className="text-xs text-muted-foreground">All existing candidates will be preserved.</span>
                      </div>
                      <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
                        {parsed.map((c, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5 text-xs">
                            <span className="font-medium text-foreground">{c.name}</span>
                            <span className="text-muted-foreground">{c.candidateId} · {c.missions?.length || 0} missions</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="button" onClick={importParsed} disabled={busy || !parsed} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Import {parsed?.length || ""} candidate{parsed?.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children, compact }) {
  return (
    <div className={compact ? "" : "grid gap-1"}>
      <label className={cn("text-xs font-medium text-muted-foreground", compact && "mb-0.5 block")}>{label}</label>
      {children}
    </div>
  );
}