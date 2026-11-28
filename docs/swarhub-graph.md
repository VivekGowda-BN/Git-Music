# SwarHub · project knowledge graph

Start here for the active application. Follow the relevant edge to its source. Dependencies, recordings, the SQLite contents and generated bundles are not source nodes.

## Current handoff

- Deployment target: `swarhub.vercel.app`. `frontend/vercel.json` configures Vite, SPA navigation, `/art` caching and security headers; `README.md` documents the production Supabase variables and callback allowlist.
- **Cloud sync is implemented but the production migration still needs to be applied.** Run `supabase/migrations/202611280001_recording_sync.sql` in the Supabase SQL editor, then set the Site URL to `https://swarhub.vercel.app` and allow `https://swarhub.vercel.app/auth/callback`. Until then, signed-in browsers keep recordings locally and the Dashboard reports that cloud storage is not set up. The Vercel CLI is authenticated locally; `npx supabase` is not.
- Signed-in projects now follow the account: metadata in `recording_projects`, audio split into 4 MB objects in the private `recording-audio` bucket. `recordingSync.js` pulls, merges, publishes with a `revision` compare-and-swap, and tombstones deletes; `cloudMedia.js` uploads/downloads chunks and caches them in IndexedDB. Sync runs on sign-in, online/focus, project or mix changes, and every 60 s; the Dashboard shows the state and a **Sync now** button.
- Email/password is the only sign-in path. Google was removed from `Auth.jsx`, `lib/supabase.js`, `frontend/.env.example`, the browser tests and the docs; `Auth.jsx` no longer calls `/auth/v1/settings`.
- Feed’s workspace avatar follows the profile photo, including removal. The sample-activity note below the feed uses the studio’s red accent in `community.css`; live community posts are still pending. `frontend/scripts/testProfilePhoto.mjs` verifies both avatar states and the note in Chrome.
- Logo verification: `node frontend/scripts/testBranding.mjs` passed in Chrome; frontend lint and production build passed. The README screenshot is a hero-only 1440 × 666 capture made with `frontend/scripts/captureReadmeScreenshot.mjs`.
- Dashboard starts empty. Saving a recording or upload creates a dated card; discarding does not. `library.js` removes old demo takes while retaining real branches. Delete remains on the project detail page.
- `Dashboard.jsx` → `projectCovers()` → `frontend/public/art/projects/*.webp`: twelve licensed Pexels photos converted to 480–640 px WebP (955 KB → 254 KB). The first three covers load eagerly, the rest lazily. Opportunities has its own WebP set. The unused `.jpg` originals were removed.
- Capture opens the naming dialog immediately after recording stops (`setFiling(recorded)`); analysis continues in the background and a failure still lets the original be saved. “Review audio” is disabled until audio exists. `signalProfile.js` computes the pitch-class lookup once per take and only runs repetition correlation for takes of at least 20 s; `spectrum.js` precomputes its twiddle/bit-reverse tables. Benchmarks: 8 s 31.1 → 25.6 ms, 90 s 214 → 226 ms, 180 s 295 → 312 ms (no regression).
- Accounts use Supabase Auth: email signup with confirmation and resend, password login, local sign-out, and `/auth/callback` for confirmation. The signed-in workspace key is `supabase-<user id>`. A fresh visitor is signed out by default; `/preview/profile` still opens the demo artist.
- `claimGuestLibrary()` in `library.js` copies the guest shelf into the first account that signs in on a browser (`swarhub:guest-claimed` prevents repeats) and shows a dismissible notice. The guest copy is retained for sign-out and uploads on the next sync.
- Setup lives in `README.md` → *Accounts, cloud sync, and storage* and `frontend/.env.example`. Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep `VITE_AUTH_PROVIDER=legacy` only for the Express/SQLite accounts.
- Local `frontend/.env` targets the configured Supabase project and is gitignored. Supabase reports email enabled, signup open, confirmation required (`mailer_autoconfirm:false`), and Google disabled.
- Supabase holds identity, sessions, the project index and audio. A project is readable only by its owner; marking it public only affects the profile, not other accounts. Old localhost recordings are not migrated automatically; open that workspace signed in to upload them.
- Security pass: removed the unauthenticated `/debug/users` and `/debug/tables` routes; `/versions`, `/upload`, `/record`, `/branch`, `/analyze-*`, and `DELETE /recordings/:id` now require a JWT and are scoped to the token's user. JWT verification is pinned to HS256. Login/signup are rate limited, uploads are audio-only with a 25 MB cap and UUID filenames, CORS uses `CORS_ORIGINS`, and the API sets `nosniff`/frame/referrer headers. `frontend/public/_headers` and `frontend/vercel.json` add CSP and related headers.
- Profile photos: `profilePhoto.js` centre-crops, resizes to 512 × 512, re-encodes as JPEG (dropping EXIF/GPS) and caps the stored string at 400 KB. `Portfolio.jsx` stores `artist.photo` in the local workspace; the header avatar and profile portrait render it only after `safePhoto()` validates a `data:image/` URL.
- Brand mark: `Auth.jsx` and `Studio.jsx` use `frontend/public/art/swarhub-mark.png`, with a white CSS filter in the dark navigation. The browser tab uses `swarhub-tab-white.png`, a white version with a dark outline for light tabs and a transparent background. `testBranding.mjs` checks the linked icon’s pixels.
- Verified before this handoff: `testRecordingSync.mjs` passed (existing recording synced across isolated browsers, 4 MB+2-byte chunked original and hook restored, separate account empty, deletion propagated); `testAuthBrowser.mjs` passed email signup, resend, callback, guest claim, reload, sign-out, failed and successful password login, and asserts the Google button is absent; `testSupabaseLive.mjs` passed against the live project with email-only auth; `testCaptureBrowser.mjs`, `testProjectControls.mjs` (12 WebP covers decode), `testProfilePhoto.mjs`, `testBranding.mjs`, `testSecurityBrowser.mjs`, `testSecrets.mjs` (319 tracked files, no credentials), the 18 analysis tests, lint and build passed; `npm test` in `backend/` passed 9 security tests. `node docs/build-source-graph.mjs` indexed 96 nodes/111 edges and `graphify update .` rebuilt 1699 nodes/3167 edges; the focused sync query resolved `recordingSync.js`, `cloudMedia.js` and `playback.js`. Graphify skipped the `.sql` migration because `tree_sitter_sql` is not installed, so the migration edge is documented here manually.
- Next unfinished step: apply the migration and Auth URL settings in the Supabase dashboard. The current `main` commit is pushed and Vercel production `swarhub.vercel.app` was deployed from it and verified (email-only signup with no Google button, feed preview note visible, `/art` returns `max-age=86400, stale-while-revalidate=604800`). The GitHub repository homepage points to `https://swarhub.vercel.app`. The accidental Vercel project named `frontend` was deleted, `frontend/.vercel` links to `swarhub`, and the Vercel-created `frontend/.env.local` was removed. Password reset remains the next account feature.

The [machine-readable source graph](swarhub-graph.json) indexes first-party modules, local imports and HTTP endpoints. `active-frontend` marks modules reachable from the live React entry. Regenerate after source topology changes with `node docs/build-source-graph.mjs`.

```mermaid
flowchart TD
  vercel["frontend/vercel.json · production routes, headers and /art cache"] --> entry
  entry["frontend/index.html → src/main.jsx"] --> shell["studio/Studio.jsx · router, session, workspace, sync loop"]
  entry --> css["studio/studio.css, workspace.css, community.css, home.css, opportunities.css · layout, instrument surfaces, motion"]
  shell --> home["/ and /home · Home.jsx · hero, idea and navigation guide"]
  shell --> feed["/feed · Feed.jsx · sample community repositories and local stars"]
  shell --> capture["/capture · Capture.jsx"]
  shell --> dashboard["/dashboard · Dashboard.jsx"]
  shell --> calls["/opportunities · Portfolio.jsx · curated open calls and source directory"]
  shell --> artist["/profile · Portfolio.jsx"]
  shell --> auth["/login, /signup and /auth/callback · Auth.jsx"]
  entry -->|favicon| favicon["public/art/swarhub-tab-white.png"]
  shell -->|navigation| mark["public/art/swarhub-mark.png"]
  auth -->|account pages| mark
  auth --> supa["lib/supabase.js · Supabase client and callback URL"]
  supa --> hosted["Supabase Auth → Postgres · users, sessions, email"]
  shell --> sync["studio/recordingSync.js · pull, merge, compare-and-swap, tombstones"]
  sync --> supa
  sync --> cloud["studio/cloudMedia.js · 4 MB chunk upload/download, IndexedDB cache"]
  cloud --> bucket["Supabase Storage · private recording-audio bucket"]
  cloud --> cache["IndexedDB · cloud:<owner>:<project>:<take> cache"]
  sync --> index["Supabase Postgres · recording_projects (revision, payload NULL = deleted)"]
  home --> desk["ListeningDesk.jsx · cassette transport and bundled excerpt"]
  desk --> tape["Cassette.jsx · original layered SVG"]
  desk --> featured["featured.js · Avicii lyric-video excerpt at 0:17–1:03"]
  featured --> audiofile["public/audio/the-nights-excerpt.mp3 · bundled 46-second audio"]
  feed --> avatar["Avatar.jsx · local illustrated community portraits"]
  capture --> sound["audio.js · demo synthesis, WAV encoder, acoustic estimates"]
  capture --> ring["FrequencyRing.jsx · MediaStream → AnalyserNode → one circular spectrum"]
  sound --> song["song.js · original arrangement of Scarborough Fair"]
  sound --> spectrum["spectrum.js · precomputed FFT tables"]
  capture --> analysis["TakeAnalysis.jsx · measurements and best-part player"]
  dashboard --> analysis
  analysis --> playback["playback.js · readTake resolves local or cloud-cached audio"]
  playback --> cloud
  dashboard --> covers["projectCover.js → public/art/projects/*.webp · Dashboard photographs"]
  calls --> data["opportunities.js · hand-checked calls and nine sources"]
  calls --> marks["public/art/platforms · nine local platform marks"]
  artist --> activity["Contributions.jsx · studio activity calendar"]
  artist --> photo["profilePhoto.js · crop, resize and EXIF strip"]
  feed -->|validate workspace portrait| photo
  capture --> sound
  dashboard --> sound
  capture --> library["library.js · scoped library, demo migration and audio storage"]
  shell --> library
  library --> local["localStorage · per-workspace takes, master selections, drafts, artist"]
  library --> blobs["IndexedDB · original audio + exported hook, keyed by take ID"]
  photo --> local
  capture -->|"new take with parent ID"| dashboard
  dashboard -->|"selected branch → new recording"| capture
  calls -->|"external source link"| sources["BandMate, MyRangManch, StarClinch and six more"]
  artist -->|"open or fork repository"| dashboard
  auth -->|"only when VITE_AUTH_PROVIDER=legacy"| api["src/lib/api.js · base URL, bearer session"]
  shell -->|"legacy: read account identity and projects"| api
  api --> server["backend/server.js · Express"]
  server --> guard["middleware/authMiddleware.js · JWT"]
  server --> limit["middleware/rateLimit.js · login and signup limits"]
  server --> hash["utils/auth.js · password hashing"]
  server --> db["backend/db.js → database.sqlite"]
  server --> files["uploads/ → /audio"]
  db --> tables["users → projects → audio_versions; recordings → parent recording"]
```

**Working boundaries**

| Question | Start at | Contract |
|---|---|---|
| How do I run it? | `frontend/package.json`, `frontend/vite.config.js` | From `frontend`, `npm run dev` or `npm run build`. Production hosting needs SPA fallback to `index.html`, including `/auth/callback`. |
| How do accounts work? | `lib/supabase.js`, `studio/Auth.jsx`, `studio/Studio.jsx` | Supabase Auth owns email signup, confirmation, and sessions. Google is not offered. `Studio.jsx` restores the session before rendering and keys the local workspace by user ID. The publishable key may ship; the secret/service-role key must not. Setup steps are in `README.md`. |
| How do recordings reach another browser? | `studio/recordingSync.js`, `studio/cloudMedia.js`, `studio/Studio.jsx`, `supabase/migrations/202611280001_recording_sync.sql` | Metadata goes to `recording_projects` and audio into the owner’s folder of the private `recording-audio` bucket in 4 MB parts. Pull, merge, publish with a `revision` compare-and-swap. Deletes are `payload = NULL` tombstones; storage inserts under a tombstoned project are rejected. IndexedDB caches downloads under `cloud:<owner>:<project>:<take>`. Sync runs on sign-in, online/focus, changes and every 60 s. |
| What happens to guest recordings after signup? | `studio/library.js`, `studio/Studio.jsx`, `studio/recordingSync.js` | `claimGuestLibrary()` copies the guest shelf into the first account that signs in on that browser and marks `swarhub:guest-claimed`. The guest copy remains for sign-out; the account copy uploads on the next sync. |
| How are profile photos stored? | `studio/profilePhoto.js`, `studio/Portfolio.jsx` | The browser centre-crops the chosen image, resizes it to 512 × 512, re-encodes it as JPEG (removing EXIF/GPS) and stores it as `artist.photo` in the workspace. `safePhoto()` rejects anything that is not a bounded `data:image/…` value before it reaches an `<img>`. |
| How is the app hardened? | `frontend/public/_headers`, `frontend/vercel.json`, `backend/middleware`, `backend/server.js` | CSP and security headers ship for Vercel and hosts that read `_headers`. The API requires a JWT for every recording route, scopes rows by `user_id`, pins HS256, rate limits credentials, validates and caps uploads, and restricts CORS with `CORS_ORIGINS`. `testSecrets.mjs` fails if a tracked file contains a local credential. |
| Where are takes saved? | `studio/Capture.jsx`, `studio/library.js`, `studio/cloudMedia.js` | The save dialog opens as soon as recording stops, requires a name and visibility for a new project, and stores the original plus hook in IndexedDB. A branch inherits its project's visibility; mood is optional. A signed-in take also uploads to the account bucket in immutable 4 MB parts. |
| Why is a tempo or key different? | `studio/audio.js` | On-device onset correlation, pitch-class estimates and a rolling energy window; not a hosted AI model. The short preview is at most 15 seconds. |
| How does a merge work? | `studio/Dashboard.jsx` | A master mix stores a set of take IDs, leaving recordings intact. Stem playback uses the selected audio sources together. |
| Which pages need an API? | `studio/Studio.jsx`, `src/lib/api.js` | Only the legacy path: signup/login, `/me`, `/my-projects`, `/projects/:id/versions`; default `http://localhost:3000`, overridable via `VITE_API_URL`. Account versions have no stored parent relationship. |
| Why does the hook stop early? | `studio/audio.js`, `studio/TakeAnalysis.jsx` | The hook is a separate WAV containing only the detected interval. Its bounds are trimmed within a maximum 15-second energy window. The full-take player uses the original audio. |
| How does the artist preview work? | `studio/Studio.jsx`, `studio/Portfolio.jsx` | A fresh visitor is signed out and sees Log in / Sign up. `/preview/profile` opts that tab into the demo artist; sign-out clears the opt-in. Real accounts take precedence. |
| How do I open the demo profile directly? | `studio/Studio.jsx` | `/preview/profile` explicitly reopens the tab’s preview artist session and redirects to `/profile`, including after a previous sign-out. An existing authenticated account keeps its own identity. |
| Where does the Home excerpt come from? | `studio/ListeningDesk.jsx`, `studio/featured.js`, `public/audio/` | The cassette plays a bundled 46-second MP3 taken from the 0:17–1:03 section of the linked Avicii lyric video, so it does not depend on YouTube availability at runtime. `VITE_FEATURED_AUDIO_URL` can replace the file for a licensed deployment. The footer credit links to the source video. |
| How do project details open? | `studio/Dashboard.jsx`, `studio/TakeAnalysis.jsx` | `/dashboard` lists repositories; `?project=<id>&take=<id>` opens the project and selected take. Adding a branch to a remote project creates a local working copy. |
| Where do opportunities come from? | `studio/opportunities.js`, `studio/Portfolio.jsx`, `public/art/platforms` | The board is hand-curated from public Indian music platforms. Each card keeps SwarHub's own one-line summary and links to the original post; no listing text is copied and no application is transmitted. Platform marks are stored locally so the page never hotlinks a remote favicon. Re-check links and the `checkedAt` date before shipping. |
| Is a portfolio live? | `studio/Portfolio.jsx` | Portfolio selection is local. No artist is contacted and no application is transmitted. The profile deliberately does not list applications. |
| What about the older architecture? | `graphify-out/graph.json`, `docs/architecture.md` | `src/App.jsx`, `src/components/`, `src/pages/` are the previous frontend, outside the active import tree. Backend recording/tagging routes are separate from the new local capture path. |

Keep this map in sync when an entry point, route, storage owner or API contract changes. For implementation details, inspect the named source rather than rescanning the repository.
