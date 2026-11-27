# SwarHub project memory

- At the start of every project task, read **Current handoff** in `docs/swarhub-graph.md` and run `graphify query "<task-specific question>"` from the repo root. If `graphify-out/graph.json` is missing (including on a fresh clone), run `graphify update .` first. Use the answer and the active-source map to open only the files needed. Previous chat history is not required.
- After every change set, including uncommitted work, update the handoff with what changed, relevant paths, verification and the next unfinished step or blocker. Update the map's edges for new assets, routes, storage, configuration or behavior: Graphify's code extractor does not capture all of these.
- Before handing off, run `node docs/build-source-graph.mjs` and `graphify update .`, then check a focused query for the changed code. If refresh fails, record the failure in the handoff; do not mark the graph current.
- On a new checkout, run `graphify hook status` and `graphify hook install` if missing. The hooks refresh the local Graphify index on Git events; they do not replace the change-set handoff. Keep the tracked map and handoff with the changes; `graphify-out/` is generated locally.
