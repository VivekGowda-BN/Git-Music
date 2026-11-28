# SwarHub

**SwarHub is a browser-based recording studio for musicians who want to keep every version of a song.** Record a guitar riff, try a different chorus on a branch, then play the takes side by side to choose a master mix. The original recording stays in the project.

**Live app:** [swarhub.vercel.app](https://swarhub.vercel.app)

![SwarHub home page: white treble-clef logo, navigation, “Version control for your sound” headline, and the cassette listening desk](docs/images/swarhub-home.png)

## Explore the studio

| Room | What you can do |
| --- | --- |
| Capture | Record a take with your microphone or import an audio file and listen back to a suggested excerpt. |
| Dashboard | Explore a project's take history, compare branches, and choose a master mix. |
| Feed | Browse sample posts and open music calls. Your workspace shows the photo saved in Profile. The red note at the bottom marks the feed as a preview; live community posts are coming soon. |
| Opportunities | Filter manually curated gigs, jams, band openings, collaborations, and castings. Each card opens the original listing. |

## Tech stack

| Layer | Technologies | What they do in SwarHub |
| --- | --- | --- |
| Studio | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![React Router](https://img.shields.io/badge/React_Router-302D2D?logo=reactrouter&logoColor=F47A7E) ![Vite](https://img.shields.io/badge/Vite-483682?logo=vite&logoColor=white) | Render the studio, navigate between rooms, and build the frontend. |
| Interface | ![CSS](https://img.shields.io/badge/CSS-663399?logo=css&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-332C42?logo=framer&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide-823C34?logo=lucide&logoColor=white) | Style the responsive layouts, animate the cards, and draw the controls. |
| Audio & storage | 🎙️ Web Audio API · IndexedDB · localStorage · Supabase Storage | Analyse recordings on-device, cache audio in IndexedDB, keep take history and mix selections in localStorage, and sync signed-in projects to Supabase Storage. |
| Accounts & database | ![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?logo=supabase&logoColor=3ECF8E) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white) | Supabase Auth creates email-and-password accounts, confirms addresses, and stores sessions in Postgres. Each artist gets a private workspace that follows the account across browsers. |
| Legacy account API (optional) | ![Node.js](https://img.shields.io/badge/Node.js-345934?logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-333333?logo=express&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-164B69?logo=sqlite&logoColor=white) | The original JWT + SQLite accounts, projects, and audio versions. Kept for existing deployments behind `VITE_AUTH_PROVIDER=legacy`. |

## Project structure

```text
frontend/
├── public/                 Cassette audio, listing photos, and platform logos
└── src/
    ├── main.jsx            Active React entry point
    ├── lib/
    │   ├── supabase.js     Supabase client and confirmation callback URL
    │   └── api.js          Legacy Express API and session helpers
    └── studio/
        ├── Studio.jsx        Routes, navigation, and shared workspace
        ├── Home.jsx          Home hero and listening desk
        ├── Capture.jsx       Microphone recording and file import
        ├── Dashboard.jsx     Project history, branches, and master mixes
        ├── Auth.jsx          Email signup, confirmation and login
        ├── Feed.jsx          Demo community feed
        ├── Portfolio.jsx     Artist profile, photo upload, and Opportunities page
        ├── profilePhoto.js   Local image crop, validation and EXIF stripping
        ├── cloudMedia.js     Chunked audio upload, download and local cache
        ├── recordingSync.js  Account-scoped project sync and deletion tombstones
        ├── opportunities.js  Curated listings and source links
        ├── audio.js          Decoding, analysis worker and WAV encoding
        ├── musicFeatures.js  Tempo and key estimators
        ├── signalProfile.js  Mix profile and highlight selection
        └── library.js        Local project and recording storage
supabase/
└── migrations/             Recording table, private bucket and RLS policies
backend/
├── server.js               Express endpoints
├── db.js                   SQLite initialization and schema
└── middleware/             JWT authentication
docs/
├── images/                 README screenshot
├── capture-analysis.md     Tempo, key, mix readings and benchmarks
├── capture-highlights.md   How the suggested excerpt is chosen
└── swarhub-graph.md        Routes, storage, and data flows
```

## Run locally

With Node.js 22.12+ and npm installed, run these commands from the repository root:

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

On PowerShell, copy the file with `Copy-Item .env.example .env`. Open the URL printed by Vite (usually `http://localhost:5173`). Recording, analysis, and local project history work before you configure accounts. Add your Supabase values from [Accounts, cloud sync, and storage](#accounts-cloud-sync-and-storage) to enable signup, login, and cross-browser recordings.

### Optional legacy backend

For the Express API, open another terminal in `backend/` and run `npm ci`. Generate a signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save the result as `JWT_SECRET=<generated value>` in `backend/.env`, then start the API:

```sh
node --env-file=.env server.js
```

The API defaults to `http://localhost:3000` and initializes its SQLite database on startup. In a hosted deployment, supply `JWT_SECRET` through the environment. To use these SQLite accounts instead of Supabase, set `VITE_AUTH_PROVIDER=legacy` and `VITE_API_URL=http://localhost:3000` in `frontend/.env`.

The API now requires a bearer token for recordings and uploads, limits login and signup attempts, accepts only audio uploads up to 25 MB, and restricts browser origins. Configure it with `CORS_ORIGINS` (comma-separated), `MAX_UPLOAD_BYTES`, `RATE_LIMIT_MAX`, `RATE_LIMIT_SIGNUP_MAX`, `SQLITE_PATH`, and `TRUST_PROXY=1` only when it runs behind a trusted reverse proxy. Run its security suite with `npm test` in `backend/`.

## Accounts, cloud sync, and storage

SwarHub uses **Supabase Auth** for email-and-password accounts, **Supabase Postgres** for the auth records, sessions, and recording index, and a private **Supabase Storage** bucket for audio. A take recorded in Chrome appears when the same account signs in on Brave or another device. Google sign-in is deliberately not enabled: an email address and password are enough.

Only the owner can read a project row or its audio. Marking a project **Public** on the Profile page controls whether it appears on the profile; it does not publish the audio to other accounts yet.

### 1. Create the project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and choose **New project**.
2. Pick a region close to your users and save the database password somewhere safe.
3. In **Project Settings → API** (or the **Connect** dialog), copy the **Project URL** and the **Publishable key** (`sb_publishable_…`).

Create `frontend/.env` from `frontend/.env.example` and fill in:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Restart `npm run dev` after changing `.env`; Vite only reads it at startup. The publishable key is designed for browsers. **Never** put the `service_role`/secret key in a `VITE_` variable.

### 2. Create the recording table and bucket

Run [`supabase/migrations/202611280001_recording_sync.sql`](supabase/migrations/202611280001_recording_sync.sql) in the Supabase **SQL Editor**. It creates:

- `recording_projects`, one row per project and owner, with a `revision` for compare-and-swap updates and a `payload` that is set to `NULL` as a deletion marker.
- The private `recording-audio` bucket, limited to 4 MB per stored object.
- Row-level security on the table and bucket, scoped to `auth.uid()`. Uploads are also blocked under a project that has been deleted.

Until this migration runs, the Dashboard says cloud storage is not set up and keeps recordings on the device.

### 3. Allow the callback URLs

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` for local work, or your deployed origin.
- **Redirect URLs**: add every origin that will finish a sign-in:
  - `http://localhost:5173/auth/callback`
  - `https://your-domain.example/auth/callback`

Supabase only redirects back to URLs on this list. When you deploy, add the production callback and update the Site URL.

### 4. Choose how email confirmation works

In **Authentication → Providers → Email**, **Confirm email** is on by default. New artists then see a “Check your email” screen and must open the link in the same browser before logging in. You can resend the message from that screen.

For quick local testing you may turn confirmation off. Signup then returns a session immediately and goes straight to the dashboard.

### How recordings move between browsers

1. When a recording stops, the save dialog opens immediately so the take can be named while analysis runs in the background.
2. Saving stores the original and its suggested highlight locally. The project then syncs in the background: metadata goes to `recording_projects`, and audio is split into 4 MB parts in the private bucket.
3. The next browser to sign in with that account downloads the parts, caches them in IndexedDB, and plays them without another network request. Uploads reuse the existing local file instead of storing a second copy.
4. Sync runs on sign-in, when the browser comes back online or into focus, after project or mix changes, and every 60 seconds. The Dashboard shows whether recordings are synced and offers **Sync now**.
5. Updates use the per-project `revision` as a compare-and-swap, so two browsers cannot silently overwrite each other's branches. Deletions are tombstones; an offline browser cannot bring a deleted project back, and unpublished takes recorded offline are kept under a “recovered” project instead.
6. If cloud storage is unavailable, the Dashboard says so and keeps the takes on that device. Nothing is lost by staying offline.

### Guest recordings

Work recorded before signing in is stored under the browser's guest workspace. The first account that signs in on that browser receives a copy, so the Dashboard is not empty after signup; the guest shelf stays available after sign-out. The copy uploads on the next sync. On a shared computer, clear the site's data before handing it to someone else.

Recordings made on an older localhost workspace are not migrated automatically. Open that workspace while signed in to the same account so they upload.

### Profile photo

Open **Profile → Edit profile → Choose photo** to pick an image from your computer. The browser centre-crops it to a square, resizes it to 512 × 512, and re-encodes it as JPEG. Re-encoding removes EXIF metadata, including GPS coordinates. The processed copy is stored with the profile on the device; the original file is never uploaded. JPEG, PNG, WebP, GIF, BMP, and AVIF up to 8 MB are accepted, and the stored image is capped at about 400 KB.

### Brand assets

The navigation and account pages use `frontend/public/art/swarhub-mark.png`. The browser tab uses `swarhub-tab-white.png`, a white clef with a dark outline so it stays visible on light tabs. `node frontend/scripts/testBranding.mjs` checks both.

### Deploying to Vercel

Production address: [swarhub.vercel.app](https://swarhub.vercel.app).

- Deploy `frontend/` as a Vite application (`npm run build`, output `dist`). For a Git import, select `frontend` as the Root Directory. The optional Express/SQLite server is separate.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel **Production** environment before building. Redeploy after changing them.
- In Supabase **Authentication → URL Configuration**, set the Site URL to `https://swarhub.vercel.app` and allow `https://swarhub.vercel.app/auth/callback` for email confirmation.
- [`frontend/vercel.json`](frontend/vercel.json) serves the app on direct visits to routes such as `/feed` and `/auth/callback`, sets the production security headers, and caches `/art/*` for a day with a week of stale-while-revalidate.
- Listing and project covers are WebP files at 480–640 px. The first three Dashboard covers load eagerly; the rest load lazily.

### Existing SQLite accounts

Accounts created against the Express backend are not copied into Supabase. Keep that deployment on `VITE_AUTH_PROVIDER=legacy`, or ask existing users to create a Supabase account; their local browser recordings remain on the device.

## Security

- **Accounts.** Supabase Auth owns email signup, confirmation, and sessions. A workspace is keyed by the Supabase user ID, so switching accounts cannot show another account's projects or audio. `/dashboard?project=…` only resolves IDs from the signed-in library or from `/my-projects`, which the API filters by the bearer token's user.
- **Cloud sync.** `recording_projects` has row-level security, and every storage policy is scoped to the owner's folder. The table grants are limited to `select`, `insert`, and `update`; a deleted row cannot be edited. Project updates use a compare-and-swap revision. Audio objects are immutable and capped at 4 MB each.
- **Legacy API.** Recordings and uploads now require a JWT; every project, version, branch, and delete is checked against the token's user. Debug routes that listed users and tables were removed. JWT verification is pinned to HS256. Login and signup are rate limited, and unknown emails are compared against a dummy hash to reduce timing leaks.
- **Uploads.** Audio only (extension and MIME), 25 MB default cap, one file per request, random UUID filenames, `nosniff` on `/audio`. HTML, SVG, and executables are rejected so the static audio route cannot serve active content.
- **Secrets.** `frontend/.env` and every other `.env*` file are gitignored; only `.env.example` with placeholders is tracked. The publishable key is designed to ship in the browser. The `service_role`/secret key and database password must stay in the Supabase or host dashboard. `node frontend/scripts/testSecrets.mjs` fails if a tracked file contains a local credential value, a JWT, a private key, or a password-bearing database URL.
- **Browser hardening.** `frontend/public/_headers` adds CSP, `X-Frame-Options`, `nosniff`, a strict referrer policy, and a permissions policy on hosts that read it (Netlify, Cloudflare Pages). `frontend/vercel.json` sends the same headers in production. Stored text is rendered by React, and profile links accept only `http:`/`https:`. Profile photos are re-encoded in a canvas before they are stored, and only validated `data:image/…` values reach an `<img>`.

Residual risks to know about:

- Recordings are cached in IndexedDB and project metadata in localStorage on each device, so anyone with access to the unlocked browser profile can read them. The Supabase copies are protected by row-level security and a private bucket. Clear site data on shared computers.
- Uploads are capped at 4 MB per stored object and split into parts, so a very long uncompressed WAV can need many requests. Sync runs in the background; closing the tab immediately after saving can delay the upload until the next visit.
- Legacy audio files are served from `/audio` so `<audio>` can stream them without a header. Filenames are random UUIDs, but the route is not per-user. Do not use the legacy backend for private material until signed URLs are added.
- Password reset and account recovery are not built yet.
- Sessions are kept in browser storage by `supabase-js`. The CSP and escaped rendering reduce XSS exposure, but any future `dangerouslySetInnerHTML` or third-party script would undermine that.
- Apply the bundled migration before launch and review the policies whenever a sharing feature is added.

## Development

- Run `npm run lint` and `npm run build` in `frontend/`.
- Run the analysis tests with `node --test src/__tests__/musicFeatures.test.js src/__tests__/signalProfile.test.js` in `frontend/`.
- Browser suites run from the repository root: `node frontend/scripts/testAuthBrowser.mjs`, `node frontend/scripts/testCaptureBrowser.mjs`, and `node frontend/scripts/testProjectControls.mjs`. They use local Chrome; the auth suite mocks Supabase's endpoints and needs no keys.
- Security suites: `node frontend/scripts/testSecurityBrowser.mjs` (URL tampering, cross-account isolation, stored XSS), `node frontend/scripts/testProfilePhoto.mjs` (upload, crop, rejection, removal), `node frontend/scripts/testSecrets.mjs` (no tracked credentials), and `npm test` in `backend/` (API authorization, CORS, rate limits, upload filtering).
- `node frontend/scripts/testBranding.mjs` checks the transparent 512 × 512 brand mark in the header, auth card, and favicon.
- `node frontend/scripts/testRecordingSync.mjs` uses a simulated Supabase API to prove an existing recording reaches a second isolated browser, another account stays empty, chunked audio is restored, and a deletion propagates.
- `node frontend/scripts/captureReadmeScreenshot.mjs` refreshes the README screenshot.
- With `frontend/.env` configured, `node frontend/scripts/testSupabaseLive.mjs` checks the real project wiring and makes one deliberately wrong login attempt; it creates no account and sends no email.
- Edit [`frontend/src/studio/opportunities.js`](frontend/src/studio/opportunities.js) to curate the board.
- See the [project map](docs/swarhub-graph.md) for routes, data flows, and storage, and [Capture analysis](docs/capture-analysis.md) for the measured accuracy and benchmark method.

## Project status

**Built**

- [x] Record or import audio, estimate tempo and key, and audition a short excerpt.
- [x] Branch takes, play layers together, and save a master selection without overwriting the originals.
- [x] Browse a sample community feed, edit a local artist profile, and feature projects.
- [x] Filter curated opportunities and open the original postings.
- [x] Create an account, confirm the email, log in, and sign out with Supabase Auth.
- [x] Upload a profile photo from the computer, cropped and stored locally.
- [x] Isolate accounts, harden uploads and headers, and keep credentials out of Git.
- [x] Keep recordings with the account across browsers and devices.

**Still to build**

- [ ] Self-service password reset and account recovery.
- [ ] Populate the community feed with activity from real accounts.
