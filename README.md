# SwarHub

The active React frontend starts at `frontend/src/main.jsx`. See the [SwarHub project knowledge graph](docs/swarhub-graph.md) for routes, data flows, storage and source ownership. To open the local studio, run `npm run dev` from `frontend`.

## Earlier SwarLab project notes

**SwarLab** is a free-to-use modern music creation laboratory and version control platform for artists and producers. Capture ideas on the fly, analyze musical attributes with AI, organize layered takes in Git-inspired visual branch trees, and discover real-world music opportunities.

---

## ⚡ Core Sections

### 1. 🎙️ Capture
- Record audio/video straight from your browser or drag-and-drop your audio files.
- Instant AI analysis: **BPM, Musical Key, Frequency Range, Mood, Genre, Energy**, and detected instruments.
- Automatic **best short clip recommendation** optimized for social media shorts/reels.
- Completely free and usable anonymously without sign-up.

### 2. 🌳 Dashboard & Visual Branch Tree
- Manage all your music projects in a clean bento-grid dashboard.
- **Git-like branching system**: create dedicated branches for new instruments, takes, or layers (guitar, bass, vocals, synth) without duplicating projects.
- Interactive visual branch tree showing the full evolution and hierarchy of each song.

### 3. 🎯 Opportunities
- Explore curated gigs, music competitions, grants, and collaboration calls.
- Filter by category and apply directly through verified platform links (Unstop, open calls, indie portals).

---

## 🔐 Auth & Cloud Persistence

- **Free & Frictionless**: Create, record, and explore immediately as a guest.
- **Permanent Cloud Sync**: Sign in with Google OAuth or Email to save your projects, branches, and audio history.
- **Musician Profile**: Showcase your identity with an avatar, bio, recent projects, and a GitHub-style daily contribution activity graph.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Zustand.
- **Design System**: Dark music-lab aesthetic, subtle glassmorphism, responsive bento grids.
- **Backend**: Node.js & Express REST API.
- **Database & Auth**: Supabase Postgres & Supabase Auth (JWT + Google OAuth).
- **AI & Analysis Engine**: Audio processing pipeline for musical feature extraction and social clip detection.

---

## 📚 Documentation

Detailed specifications and architectural decisions can be found in [`/docs`](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs):
- [Product Requirements Document (PRD.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/PRD.md)
- [System Architecture (architecture.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/architecture.md)
- [Design System & UI Tokens (design.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/design.md)
- [Autonomous Agent Guidelines (agent.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/agent.md)
- [Testing Strategy (test.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/test.md)
- [Implementation Roadmap (roadmap.md)](file:///c:/Users/vivek/OneDrive/Desktop/GitHub/Git Music/docs/roadmap.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or pnpm

### Quick Start
```bash
# 1. Install and start backend
cd backend
npm install
npm run dev

# 2. In another terminal, start frontend
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend API runs on `http://localhost:3000`.
