# Enterprise AI Interview Agent 🚀

> **Curriculum-Aware Technical Interview & Candidate Evaluation Platform**
> Built with React 18, Vite, Tailwind CSS, Recharts, and Lucide Icons.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-Click_Here_to_Launch-brightgreen?style=for-the-badge&logo=github)](https://theanshukr.github.io/Interview-Agent-AI/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/theanshukr/Interview-Agent-AI)

---

## 🔗 Live Demo

👉 **Experience the Live Interactive App**: [https://theanshukr.github.io/Interview-Agent-AI/](https://theanshukr.github.io/Interview-Agent-AI/)

---

## 🌟 Overview

**Enterprise AI Interview Agent** is an end-to-end, curriculum-aware AI platform designed to conduct dynamic, adaptive technical interviews for software and AI engineering roles. It automatically scales question difficulty, tracks curriculum mastery, provides interactive code scratchpads, and synthesizes 7-competency evaluation reports with single-click PDF exporting.

---

## ✨ Core Features

- 🧠 **Adaptive AI Interviewer**: Grounded in an 8-topic AI Engineering curriculum (from setup to vector search & RAG pipelines) with dynamic intent detection (`VALID_ANSWER`, `SKIP`, `GIBBERISH`).
- 📈 **Real-Time Difficulty Scaling**: Evaluates response depth on a 1–10 scale and dynamically shifts follow-up questions based on candidate performance.
- 💻 **Interactive Code Scratchpad**: Integrated live coding & SQL sandbox with real-time evaluation.
- 📊 **7-Competency Radar Evaluation**: Provides visual breakdown across Knowledge, Accuracy, Communication, Confidence, Depth, Reasoning, and Practical application.
- 📄 **Executive PDF Export**: High-fidelity single-click post-interview report generation using `jspdf` and `html2canvas`.
- 👥 **Candidate Onboarding & Management**: Candidate pipeline dashboard with bulk JSON/CSV import capabilities.
- ⚡ **Zero Remote Dependencies Option**: Operates 100% client-side with mock engine, or connects seamlessly to local Ollama / OpenAI endpoints.

---

## 🌐 Live Demo & Deployment Guide

### Option 1: GitHub Pages Deployment (Automated via GitHub Actions)
This project includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/theanshukr/Interview-Agent-AI.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and deploy your site to:
   `https://theanshukr.github.io/Interview-Agent-AI/`

### Option 2: GitHub Pages Manual Deployment (`gh-pages`)
Run the deployment script directly from your terminal:
```bash
npm run deploy
```

### Option 3: Deploying on Vercel / Netlify
- **Vercel**: Import your repository into [Vercel](https://vercel.com). Framework preset: `Vite`. Build command: `npm run build`, Output directory: `dist`.
- **Netlify**: Import project into [Netlify](https://netlify.com). Build command: `npm run build`, Publish directory: `dist`.

---

## 🛠️ Environment Configuration (`.env`)

This project uses Vite environment variables. Sample templates are provided in `.env.example`.

### Creating `.env` File
Create a `.env` file in the root directory:
```bash
# Copy from example
cp .env.example .env
```

### Supported Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_APP_TITLE` | Application Title | `AI Interview Agent` |
| `VITE_APP_DESCRIPTION` | Subtitle / Short Description | `Curriculum-aware AI Technical Interview Platform` |
| `VITE_ENABLE_MOCK_ENGINE` | Enable offline candidate/interview mock engine | `true` |
| `VITE_OLLAMA_HOST` | Local Ollama server endpoint | `http://localhost:11434` |
| `VITE_OPENAI_API_KEY` | (Optional) OpenAI API Key for live LLM response | `sk-...` |

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd "Interview Agent AI"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Scripts Overview

```bash
# Start Vite development server
npm run dev

# Build production distribution into dist/
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Run TypeScript type check
npm run typecheck

# Deploy to GitHub Pages
npm run deploy
```

---

## 📁 Repository Structure

```
├── .github/workflows/deploy.yml   # GitHub Actions deployment workflow
├── src/
│   ├── api/                       # Base44 SDK client
│   ├── components/                # Reusable UI components & Layouts
│   │   ├── candidate/             # Candidate card, onboarding modal
│   │   ├── interview/             # CodeSandbox, InterviewerCard, Report
│   │   └── ui/                    # Buttons, Badges, Tabs, Radix components
│   ├── lib/                       # Core engine, interview API, seed data
│   │   ├── interviewApi.js        # Dynamic adaptive question engine
│   │   ├── apiClient.js           # Client-side persistence engine
│   │   └── candidateData.js       # Data normalization & metrics
│   ├── pages/                     # Application routes
│   │   ├── Dashboard.jsx          # Executive candidate metrics
│   │   ├── Candidates.jsx         # Candidate roster & onboarding
│   │   ├── InterviewSession.jsx   # Live interactive interview interface
│   │   ├── PostInterviewReport.jsx# 7-competency radar breakdown & PDF export
│   │   └── Settings.jsx           # Model & API configuration
│   ├── App.jsx                    # Navigation router
│   └── main.jsx                   # React entry point
├── .env.example                   # Environment variable template
├── .env                           # Local environment file (git-ignored)
├── .gitignore                     # Git exclusion settings
├── package.json                   # Project scripts and dependencies
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.js                 # Vite bundler configuration
```

---

## 🛡️ License & Contributing

Built with ❤️ for AI Engineering and Technical Assessment workflows. Free for personal and commercial use.
