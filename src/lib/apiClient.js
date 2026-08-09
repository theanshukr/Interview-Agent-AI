// Standalone API Client
// Provides persistence for candidates, interview sessions, and app settings in both Browser (localStorage) and Node (Memory).

import { seedCandidates } from "./seedCandidates";

const memoryStore = new Map();

const STORAGE_KEYS = {
  candidates: "ia_candidates",
  sessions: "ia_sessions",
  settings: "ia_settings",
  auth: "ia_auth_user",
};

function isStorageAvailable() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export const localStore = {
  getItem(key, fallback = null) {
    if (!isStorageAvailable()) {
      return memoryStore.has(key) ? memoryStore.get(key) : fallback;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  },

  setItem(key, value) {
    if (!isStorageAvailable()) {
      memoryStore.set(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  },

  removeItem(key) {
    if (!isStorageAvailable()) {
      memoryStore.delete(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  },
};

export const apiClient = {
  // Auth
  getCurrentUser() {
    return localStore.getItem(STORAGE_KEYS.auth, {
      id: "local-user-1",
      email: "recruiter@enterprise.ai",
      name: "Lead Interviewer",
      role: "admin",
    });
  },

  setCurrentUser(user) {
    localStore.setItem(STORAGE_KEYS.auth, user);
  },

  logoutUser() {
    localStore.removeItem(STORAGE_KEYS.auth);
  },

  // Settings
  getSettings() {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    const stored = localStore.getItem(STORAGE_KEYS.settings, {});
    const keyToUse = (stored && typeof stored.geminiApiKey === "string" && stored.geminiApiKey.trim()) ? stored.geminiApiKey.trim() : envKey;

    return {
      llmProvider: "gemini", // "built-in" | "gemini" | "ollama" | "openai"
      geminiApiKey: keyToUse,
      geminiModel: "gemini-2.0-flash",
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "qwen2.5-coder",
      openaiApiKey: "",
      openaiModel: "gpt-4o-mini",
      speechEnabled: false,
      speechRate: 1.0,
      theme: "dark",
      ...stored,
      geminiApiKey: keyToUse,
    };
  },

  saveSettings(newSettings) {
    const updated = { ...this.getSettings(), ...newSettings };
    localStore.setItem(STORAGE_KEYS.settings, updated);
    return updated;
  },

  // Reset Data
  resetAllData() {
    localStore.removeItem(STORAGE_KEYS.candidates);
    localStore.removeItem(STORAGE_KEYS.sessions);
    memoryStore.clear();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("candidates-changed"));
      window.dispatchEvent(new CustomEvent("sessions-changed"));
    }
  },

  resetSessions() {
    localStore.removeItem(STORAGE_KEYS.sessions);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sessions-changed"));
    }
  },

  // Candidates
  getCandidates() {
    let list = localStore.getItem(STORAGE_KEYS.candidates, null);
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = seedCandidates;
    }
    return list;
  },

  saveCandidates(candidates) {
    localStore.setItem(STORAGE_KEYS.candidates, candidates || []);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("candidates-changed"));
    }
  },

  // Sessions
  getSessions() {
    return localStore.getItem(STORAGE_KEYS.sessions, []);
  },

  saveSessions(sessions) {
    localStore.setItem(STORAGE_KEYS.sessions, sessions);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sessions-changed"));
    }
  },
};
