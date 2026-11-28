# SwarLab — Product Requirements Document

> **Version:** 1.0 | **Status:** Draft | **Date:** 2026-11-14

---

## 1. Vision

**SwarLab** is a free, browser-based music creation lab that lets any musician — from bedroom producer to seasoned artist — capture audio ideas instantly, understand them with AI, organize them in a Git-inspired branching system, and discover real opportunities to share their work with the world.

---

## 2. Target Users

| Persona | Description |
|---|---|
| **Bedroom Producer** | Makes beats/loops alone, needs fast capture → tag → organize |
| **Hobbyist Musician** | Records guitar riffs, voice memos; wants to track ideas over time |
| **Student / Learner** | Studying music theory; uses AI analysis to learn about their recordings |
| **Indie Artist** | Looking for gigs, competitions, collaborations |

---

## 3. Core Features

### 3.1 Capture
- Record audio directly in the browser (MediaRecorder API, WebM/Ogg)
- Upload existing audio/video files (MP3, WAV, MP4, WebM)
- AI analysis returns: **BPM, Key, Frequency Range, Mood, Genre, Energy level, Detected Instruments**
- AI suggests the **best short clip** for social media (30s highlight)
- Save results into a named Project

### 3.2 Dashboard
- View all user Projects in a bento-card grid
- Inside each Project: Git-inspired **branch tree** (visual hierarchy)
  - Main take → instrument layers (guitar, drums, vocals, piano, etc.)
  - Each branch stores its own audio file + AI analysis metadata
- Clicking left/right panel reveals branch tree with names
- Branch creates child node linked to parent — no new Project required

### 3.3 Opportunities
- Cards showing real music-related opportunities: gigs, competitions, grants, open calls
- Each card: title, platform, short description, deadline (if available), "Apply →" link to source
- Phase 1: static curated list; Phase 2: pulled from Unstop + similar platforms
- Filterable by type (gig / competition / grant / collab)

### 3.4 Auth & Profile
- **Completely free without account** — Capture/Browse work anonymously (data stored locally / not persisted on server)
- **Sign up / Login** to persist projects permanently
  - Email + password (via Supabase Auth)
  - JWT access token (stored in memory or httpOnly cookie, **not** localStorage long-term)
- **Profile page:**
  - Uploaded avatar
  - Display name + bio (editable)
  - 4–5 most recent projects preview
  - GitHub-style contribution graph (activity heatmap by day)

---

## 4. User Stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-01 | Visitor | Record audio without signing up | I can try instantly |
| US-02 | Visitor | See BPM, key, mood of my recording | I understand my music better |
| US-03 | Musician | Save recordings to a named project | I can organize ideas |
| US-04 | Musician | Branch from a recording | I can add layers without polluting the main take |
| US-05 | Musician | See a visual tree of branches | I understand the evolution of a track |
| US-06 | Artist | Browse opportunities | I can find gigs and competitions |
| US-07 | User | Log in with my email and password | I can reach my saved projects on any browser |
| US-08 | Logged-in User | See my contribution graph | I feel motivated to create daily |
| US-09 | Musician | Get a "best clip for social media" suggestion | I can post easily |

---

## 5. Success Metrics (Phase 1–3)

- ≤ 3 seconds from "Record" click to analysis result displayed
- Branch tree renders up to 20 nodes without lag
- Zero-login flow for Capture (no auth wall)
- Mobile-first: all flows work on 375px viewport
- Lighthouse Performance ≥ 85, Accessibility ≥ 90

---

## 6. Out of Scope (v1)

- Real-time collaboration (multi-user simultaneous editing)
- Full DAW (mixing, effects, EQ)
- Monetization / subscriptions
- Native mobile apps (iOS / Android)
- MIDI support
- Comment threads on recordings
- Public profile pages visible to other users (Phase 2+)
