// Verify that local credentials never enter the Git index.
// Run from the repository root: node frontend/scripts/testSecrets.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const git = (args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'});

// 1. Local env files must be ignored.
for (const file of ['frontend/.env', 'frontend/.env.local', 'backend/.env', '.env']) {
  if (!existsSync(join(root, file))) continue;
  execFileSync('git', ['check-ignore', '-q', file], {cwd: root});
}

// 2. No tracked file may contain a value from the local env file.
const secrets = [];
const envPath = join(root, 'frontend/.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^(VITE_[A-Z0-9_]*(?:KEY|SECRET|URL))\s*=\s*(.+)$/.exec(line.trim());
    if (match) secrets.push(match[2].trim());
  }
}

const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean);
const findings = [];
const patterns = [
  [/sb_secret_[A-Za-z0-9_-]{16,}/g, 'Supabase secret key'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
  [/postgresql:\/\/[^:\s/]+:[^@\s]+@/g, 'database URL with password'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, 'private key']
];

for (const file of tracked) {
  let text;
  try { text = readFileSync(join(root, file), 'utf8'); }
  catch { continue; }
  if (text.includes('\0')) continue;
  for (const secret of secrets) {
    if (secret.length >= 12 && text.includes(secret)) findings.push(`${file}: local credential value`);
  }
  for (const [pattern, label] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) findings.push(`${file}: ${label}`);
  }
}

assert.equal(findings.length, 0, `Tracked secrets found:\n${findings.join('\n')}`);
assert.equal(git(['ls-files', 'frontend/.env']).trim(), '', 'frontend/.env must never be tracked');

// 3. Static-host security headers stay in place.
const headers = readFileSync(join(root, 'frontend/public/_headers'), 'utf8');
assert.match(headers, /Content-Security-Policy:.*script-src 'self'/);
assert.match(headers, /frame-ancestors 'none'/);
assert.match(headers, /X-Content-Type-Options: nosniff/);

console.log(`PASS ${tracked.length} tracked files contain no local credentials (${secrets.length} env values checked); security headers present`);
