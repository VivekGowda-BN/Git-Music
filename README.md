# SwarHub

**SwarHub is a browser-based recording studio for musicians who want to keep every version of a song.** Record a guitar riff, try a different chorus on a branch, then play the takes side by side to choose a master mix. The original recording stays in the project.

![SwarHub home page with the “Capture an idea” button and cassette listening desk](docs/images/swarhub-home.png)

## Explore the studio

| Room | What you can do |
| --- | --- |
| Capture | Record a take with your microphone or import an audio file and listen back to a suggested excerpt. |
| Dashboard | Explore a project's take history, compare branches, and choose a master mix. |
| Feed | Browse the sample community feed and follow links to open music calls. |
| Opportunities | Filter manually curated gigs, jams, band openings, collaborations, and castings. Each card opens the original listing. |

## Tech stack

| Layer | Technologies | What they do in SwarHub |
| --- | --- | --- |
| Studio | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![React Router](https://img.shields.io/badge/React_Router-302D2D?logo=reactrouter&logoColor=F47A7E) ![Vite](https://img.shields.io/badge/Vite-483682?logo=vite&logoColor=white) | Render the studio, navigate between rooms, and build the frontend. |
| Interface | ![CSS](https://img.shields.io/badge/CSS-663399?logo=css&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-332C42?logo=framer&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide-823C34?logo=lucide&logoColor=white) | Style the responsive layouts, animate the cards, and draw the controls. |
| Audio & local storage | 🎙️ Web Audio API · IndexedDB · localStorage | Analyse recordings on-device, store the audio in IndexedDB, and keep take history and mix selections in localStorage. |
| Accounts & database | ![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?logo=supabase&logoColor=3ECF8E) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white) ![Google](https://img.shields.io/badge/Google-4285F4?logo=google&logoColor=white) | Supabase Auth creates accounts, stores sessions in Postgres, and handles Google sign-in. Each signed-in artist gets a separate local workspace. |
| Legacy account API (optional) | ![Node.js](https://img.shields.io/badge/Node.js-345934?logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-333333?logo=express&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-164B69?logo=sqlite&logoColor=white) | The original JWT + SQLite accounts, projects, and audio versions. Kept for existing deployments behind `VITE_AUTH_PROVIDER=legacy`. |

## Project structure

```text
frontend/
├── public/                 Cassette audio, listing photos, and platform logos
└── src/
    ├── main.jsx            Active React entry point
    ├── lib/
    │   ├── supabase.js     Supabase client, Google flag, callback URL
    │   └── api.js          Legacy Express API and session helpers
    └── studio/
        ├── Studio.jsx        Routes, navigation, and shared workspace
        ├── Home.jsx          Home hero and listening desk
        ├── Capture.jsx       Microphone recording and file import
        ├── Dashboard.jsx     Project history, branches, and master mixes
        ├── Auth.jsx          Signup, login, email confirmation, Google
        ├── Feed.jsx          Demo community feed
        ├── Portfolio.jsx     Artist profile, photo upload, and Opportunities page
        ├── profilePhoto.js   Local image crop, validation and EXIF stripping
        ├── opportunities.js  Curated listings and source links
        ├── audio.js          Decoding, analysis worker and WAV encoding
        ├── musicFeatures.js  Tempo and key estimators
        ├── signalProfile.js  Mix profile and highlight selection
        └── library.js        Local project and recording storage
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

On PowerShell, copy the file with `Copy-Item .env.example .env`. Open the URL printed by Vite (usually `http://localhost:5173`). Recording, analysis, and local project history work before you configure accounts. Add your Supabase values from [Accounts with Supabase](#accounts-with-supabase) to enable signup and login.

### Optional legacy backend

For the Express API, open another terminal in `backend/` and run `npm ci`. Generate a signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save the result as `JWT_SECRET=<generated value>` in `backend/.env`, then start the API:

```sh
node --env-file=.env server.js
```

The API defaults to `http://localhost:3000` and initializes its SQLite database on startup. In a hosted deployment, supply `JWT_SECRET` through the environment. To use these SQLite accounts instead of Supabase, set `VITE_AUTH_PROVIDER=legacy` and `VITE_API_URL=http://localhost:3000` in `frontend/.env`.

The API now requires a bearer token for recordings and uploads, limits login and signup attempts, accepts only audio uploads up to 25 MB, and restricts browser origins. Configure it with `CORS_ORIGINS` (comma-separated), `MAX_UPLOAD_BYTES`, `RATE_LIMIT_MAX`, `RATE_LIMIT_SIGNUP_MAX`, `SQLITE_PATH`, and `TRUST_PROXY=1` only when it runs behind a trusted reverse proxy. Run its security suite with `npm test` in `backend/`.

## Accounts with Supabase

SwarHub uses **Supabase Auth** for accounts and **Supabase Postgres** for the auth records and sessions. Recordings and project history stay in the artist's browser for now; moving them to Supabase Storage is a separate step.

### 1. Create the project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and choose **New project**.
2. Pick a region close to your users and save the database password somewhere safe.
3. In **Project Settings → API** (or the **Connect** dialog), copy the **Project URL** and the **Publishable key** (`sb_publishable_…`).

Create `frontend/.env` from `frontend/.env.example` and fill in:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
VITE_GOOGLE_AUTH_ENABLED=false
```

Restart `npm run dev` after changing `.env`; Vite only reads it at startup. The publishable key is designed for browsers. **Never** put the `service_role`/secret key in a `VITE_` variable.

### 2. Allow the callback URLs

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` for local work, or your deployed origin.
- **Redirect URLs**: add every origin that will finish a sign-in:
  - `http://localhost:5173/auth/callback`
  - `https://your-domain.example/auth/callback`

Supabase only redirects back to URLs on this list. When you deploy, add the production callback and update the Site URL.

### 3. Choose how email confirmation works

In **Authentication → Providers → Email**, **Confirm email** is on by default. New artists then see a “Check your email” screen and must open the link in the same browser before logging in. You can resend the message from that screen.

For quick local testing you may turn confirmation off. Signup then returns a session immediately and goes straight to the dashboard.

### Guest recordings

Work recorded before signing in is stored under the browser's guest workspace. The first account that signs in on that browser receives a copy, so the Dashboard is not empty after signup; the guest shelf stays available after sign-out. On a shared computer, clear the site's data before handing it to someone else.

### Profile photo

Open **Profile → Edit profile → Choose photo** to pick an image from your computer. The browser centre-crops it to a square, resizes it to 512 × 512, and re-encodes it as JPEG. Re-encoding removes EXIF metadata, including GPS coordinates. Only the processed copy is stored, in that workspace's local profile; the original file is never uploaded. JPEG, PNG, WebP, GIF, BMP, and AVIF up to 8 MB are accepted, and the stored image is capped at about 400 KB.

### 4. Add Google sign-in (optional)

1. Open the [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) page and create an OAuth client of type **Web application**.
2. Under **Authorized JavaScript origins**, add your site origin, for example `http://localhost:5173` and `https://your-domain.example`.
3. Under **Authorized redirect URIs**, add the Supabase callback shown on the provider page:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. In Supabase, open **Authentication → Providers → Google**, enable it, and paste the **Client ID** and **Client secret** from Google.
5. Reload the auth page. The “Continue with Google” button appears automatically once Supabase reports the provider as enabled. `VITE_GOOGLE_AUTH_ENABLED=true` is an optional override; leave it `false` to follow the dashboard setting.

Google returns to `/auth/callback`, where the Supabase client exchanges the one-time code for a session. A session belongs to one browser tab's storage; signing out removes it locally and leaves other devices signed in.

### Deploying

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_GOOGLE_AUTH_ENABLED` in your host's build environment, add the production `/auth/callback` URL to Supabase, and serve the SPA with a fallback to `index.html` so a refresh on `/auth/callback` works. A custom domain for Supabase is recommended before launch so the Google consent screen shows your brand instead of the project ID.

### Existing SQLite accounts

Accounts created against the Express backend are not copied into Supabase. Keep that deployment on `VITE_AUTH_PROVIDER=legacy`, or ask existing users to create a Supabase account; their local browser recordings remain on the device.

## Security

- **Accounts.** Supabase Auth owns signup, email confirmation, sessions, and Google OAuth (PKCE). A workspace is keyed by the Supabase user ID, so switching accounts cannot show another account's local projects. `/dashboard?project=…` only resolves IDs from the signed-in library or from `/my-projects`, which the API filters by the bearer token's user.
- **Legacy API.** Recordings and uploads now require a JWT; every project, version, branch, and delete is checked against the token's user. Debug routes that listed users and tables were removed. JWT verification is pinned to HS256. Login and signup are rate limited, and unknown emails are compared against a dummy hash to reduce timing leaks.
- **Uploads.** Audio only (extension and MIME), 25 MB default cap, one file per request, random UUID filenames, `nosniff` on `/audio`. HTML, SVG, and executables are rejected so the static audio route cannot serve active content.
- **Secrets.** `frontend/.env` and every other `.env*` file are gitignored; only `.env.example` with placeholders is tracked. The publishable key is designed to ship in the browser. The `service_role`/secret key, database password, and Google client secret must stay in the Supabase or host dashboard. `node frontend/scripts/testSecrets.mjs` fails if a tracked file contains a local credential value, a JWT, a private key, or a password-bearing database URL.
- **Browser hardening.** `frontend/public/_headers` adds CSP, `X-Frame-Options`, `nosniff`, a strict referrer policy, and a permissions policy on hosts that read it (Netlify, Cloudflare Pages). Stored text is rendered by React, and profile links accept only `http:`/`https:`. Profile photos are re-encoded in a canvas before they are stored, and only validated `data:image/…` values reach an `<img>`.

Residual risks to know about:

- Recordings and profile photos live in this browser, not in Supabase. Anyone with access to the unlocked browser profile or its developer tools can read them. Clear site data on shared computers.
- Legacy audio files are served from `/audio` so `<audio>` can stream them without a header. Filenames are random UUIDs, but the route is not per-user. Do not use the legacy backend for private material until signed URLs are added.
- Password reset and account recovery are not built yet.
- Sessions are kept in browser storage by `supabase-js`. The CSP and escaped rendering reduce XSS exposure, but any future `dangerouslySetInnerHTML` or third-party script would undermine that.
- When projects move into Supabase Postgres/Storage, enable Row Level Security on every table and scope policies to `auth.uid()`; the current app has no application tables to protect.

## Development

- Run `npm run lint` and `npm run build` in `frontend/`.
- Run the analysis tests with `node --test src/__tests__/musicFeatures.test.js src/__tests__/signalProfile.test.js` in `frontend/`.
- Browser suites run from the repository root: `node frontend/scripts/testAuthBrowser.mjs`, `node frontend/scripts/testCaptureBrowser.mjs`, and `node frontend/scripts/testProjectControls.mjs`. They use local Chrome; the auth suite mocks Supabase's endpoints and needs no keys.
- Security suites: `node frontend/scripts/testSecurityBrowser.mjs` (URL tampering, cross-account isolation, stored XSS), `node frontend/scripts/testProfilePhoto.mjs` (upload, crop, rejection, removal), `node frontend/scripts/testSecrets.mjs` (no tracked credentials), and `npm test` in `backend/` (API authorization, CORS, rate limits, upload filtering).
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
- [x] Sign in with Google through Supabase OAuth.
- [x] Upload a profile photo from the computer, cropped and stored locally.
- [x] Isolate accounts, harden uploads and headers, and keep credentials out of Git.

**Still to build**

- [ ] Self-service password reset and account recovery.
- [ ] Sync browser-recorded takes, branch relationships, and mix selections across devices.
- [ ] Populate the community feed with activity from real accounts.
