# SwarHub

Version control for your sound. Record a song idea, branch it into different takes, and keep the versions together as one project.

![SwarHub home page with the “Capture an idea” button and cassette listening desk](docs/images/swarhub-home.png)

## Explore the studio

| Room | What you can do |
| --- | --- |
| Capture | Record a take with your microphone or import an audio file and listen back to a suggested excerpt. |
| Dashboard | Explore a project's take history, compare branches, and choose a master mix. |
| Feed | Browse the sample community feed and follow links to open music calls. |
| Opportunities | Filter manually curated gigs, jams, band openings, collaborations, and castings. Each card opens the original listing. |

## Run locally

With Node.js 22.12+ and npm installed, run these commands from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). The studio preview works without the API; local recordings and project metadata stay in that browser.

### Optional backend

For the Express API, open another terminal in `backend/` and run `npm ci`. Generate a signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save the result as `JWT_SECRET=<generated value>` in `backend/.env`, then start the API:

```sh
node --env-file=.env server.js
```

The API defaults to `http://localhost:3000` and initializes its SQLite database on startup. In a hosted deployment, supply `JWT_SECRET` through the environment.

## Development

- Run `npm run lint` and `npm run build` in `frontend/`.
- Edit [`frontend/src/studio/opportunities.js`](frontend/src/studio/opportunities.js) to curate the board.
- See the [project map](docs/swarhub-graph.md) for routes, data flows, and storage.
