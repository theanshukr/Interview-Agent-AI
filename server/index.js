// Express Server Entry Point
// Implements POST /api/interview endpoint for Enterprise AI Interview Agent

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { processInterviewRequest } from "./engine.js";
import { sessionStore } from "./sessionStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeSessions: sessionStore.list().length });
});

// Reset all active server sessions
app.post("/api/reset", (req, res) => {
  sessionStore.clear();
  res.json({ status: "ok", message: "All active interview sessions have been reset." });
});

// Single Technical Spec Endpoint: POST /api/interview
app.post("/api/interview", async (req, res) => {
  try {
    const apiKey =
      req.headers["x-gemini-api-key"] ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      null;

    const result = await processInterviewRequest(req.body, apiKey);
    res.json(result);
  } catch (err) {
    console.error("Error processing /api/interview request:", err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      error: err.message || "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Interview Agent Backend listening on http://localhost:${PORT}`);
});
