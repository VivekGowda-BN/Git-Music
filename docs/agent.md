# SwarLab — Agent Rules

> **This file governs AI agent behavior on the SwarLab project.**  
> Always load and follow these rules before any task on this codebase.

---

## 0. First-Things-First Protocol

For the active SwarHub frontend, start with [the project knowledge graph](swarhub-graph.md). Follow its file and data-flow edges for the task at hand. The older generated graph below describes the previous frontend.

Before any codebase exploration, run:
```bash
graphify query "<your question>"
```
If `graphify-out/graph.json` doesn't exist, run `graphify . --code-only` first.  
**Never read the entire project by globbing or reading unrelated files.**

---

## 1. Skill Activation Rules

| Task Type | Required Skills |
|---|---|
| Any UI / frontend work | `impeccable`, `design-taste-frontend`, `ui-ux-pro-max` |
| High-impact visual components | + `high-end-visual-design`, `bento-ui`, `glassmorphism` |
| Auth / file upload / API security | `vibesec`, `api-security-best-practices` |
| Backend / Node.js work | `nodejs-best-practices`, `ponytail` |
| React components / hooks | `react-best-practices`, `react-patterns` |
| New feature planning | `gsd` (wave-based execution) |
| Bug / test failure | `systematic-debugging` → fix → `verification-before-completion` |
| Code review | `ponytail-review` or `code-reviewer` |
| Writing tests | `tdd-workflows`, `test-driven-development` |
| Docs / README | `readme` |

---

## 2. Graphify Rules

- **Always** query `graphify` before reading source files
- For relationships between files: `graphify path "<fileA>" "<fileB>"`
- For a concept/function: `graphify explain "<concept>"`
- After modifying code: `graphify update .` to keep graph current
- If `graphify-out/wiki/index.md` exists, navigate it instead of raw files
- Read `graphify-out/GRAPH_REPORT.md` **only** for broad architecture review

---

## 3. GSD Execution Protocol

Use the GSD (Get Shit Done) skill for multi-step implementation:

1. **Define the Wave** — list the atomic tasks for the current phase
2. **Execute one task at a time** — no task skipping
3. **Verify before claiming done** — run `npm run build` / tests / visual check
4. **Report after each wave** — summary of what changed, what's next
5. **Stop and wait for approval** between phases

---

## 4. Ponytail Rules (YAGNI / Minimal Code)

- Prefer the smallest change that correctly solves the task
- Do not add abstractions "for future use"
- Do not refactor code not related to the current task
- If a shortcut is taken, leave a `// shortcut:` comment explaining why
- Prefer editing existing files over creating new ones where sensible

---

## 5. UI Rules

- All UI must follow the design system in `docs/design.md`
- Dark background: `#09090E` only — never lighter
- Glassmorphism: `backdrop-filter: blur(16px)` + `bg-[rgba(17,17,24,0.7)]` + `border border-white/8`
- Bento grid for Dashboard / Opportunities (not plain list)
- Navbar: sticky, glass pill, max-w-6xl centered
- Motion: subtle slide + fade only — no bouncing/spinning for >2s
- Typography: Inter for UI, monospace for data values
- Mobile-first: test at 375px before 1280px

### Anti-Patterns (NEVER do)

- Generic white/gray backgrounds
- Pure `opacity-50` as only visual treatment
- Buttons with only an underline hover
- Text without adequate contrast (< 4.5:1 for body text)
- Inline styles for design tokens (use Tailwind / CSS variables)
- Storing JWT access_token in `localStorage` (use httpOnly cookie or memory)

---

## 6. Security Rules (Always Active)

- **JWT_SECRET** must come from `process.env.JWT_SECRET` — never hardcode
- **File uploads**: validate MIME type + file size server-side (not just multer)
- **CORS**: restrict to `process.env.FRONTEND_URL` in production
- **SQL**: use parameterized queries always (already done in existing code — keep it)
- **Debug routes** (`/debug/tables`, `/debug/users`): must be removed before any deployment
- **Auth on mutations**: all write endpoints must check JWT
- **Rate limiting**: add `express-rate-limit` to auth and upload routes

---

## 7. Coding Standards

- **TypeScript** preferred for new files; JavaScript acceptable for small changes to existing files
- **No unused imports** — ESLint will flag them
- **No `console.log` in production** — use a logger or remove before commit
- **Component files**: PascalCase (`BranchTree.jsx`)
- **Hook files**: camelCase with `use` prefix (`useAudioRecorder.js`)
- **API utility**: centralize all Axios calls in `frontend/src/lib/api.js`
- **Environment variables**: always via `.env` + never commit `.env` files
- **Error handling**: always catch async errors; return structured `{ error: "..." }` JSON from API

---

## 8. Phase Gates

| Phase | Trigger |
|---|---|
| Start Phase N | User explicitly says "OK" or "proceed" |
| End Phase N | Show summary + recommendation → **STOP** |
| Breaking change | Ask for confirmation first |
| DB schema change | Show migration SQL first → wait for OK |
| Auth change | Extra caution — vibesec review before shipping |

---

## 9. File + Directory Conventions

```
docs/          → Planning docs (PRD, architecture, design, agent, test, roadmap)
frontend/src/
  components/  → Reusable UI components
  pages/       → Page-level components (Capture, Dashboard, Opportunities, Profile)
  hooks/       → Custom React hooks
  store/       → Zustand stores
  lib/         → api.js, utils.js
backend/
  routes/      → Split server.js into route files (future refactor)
  middleware/  → authMiddleware, rateLimiter, fileValidator
  utils/       → auth.js, logger.js
uploads/       → Temporary; migrate to Supabase Storage
graphify-out/  → Graph artifacts (do not edit manually)
```
