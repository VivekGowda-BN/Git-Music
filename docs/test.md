# SwarLab — Testing Strategy

> **Version:** 1.0 | **Status:** Draft | **Date:** 2026-11-14

---

## 1. Testing Philosophy

- **Test what matters.** Don't test implementation details; test behavior and contracts.
- **Fail fast.** A failing CI step blocks merging. No exceptions.
- **Coverage as a signal, not a goal.** Target 70%+ on critical paths; don't chase 100%.
- Follow the **Testing Trophy** pattern: more integration tests than unit, fewer E2E but covering critical flows.

```
        ⬟  E2E (Playwright) — 5–10 critical user journeys
       ⬟⬟  Integration tests — API endpoint contracts, DB operations
      ⬟⬟⬟  Component tests — React components with Testing Library
     ⬟⬟⬟⬟  Unit tests — Pure functions, hooks, utils
```

---

## 2. Tech Stack

| Layer | Tool |
|---|---|
| Unit / Component | **Vitest** + **React Testing Library** |
| Backend Integration | **Vitest** (or Jest) + **Supertest** |
| E2E | **Playwright** |
| Test DB | In-memory SQLite (existing) → Supabase test project |
| Coverage | Vitest's built-in `--coverage` (c8) |
| CI | GitHub Actions (future) |

---

## 3. Unit Tests

### Frontend — Utilities & Hooks (`frontend/src/__tests__/`)

| File | Tests |
|---|---|
| `utils.test.js` | `formatDuration()`, `formatDate()`, `parseTags()` |
| `useAudioRecorder.test.js` | start/stop/pause recording state machine |
| `useAuth.test.js` | login/logout token management, guard behavior |
| `analysisParser.test.js` | handles malformed AI JSON gracefully |

### Backend — Pure Functions (`backend/__tests__/`)

| File | Tests |
|---|---|
| `auth.test.js` | `hashPassword()` / `comparePassword()` round-trip |
| `generateTags.test.js` | fallback when Ollama is unavailable |

---

## 4. Integration Tests (Backend API)

Use **Supertest** against a test Express instance with an in-memory / test SQLite DB.

### Auth Routes
```
POST /signup
  ✓ creates user with hashed password
  ✓ rejects duplicate email
  ✓ rejects missing fields

POST /login
  ✓ returns access_token on valid credentials
  ✓ returns 400 on wrong password (same message as unknown user)
  ✓ token has 7d expiry (decode and check)
```

### Project Routes
```
POST /projects (authenticated)
  ✓ creates project, returns id
  ✗ 401 without token

GET /my-projects (authenticated)
  ✓ returns only requesting user's projects
  ✗ 401 without token

POST /versions (authenticated)
  ✓ saves version to owned project
  ✗ 403 for project owned by another user
```

### Upload Routes
```
POST /upload
  ✓ accepts .webm file, returns tags JSON
  ✓ handles Ollama unavailable → returns fallback
  ✗ 400 when no file attached
  ✗ 400 for disallowed file type (future: add type validation)

DELETE /recordings/:id
  ✓ deletes recording and all children recursively
  ✗ returns 404 for non-existent id
```

---

## 5. Component Tests (React Testing Library)

### Critical Components

| Component | Key Tests |
|---|---|
| `LoginPage` | renders form, shows error on wrong creds, redirects on success |
| `SignupPage` | validates all fields, shows server error |
| `Recorder` | shows record button, toggles recording state, displays timer |
| `AnalysisPanel` | renders all fields from AI response, handles missing fields gracefully |
| `BranchTree` | renders single node, renders nested tree, expand/collapse works |
| `OpportunityCard` | renders all fields, "Apply" link opens in new tab |
| `ContribGraph` | renders 52×7 grid, correct color intensity mapping |

---

## 6. E2E Tests (Playwright)

Located in `e2e/` directory. Run against local dev environment.

### Critical User Journeys

#### Journey 1: Anonymous Capture
```
1. Land on /capture
2. Click "Record" → browser asks for mic permission (mocked)
3. Wait 3s → click "Stop"
4. Analysis results appear: BPM, Key, Mood, Genre visible
5. Best-clip card appears below
```

#### Journey 2: Sign Up & Create Project
```
1. Click "Login" → redirect to /login
2. Click "Sign up" → /signup
3. Fill: username, email, password → submit
4. Redirect to /dashboard (authenticated)
5. Click "New Project" → type title → Create
6. Project card appears in grid
```

#### Journey 3: Branch Creation
```
1. Login → Dashboard
2. Click a project
3. Click "Add Branch" → select instrument type "Guitar"
4. Upload a file or record
5. Branch appears in tree below parent node
```

#### Journey 4: Opportunities Browse
```
1. Navigate to /opportunities
2. All cards visible
3. Click filter "Competition" → only competition cards shown
4. Click "Apply →" on a card → new tab opens to external URL
```

#### Journey 5: Google OAuth Login
```
1. Click "Login with Google"
2. Google consent screen appears (mocked in test env)
3. Redirect back → authenticated state
4. Profile avatar visible in navbar
```

---

## 7. Test Commands

```bash
# Frontend unit + component tests
cd frontend && npx vitest run

# Frontend tests with coverage
cd frontend && npx vitest run --coverage

# Backend integration tests
cd backend && npx vitest run

# E2E tests
npx playwright test

# E2E tests with UI (headed)
npx playwright test --headed

# E2E tests for a specific journey
npx playwright test e2e/capture.spec.ts
```

---

## 8. Test Environment Setup

```bash
# Install Playwright browsers (once)
npx playwright install chromium

# Backend test DB — uses existing SQLite in-memory mode
# Set env var:
TEST_DB=:memory:

# Mock Ollama in tests (backend)
# Set env var:
MOCK_AI=true  # returns fixed fixture JSON instead of calling Ollama
```

---

## 9. What NOT to Test

- Tailwind CSS class names
- Exact pixel dimensions
- Implementation details of third-party libs (React Router, Axios)
- Supabase Auth SDK internals
- Ollama model quality / AI output accuracy
