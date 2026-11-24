# SwarLab — Component Architecture & Reuse Inventory

> **Phase:** Frontend Only | **Status:** Active Reference | **Date:** 2026-11-14

---

## 1. Component Reuse, Refactor & Replacement Decisions

| Existing Component | Current Status | Decision | Strategy & Justification |
|---|---|---|---|
| `frontend/src/components/AnalysePage.jsx` | Functional in `/analyse` route; handles audio capture, WaveSurfer preview, analysis metrics, and saving to projects. | **Refactor** | Split into the modern `CapturePage` route and modular subcomponents (`AnalysisPanel`, `MetricCard`, `SaveToProjectModal`). Rebrand styling from hot-pink (`#FF2E63`) to dark lab violet (`#7C3AED`) and sky blue (`#38BDF8`). |
| `frontend/src/components/Recorder.jsx` | Implements mic recording, basic WaveSurfer, and `/record` / `/branch` API calls. | **Refactor** | Extract reusable audio recording logic into a clean `AudioRecorder` component used across both Capture and Dashboard branch-take creation. Fix dual `setIsSaving` state bug. |
| `frontend/src/components/VersionTree.jsx` | Built with recursive parent-child tree rendering (`VersionNode`), playback, and delete actions; currently orphaned in `App.jsx`. | **Refactor & Elevate** | **Keep and improve.** Do NOT replace with a third-party graph library. Elevate into `BranchTree.jsx` with instrument badges (Vocals, Guitar, Drums, Bass, Synth), commit timestamps, and inline take preview. |
| `frontend/src/components/HomePage.jsx` | Functional landing page, but branded with legacy "Git Music" and hot-pink gradients. | **Refactor** | Update copy to "SwarLab", redirect hero CTAs to `/capture` and `/dashboard`, and adopt the dark laboratory bento card styling. |
| `frontend/src/components/LoginPage.jsx` | Working authentication form communicating with `POST /login`. | **Refactor** | Update branding to SwarLab, align color tokens, and add accessible keyboard focus styles. Preserve existing API response handling. |
| `frontend/src/components/SignupPage.jsx` | Working user creation form communicating with `POST /signup`. | **Refactor** | Update branding to SwarLab, align color tokens, and add accessible keyboard focus styles. |
| `frontend/src/pages/AnalysePage.jsx` | 269-line duplicate file with canvas visualizer; never imported anywhere in the app. | **Deprecate (Replace)** | Marked as dead code. The production Capture page will supersede it. Retained untouched during this step to prevent unintended breaking changes. |
| `frontend/src/App.css` | 184 lines of boilerplate Vite demo code (`.counter`, `.hero`, `#next-steps`). | **Deprecate (Replace)** | Marked for retirement. Custom styles will be migrated into clean Tailwind v4 `@theme` and semantic utility classes in `index.css`. |

---

## 2. Component Inventory by Domain

### 2.1 Page Components (`frontend/src/pages/`)
- `HomePage.jsx` — Public landing page presenting the SwarLab philosophy, laboratory capabilities, and call-to-actions.
- `CapturePage.jsx` — The core audio workstation: input capture, waveform inspection, analysis results, and project commitment.
- `DashboardPage.jsx` — Project management hub: bento project cards, split-pane repository view, and the visual branch tree.
- `OpportunitiesPage.jsx` — Music industry discovery portal: filterable gig, contest, and grant cards.
- `ProfilePage.jsx` — Musician showcase: bio, project summary, and daily contribution activity heatmap.
- `LoginPage.jsx` & `SignupPage.jsx` — User authentication and registration portals.

### 2.2 Shell & Navigation Components (`frontend/src/components/shell/`)
- `NavBar.jsx` — Desktop floating glass pill with logo, primary navigation links, search, and auth trigger.
- `MobileNav.jsx` — Accessible slide-out glass drawer for mobile viewports (<768px).
- `PageContainer.jsx` — Standardized wrapper providing max-width boundary (`max-w-6xl`), responsive padding, and top-bar offset.

### 2.3 Audio & Waveform Components (`frontend/src/components/audio/`)
- `AudioRecorder.jsx` — Direct microphone input handler with timer, pulse indicator, and stop control.
- `DropZone.jsx` — Drag-and-drop file upload target supporting `.mp3`, `.wav`, `.m4a`, and `.webm`.
- `WaveformPlayer.jsx` — Robust `wavesurfer.js` container providing interactive seek, play/pause toggles, and duration tracking.
- `VideoPlaceholderCard.jsx` — Explanatory card indicating video capture support is scheduled for future release.

### 2.4 Analysis & Metrics Components (`frontend/src/components/analysis/`)
- `AnalysisPanel.jsx` — Bento layout presenting tempo, scale key, frequency range, mood, and detected instruments.
- `MetricCard.jsx` — Reusable data card pairing a technical icon, label, and monospace numerical value.
- `InferenceBadge.jsx` — Transparency tag labeling results as "AI Inferred (Text/Heuristic)" vs "Verified DSP".
- `BestClipCard.jsx` — Highlight panel proposing a 15s–30s snippet recommendation optimized for social media reels.

### 2.5 Projects & Branch Tree Components (`frontend/src/components/dashboard/`)
- `ProjectCard.jsx` — Bento card summarizing project title, visibility (public/private), commit count, and creation date.
- `ProjectInspector.jsx` — Left-hand detail pane showing project metadata, audio export options, and new take triggers.
- `BranchTree.jsx` — Recursive tree component visualizing root takes and instrument layers.
- `BranchNode.jsx` — Individual tree node displaying instrument badge, timestamp, play button, and branch-off action.
- `CreateProjectModal.jsx` — Dialog for initializing a new song project.
- `CreateBranchModal.jsx` — Dialog for attaching a new instrument take to an existing parent node.

### 2.6 Opportunities Components (`frontend/src/components/opportunities/`)
- `OpportunityCard.jsx` — Structured bento card: platform badge, title, category, description, deadline, and secure external apply link.
- `OpportunityFilterBar.jsx` — Horizontal pill buttons for toggling between All, Gigs, Competitions, Grants, and Collabs.

### 2.7 Profile Components (`frontend/src/components/profile/`)
- `ProfileHeader.jsx` — Musician avatar, handle, editable bio, and guest sign-in banner.
- `ContribGraph.jsx` — GitHub-style 52-week activity heatmap illustrating musical creation habits.
- `RecentProjectList.jsx` — Compact list of the user's latest active song repositories.

### 2.8 Shared Feedback & Utility Components (`frontend/src/components/ui/`)
- `BentoCard.jsx` — Standard glassmorphism container with frosted backdrop blur and fine border.
- `Button.jsx` — Button variants: `primary`, `secondary`, `ghost`, `danger`, `recording`.
- `Badge.jsx` — Categorical chips with distinct semantic colors (Violet, Sky Blue, Emerald, Amber, Red).
- `EmptyState.jsx` — Consistent placeholder with an icon, title, description, and primary CTA.
- `LoadingSkeleton.jsx` — Shimmering placeholder cards during data fetching.
- `StatusBanner.jsx` — Animated notification for success confirmations and network error alerts.
