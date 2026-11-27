// Security regression suite for the legacy Express API.
// Run from backend/: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { once } = require('node:events');

const tempDir = mkdtempSync(join(tmpdir(), 'swarhub-security-'));
process.env.SQLITE_PATH = join(tempDir, 'test.sqlite');
process.env.JWT_SECRET = 'test-secret-'.padEnd(64, 'x');
process.env.RATE_LIMIT_MAX = '5';
process.env.RATE_LIMIT_SIGNUP_MAX = '50';
process.env.CORS_ORIGINS = 'http://localhost:5173';

const app = require('../server');
const db = require('../db');

let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => db.close(resolve));
  rmSync(tempDir, { recursive: true, force: true });
});

async function json(path, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
}

async function signup(username, email) {
  return json('/signup', { method: 'POST', body: { username, email, password: 'correct-horse-battery' } });
}

async function login(email, password = 'correct-horse-battery') {
  const result = await json('/login', { method: 'POST', body: { email, password } });
  return result;
}

test('debug endpoints are gone', async () => {
  assert.equal((await json('/debug/users')).status, 404);
  assert.equal((await json('/debug/tables')).status, 404);
});

test('anonymous requests cannot read or mutate recordings', async () => {
  assert.equal((await json('/versions')).status, 401);
  assert.equal((await json('/recordings/anything', { method: 'DELETE' })).status, 401);
  assert.equal((await json('/upload', { method: 'POST' })).status, 401);
  assert.equal((await json('/analyze-description', { method: 'POST', body: { description: 'x' } })).status, 401);
  assert.equal((await json('/projects', { method: 'POST', body: { title: 'x' } })).status, 401);
});

test('signup validates input and normalises email', async () => {
  assert.equal((await signup('a', 'short@example.test')).status, 400);
  assert.equal((await json('/signup', { method: 'POST', body: { username: 'Valid', email: 'not-an-email', password: 'long-enough-password' } })).status, 400);
  assert.equal((await json('/signup', { method: 'POST', body: { username: 'Valid', email: 'valid@example.test', password: 'short' } })).status, 400);

  const created = await signup('Alice', 'Alice@Example.Test');
  assert.equal(created.status, 200);
  const signedIn = await login('alice@example.test');
  assert.equal(signedIn.status, 200);
  assert.ok(signedIn.body.access_token);
});

test('JWT algorithm is pinned and forged tokens are rejected', async () => {
  const noneToken = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ user_id: 1 })).toString('base64url')}.`;
  assert.equal((await json('/me', { token: noneToken })).status, 401);
  assert.equal((await json('/me', { token: 'not-a-token' })).status, 401);
});

test('SQL injection in login does not bypass authentication', async () => {
  const result = await json('/login', { method: 'POST', body: { email: "' OR 1=1 --", password: 'anything-at-all' } });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'Invalid credentials');
});

test('accounts are isolated: another user cannot read, branch from, or delete', async () => {
  await signup('Bob', 'bob@example.test');
  const alice = (await login('alice@example.test')).body.access_token;
  const bob = (await login('bob@example.test')).body.access_token;

  const project = await json('/projects', { method: 'POST', token: alice, body: { title: 'Alice private', is_public: false } });
  assert.equal(project.status, 200);
  const projectId = project.body.id;

  assert.equal((await json(`/projects/${projectId}/versions`, { token: bob })).status, 403);
  assert.equal((await json(`/projects/${projectId}`, { method: 'DELETE', token: bob })).status, 403);
  assert.equal((await json(`/projects/${projectId}/versions`, { token: alice })).status, 200);

  const form = new FormData();
  form.append('audio', new Blob([Buffer.from('RIFF....WAVEfmt ')], { type: 'audio/wav' }), 'take.wav');
  form.append('name', 'Alice take');
  const upload = await fetch(`${base}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${alice}` }, body: form });
  assert.equal(upload.status, 200);
  const recording = await upload.json();

  const bobVersions = await json('/versions', { token: bob });
  assert.equal(bobVersions.status, 200);
  assert.equal(bobVersions.body.some((row) => row.id === recording.id), false);

  const branch = new FormData();
  branch.append('audio', new Blob([Buffer.from('RIFF....WAVEfmt ')], { type: 'audio/wav' }), 'branch.wav');
  branch.append('parent_id', recording.id);
  assert.equal((await fetch(`${base}/branch`, { method: 'POST', headers: { Authorization: `Bearer ${bob}` }, body: branch })).status, 403);

  assert.equal((await json(`/recordings/${recording.id}`, { method: 'DELETE', token: bob })).status, 404);
  assert.equal((await json(`/recordings/${recording.id}`, { method: 'DELETE', token: alice })).status, 200);
  assert.equal((await json(`/projects/${projectId}`, { method: 'DELETE', token: alice })).status, 200);
});

test('uploads reject non-audio payloads that could be served as script', async () => {
  const alice = (await login('alice@example.test')).body.access_token;
  const form = new FormData();
  form.append('audio', new Blob([Buffer.from('<svg onload=alert(1)>')], { type: 'image/svg+xml' }), 'payload.svg');
  const response = await fetch(`${base}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${alice}` }, body: form });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Unsupported audio file type');
});

test('CORS only allows configured origins and security headers are present', async () => {
  const blocked = await json('/health', { headers: { Origin: 'https://evil.example' } });
  assert.equal(blocked.status, 200);
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  assert.equal(blocked.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(blocked.headers.get('x-frame-options'), 'DENY');
  assert.equal(blocked.headers.get('x-powered-by'), null);

  const allowed = await json('/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('repeated failed logins are rate limited', async () => {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    lastStatus = (await login('nobody@example.test', 'wrong-password')).status;
    if (lastStatus === 429) break;
  }
  assert.equal(lastStatus, 429);
});
