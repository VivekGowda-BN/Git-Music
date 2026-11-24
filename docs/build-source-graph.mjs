// Optional maintenance command: node docs/build-source-graph.mjs
// Index first-party source imports without loading the modules or contacting a service.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = new Set();
const edges = [];
function index(dir) {
  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const id = path.posix.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', 'dist'].includes(item.name)) index(id);
    else if (/\.(m?js|jsx|css)$/.test(id) && fs.statSync(path.join(root,id)).isFile()) files.add(id);
  }
}
for (const dir of ['frontend', 'backend', 'scratch']) index(dir);
for (const id of files) {
  const source = fs.readFileSync(path.join(root, id), 'utf8');
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*|\brequire\(\s*)['"](\.[^'"]+)['"]/g)) {
    const target = path.posix.join(path.posix.dirname(id), match[1]);
    const resolved = [target, `${target}.jsx`, `${target}.js`, `${target}/index.js`].find(p => files.has(p));
    if (resolved) edges.push({ from: id, to: resolved, relation: 'imports' });
  }
  if (id === 'backend/server.js') {
    for (const m of source.matchAll(/app\.(get|post|delete|put|patch)\(['"]([^'"]+)['"]/g)) {
      edges.push({ from: id, to: `${m[1].toUpperCase()} ${m[2]}`, relation: 'serves' });
    }
  }
}
const active = new Set();
function visit(id) {
  if (active.has(id)) return;
  active.add(id);
  for (const e of edges) if (e.from === id && e.relation === 'imports') visit(e.to);
}
visit('frontend/src/main.jsx');
if (!active.has('frontend/src/studio/Studio.jsx') || !files.has('backend/server.js')) {
  throw Error('Source indexing is incomplete: check the frontend entry and backend server.');
}
const nodes = [...files].sort().map(id => ({
  id, group: active.has(id) ? 'active-frontend' : id.startsWith('frontend/src/') ? 'previous-frontend' : id.split('/')[0],
}));
for (const e of edges.filter(e => e.relation === 'serves')) nodes.push({ id: e.to, group: 'endpoint' });
fs.writeFileSync(path.join(root,'docs/swarhub-graph.json'), JSON.stringify({ nodes, edges },null,2)+'\n');
console.log(`Indexed ${nodes.length} nodes and ${edges.length} edges.`);
