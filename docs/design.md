# SwarLab — Design System

> **Version:** 1.0 | **Status:** Draft | **Date:** 2026-11-14

---

## 1. Design Direction

**Theme:** Dark music laboratory — precise, premium, alive.  
**Mood:** A studio at 2am. Neon reflections on a glass desk. Everything works; nothing is loud.  
**Anti-patterns to avoid:** Generic SaaS purple-gradient, Bootstrap grids, flat white backgrounds, excessive animations.

---

## 2. Color Palette

### Core Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#09090E` | Page background (near-black with blue-black tint) |
| `--surface` | `#111118` | Card / panel background |
| `--surface-elevated` | `#1A1A26` | Hover state surface, modals |
| `--border` | `rgba(255,255,255,0.08)` | Default border |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Dividers, low-contrast edges |
| `--primary` | `#7C3AED` | Main accent — Violet (trust, creativity) |
| `--primary-hover` | `#6D28D9` | Darker violet on hover |
| `--accent` | `#38BDF8` | Secondary accent — Sky blue (data, analysis) |
| `--accent-green` | `#34D399` | Success, public, active states |
| `--accent-orange` | `#FBBF24` | Warnings, energy level, BPM highlight |
| `--text-primary` | `#F1F0F5` | Main readable text |
| `--text-muted` | `#6B7280` | Secondary labels, timestamps |
| `--text-dim` | `#374151` | Placeholder text, disabled states |
| `--glow-primary` | `rgba(124,58,237,0.25)` | Box-shadow glow on primary elements |

### Semantic Usage

```
Capture page accent   → --primary (violet)
Analysis data         → --accent (sky blue)
Branch tree nodes     → --accent-green (active), --text-muted (inactive)
Opportunities cards   → gradient: --primary → #0EA5E9
Warning / energy      → --accent-orange
Error states          → #EF4444
```

---

## 3. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Logotype / Hero | **Inter** | 900 (Black) | 32–64px |
| Section headings | **Inter** | 800 (ExtraBold) | 20–28px |
| Card titles | **Inter** | 700 (Bold) | 16–20px |
| Body / labels | **Inter** | 500 (Medium) | 13–15px |
| Micro-labels / tags | **Inter** | 700 uppercase | 9–11px + `tracking-widest` |
| Data / metadata values | **JetBrains Mono** or **IBM Plex Mono** | 400–600 | 14–18px |
| Code snippets | **JetBrains Mono** | 400 | 13px |

> **Rule:** All uppercase text must have `tracking-widest` (0.15–0.2em). Never use uppercase without generous letter-spacing.

---

## 4. Spacing & Layout

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 40px |
| `--space-2xl` | 64px |
| Container max-width | 1200px, centered |
| Page padding (mobile) | 16px |
| Page padding (desktop) | 32–48px |

---

## 5. Border Radius

| Element | Radius |
|---|---|
| Page containers | 0 |
| Bento cards / panels | 20–24px (`rounded-3xl`) |
| Buttons (primary) | 12px (`rounded-xl`) |
| Buttons (pill / nav) | 9999px (`rounded-full`) |
| Tags / chips | 6px (`rounded-lg`) |
| Input fields | 12px (`rounded-xl`) |
| Modals | 28–32px |
| Avatar | 50% (circle) |

---

## 6. Glassmorphism (System Rules)

```css
/* Standard glass panel */
.glass-panel {
  background: rgba(17, 17, 24, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Navbar glass */
.navbar-glass {
  background: rgba(9, 9, 14, 0.85);
  backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Elevated glass (modals, dropdowns) */
.glass-elevated {
  background: rgba(26, 26, 38, 0.9);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}
```

> **Rule:** Never use pure `transparent` or `white/5` as the only background — always pair with `backdrop-filter` for true glass depth.

---

## 7. Shadows & Glow

```css
/* Primary glow (CTA buttons, active nav) */
box-shadow: 0 0 24px rgba(124, 58, 237, 0.4), 0 4px 16px rgba(0,0,0,0.5);

/* Card hover shadow */
box-shadow: 0 8px 32px rgba(0,0,0,0.4);

/* Subtle card default */
box-shadow: 0 2px 8px rgba(0,0,0,0.3);

/* Data accent glow (analysis values) */
box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
```

---

## 8. Motion & Transitions

| Interaction | Duration | Easing |
|---|---|---|
| Hover (color/opacity) | 200ms | `ease-out` |
| Hover (transform scale) | 300ms | `cubic-bezier(0.34,1.56,0.64,1)` (spring) |
| Panel slide-in | 350ms | `ease-out` |
| Modal enter | 250ms | `ease-out` with `scale(0.97→1)` + `opacity(0→1)` |
| Page transition | 400ms | `fade-in` |
| Branch tree expand | 350ms | staggered, 50ms per node |

> **Rule:** No spinning loaders longer than 2 seconds. If loading takes >2s, show a skeleton. Prefer motion that reveals structure (slide + fade) over pure opacity fades.

---

## 9. Component Inventory

### Shared Components
- `GlassCard` — base bento card with blur + border
- `NavBar` — sticky glass pill navbar
- `Button` — variants: primary, ghost, danger, icon-only
- `Badge` / `Chip` — micro-label tags (BPM, key, genre)
- `AudioPlayer` — waveform visualizer + play/pause/seek
- `WaveformVisualizer` — canvas-drawn real-time waveform during recording
- `BranchTree` — recursive SVG/CSS tree with expand/collapse
- `ContribGraph` — GitHub-style 52×7 day heatmap
- `AnalysisPanel` — displays AI output: BPM, key, mood, genre, energy bar, instruments
- `BestClipCard` — highlights recommended social-media clip with time range
- `OpportunityCard` — bento card: title, platform badge, description, deadline, apply link
- `ProjectCard` — bento card: title, branch count, last active, public/private badge
- `SkeletonCard` — loading placeholder matching ProjectCard dimensions

### Page Layouts
- `CapturePage` — left: recorder/uploader; right: live analysis results
- `DashboardPage` — grid of ProjectCards → click → branch tree view
- `OpportunitiesPage` — masonry bento grid of OpportunityCards
- `ProfilePage` — avatar block + bio + recent projects + ContribGraph
- `LoginPage` / `SignupPage` — centered glass card form

---

## 10. Navbar Layout

```
[ Logo + SwarLab ]  [ Capture | Dashboard | Opportunities ]  [ Search □ ] [ Avatar / Login ]
←— Left ——————————  ←——— Center (pill nav) ————————————————  ←——— Right ——————————————————→
```

- Sticky, `position: fixed`, top 16–20px, `z-index: 50`
- Max-width 1200px centered
- Mobile: Logo + hamburger → slide-out drawer for nav links
- Active link: filled pill background `--primary`, white text
- Inactive link: `--text-muted`, hover → white

---

## 11. Page-Specific Notes

### Capture Page
- Large centered record button (pulsing ring animation while recording)
- Waveform oscilloscope strip below the button during recording
- After analysis: results slide in from right as `AnalysisPanel`
- Best clip card appears below analysis as a highlight strip
- Drag-and-drop zone for file uploads (subtle dashed border, violet on hover)

### Dashboard — Branch Tree View
- Left panel (1/3): project metadata, branch count, created date
- Right panel (2/3): SVG branch tree
  - Nodes: rounded rectangles, color-coded by instrument type
  - Lines: subtle `--border` color connecting parent → children
  - Root node (Main Take) always at top
  - Clicking a node plays its audio and shows its analysis
- Empty state: illustration of a bare tree with "Record your first take →" CTA

### Opportunities Page
- Filter bar: pills for All / Gig / Competition / Grant / Collab
- Cards in a 3-column grid (desktop), 1-column (mobile)
- Deadline badge: green if >30 days, orange if 7–30 days, red if <7 days

### Profile Page
- Top: avatar (96px circle) + name + bio (editable inline)
- Below: 4–5 ProjectCards in a row
- Bottom: ContribGraph spanning full width
  - 52 columns (weeks) × 7 rows (days)
  - Color: `rgba(124,58,237,0)` → `rgba(124,58,237,1)` by activity intensity
