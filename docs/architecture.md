# SwarLab — Architecture

> **Version:** 1.0 | **Status:** Draft | **Date:** 2026-11-14

---

## 1. High-Level System Diagram

```mermaid
flowchart TD
    Browser["Browser\nReact + Vite + Tailwind"]
    API["Express API\nNode.js :3000"]
    AIService["AI Analysis\nPython / Gemini API"]
    DB["Supabase Postgres"]
    Storage["Supabase Storage\n(audio/video files)"]
    Auth["Supabase Auth\n(JWT + Google OAuth)"]

    Browser -->|REST / JSON| API
    API -->|analyzeAudio()| AIService
    AIService -->|tags + best-clip| API
    API -->|SQL| DB
    API -->|upload / signed URL| Storage
    Browser -->|OAuth flow| Auth
    Auth -->|JWT| Browser
    API -->|verify JWT| Auth
```

---

## 2. Frontend

| Item | Current | Target |
|---|---|---|
| Framework | Vite + React 18 | **Keep Vite + React** (no Next.js migration needed for v1) |
| Styling | Tailwind CSS | Tailwind CSS v3 (keep, works well) |
| Routing | React Router v6 | React Router v6 |
| State | Local `useState` | Zustand for global auth/project state |
| HTTP | Axios | Axios (keep) |
| Icons | Lucide React | Lucide React |

### Directory Structure (target)

```
frontend/src/
├── assets/
├── components/          # Reusable UI: Button, Card, BranchTree, AudioPlayer, ContribGraph
├── pages/               # Page-level: Capture, Dashboard, Opportunities, Profile, Login, Signup
├── hooks/               # useAuth, useProjects, useAudioRecorder, useAnalysis
├── store/               # Zustand: authStore, projectStore
├── lib/                 # api.js (axios instance + interceptors), utils.js
├── App.jsx
└── main.jsx
```

---

## 3. Backend (Node.js / Express)

### Existing Endpoints (keep + fix)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| POST | `/signup` | None | Email/password registration |
| POST | `/login` | None | Email/password login → JWT |
| GET | `/my-projects` | JWT | List user projects |
| POST | `/projects` | JWT | Create project |
| POST | `/versions` | JWT | Save audio version to project |
| GET | `/projects/:id/versions` | JWT | Get version history |
| POST | `/upload` | None | Upload + AI tag audio file |
| POST | `/record` | None | Record + AI tag audio |
| POST | `/branch` | None | Create branch from parent recording |
| DELETE | `/recordings/:id` | None | Recursive delete recording + children |
| GET | `/versions` | None | List all recordings |
| POST | `/analyze-audio` | None | Audio-only analysis (Node mode) |
| POST | `/analyze-description` | None | Text-based tag generation |

### New Endpoints Needed

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/opportunities` | None | Static/cached list of opportunities |
| GET | `/profile` | JWT | Get current user profile + contrib graph data |
| PUT | `/profile` | JWT | Update name, bio, avatar |
| POST | `/projects/:id/branches` | JWT | Create instrument branch on a project |
| GET | `/projects/:id/branches` | JWT | Get branch tree for a project |
| POST | `/auth/google` | None | Google OAuth callback handler |

### Critical Fixes Needed

1. **`JWT_SECRET = 'secret123'`** — hardcoded secret. Must move to `process.env.JWT_SECRET`
2. **No token refresh** — 7d tokens stored in `localStorage`. Switch to short-lived access token + refresh token in httpOnly cookie
3. **`/recordings/:id` DELETE** — not protected by auth (anyone can delete any recording)
4. **`/debug/tables` and `/debug/users`** — exposed debug routes must be removed in production
5. **Ollama dependency** — `generateTagsWithOllama` calls `localhost:11434` which is not available in production. Must have fallback to Gemini API or Python analysis service.
6. **No input validation / sanitization** on file uploads (multer only checks file exists, not file type/size)
7. **CORS** — `app.use(cors())` allows all origins; must restrict to frontend origin in production

---

## 4. AI Analysis Service

### Current State
- Uses Ollama (local `llama3` model) via `generateTagsWithOllama()`
- Fallback returns hardcoded placeholder data
- `/analyze-audio` notes "Audio-specific features (BPM, Key) are disabled in Node-only mode"

### Target: Hybrid Analysis

```
POST /analyze-audio
  ├── Receive: audio file (WebM/MP3/WAV)
  ├── Option A (Python microservice): 
  │   ├── librosa → actual BPM, spectral key, frequency range, energy
  │   └── Ollama / Gemini → genre, mood, instruments (text inference)
  └── Option B (Gemini API + heuristics):
      ├── Send audio metadata + waveform description to Gemini
      └── Return structured JSON tags
```

**Best-clip suggestion logic:**
- Analyze energy curve over time
- Find the 30-second window with peak energy variance (most dynamic section)
- Return `{ start_ms, end_ms, reason }`

---

## 5. Database Schema (Supabase / Postgres)

### Migration Plan: SQLite → Supabase Postgres

```sql
-- Users (managed by Supabase Auth — use auth.users)
-- We extend with a public profile table:

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES branches(id),          -- NULL = main take
  name            TEXT NOT NULL,                          -- e.g. "Main Take", "Guitar Layer v2"
  instrument_type TEXT,                                   -- e.g. "guitar", "drums", "vocals"
  file_url        TEXT,                                   -- Supabase Storage signed URL
  bpm             REAL,
  key             TEXT,
  mood            TEXT,
  genre           TEXT,
  instruments     TEXT[],
  freq_min        REAL,
  freq_max        REAL,
  energy          REAL,
  best_clip_start INTEGER,                                -- ms
  best_clip_end   INTEGER,                                -- ms
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  platform    TEXT,
  description TEXT,
  url         TEXT NOT NULL,
  deadline    DATE,
  type        TEXT CHECK (type IN ('gig','competition','grant','collab')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Activity for contribution graph
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,  -- 'capture', 'branch', 'project_created'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies (Supabase Row-Level Security)
- `projects`: users can only SELECT/INSERT/UPDATE/DELETE their own rows
- `branches`: users can only access branches belonging to their projects
- `profiles`: public SELECT, only owner can UPDATE
- `activity_logs`: only owner can SELECT/INSERT

---

## 6. Auth Flow

```
Email/Password:
  Browser → POST /auth/signup (Supabase Auth SDK) → email confirmation
  Browser → POST /auth/signin → { access_token, refresh_token }
  access_token stored in memory (Zustand), refresh_token in httpOnly cookie

Google OAuth:
  Browser → Supabase Auth signInWithOAuth({ provider: 'google' })
  → Google consent screen → Supabase callback → JWT issued

Protected API calls:
  Frontend adds `Authorization: Bearer <access_token>` header
  Backend (or Supabase Edge Functions) verifies JWT
```

---

## 7. File Storage (Supabase Storage)

```
Bucket: swarlab-audio  (private)
Path:   {user_id}/{project_id}/{branch_id}.{ext}

Upload flow:
  1. Frontend requests signed upload URL from backend
  2. Backend generates: supabase.storage.createSignedUploadUrl(...)
  3. Frontend uploads directly to Supabase Storage (browser → Supabase, bypassing backend)
  4. Frontend notifies backend with branch metadata + storage path
  5. Backend saves branch record to DB
```

---

## 8. Branching System (Data Model)

```
Project "Summer Vibes"
├── Branch: "Main Take"          (parent_id = NULL, instrument_type = "recording")
│   ├── Branch: "Guitar Layer"   (parent_id = main_take.id, instrument_type = "guitar")
│   │   └── Branch: "Guitar v2" (parent_id = guitar_layer.id)
│   ├── Branch: "Drum Loop"      (parent_id = main_take.id, instrument_type = "drums")
│   └── Branch: "Vocals"         (parent_id = main_take.id, instrument_type = "vocals")
```

The frontend renders this as a visual tree using a recursive component (`BranchTree`).

---

## 9. Deployment (Future)

| Service | Platform |
|---|---|
| Frontend | Vercel (Vite static) |
| Backend API | Railway or Render (Node.js) |
| DB + Auth + Storage | Supabase |
| Python AI Service | Modal.com or Railway (optional) |
