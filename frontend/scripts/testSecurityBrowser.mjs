// Cross-account and URL-tampering checks against the real router and Supabase
// client, with the auth endpoints mocked. Run:
// node frontend/scripts/testSecurityBrowser.mjs
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const authOrigin = 'https://auth-fixture.invalid';
process.env.VITE_SUPABASE_URL = authOrigin;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.VITE_AUTH_PROVIDER = 'supabase';

const people = {
  'alice@example.test': { id: '11111111-1111-4111-8111-111111111111', name: 'Alice' },
  'bob@example.test': { id: '22222222-2222-4222-8222-222222222222', name: 'Bob' }
};
const password = 'example-passphrase';

const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
let browser;
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: 'chrome' });
  const page = await browser.newPage({ baseURL: base });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route(`${authOrigin}/auth/v1/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const body = request.postDataJSON?.() || {};
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/token')) {
      const grant = url.searchParams.get('grant_type');
      if (grant !== 'password' || body.password !== password) {
        return route.fulfill({ status: 400, json: { message: 'Invalid login credentials' } });
      }
      const person = people[body.email];
      if (!person) return route.fulfill({ status: 400, json: { message: 'Invalid login credentials' } });
      return route.fulfill({
        json: {
          access_token: `fixture-${person.id}`,
          refresh_token: `refresh-${person.id}`,
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: person.id, email: body.email, app_metadata: {}, user_metadata: { artist_name: person.name } }
        }
      });
    }
    throw Error(`Unexpected auth request: ${url.pathname}`);
  });

  async function signIn(email) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.locator('[name=password]').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }

  // Alice signs in and keeps a private project in her own workspace.
  await signIn('alice@example.test');
  await page.evaluate((id) => {
    localStorage.setItem(`swarhub:supabase-${id}`, JSON.stringify({
      projects: [{ id: 'alice-secret', title: 'Secret Song', is_public: false, takes: [{ id: 'alice-take', name: 'Take', created: new Date().toISOString() }] }],
      applications: [],
      artist: { name: 'Alice', bio: '', gear: '', photo: '' },
      mixes: {}
    }));
  }, people['alice@example.test'].id);
  await page.reload();
  await page.getByRole('heading', { name: 'Secret Song', exact: true }).waitFor();

  // Changing the URL to another project ID must not open someone else's work.
  await page.goto('/dashboard?project=bob-private&take=bob-take');
  await page.getByRole('heading', { name: 'Your projects.' }).waitFor();
  assert.equal(await page.locator('.detail-layout').count(), 0, 'Unknown project IDs must not render a repository');
  assert.equal(await page.getByRole('link', { name: 'All projects' }).count(), 0, 'A tampered URL must not open a detail page');
  assert.equal(await page.locator('.project-card').count(), 1, 'The shelf still lists only the signed-in account’s projects');

  // Stored text is escaped, and non-http links are never rendered.
  await page.evaluate((id) => {
    const key = `swarhub:supabase-${id}`;
    const library = JSON.parse(localStorage.getItem(key));
    library.artist.bio = '<img src=x onerror="window.__xss=1">';
    library.artist.website = 'javascript:window.__xss=2';
    localStorage.setItem(key, JSON.stringify(library));
  }, people['alice@example.test'].id);
  await page.goto('/profile');
  await page.locator('.artist-sidebar p').first().waitFor();
  assert.match(await page.locator('.artist-sidebar p').first().textContent(), /<img src=x onerror=/);
  assert.equal(await page.evaluate(() => window.__xss), undefined, 'Stored bio must not execute');
  assert.equal(await page.locator('a[href^="javascript:"]').count(), 0, 'javascript: links must not render');

  // A tampered photo value must fall back to the bundled illustration.
  await page.evaluate((id) => {
    const key = `swarhub:supabase-${id}`;
    const library = JSON.parse(localStorage.getItem(key));
    library.artist.photo = 'javascript:window.__xss=3';
    localStorage.setItem(key, JSON.stringify(library));
  }, people['alice@example.test'].id);
  await page.reload();
  assert.match(await page.locator('.artist-portrait').getAttribute('src'), /\/art\/artist\.svg$/);

  // Bob signs in on the same browser: Alice's library must not appear.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/home');
  await signIn('bob@example.test');
  await page.getByRole('heading', { name: 'No recordings yet' }).waitFor();
  assert.equal(await page.getByText('Secret Song', { exact: true }).count(), 0, 'Another account must not see Alice projects');

  const stored = await page.evaluate((ids) => ({
    alice: JSON.parse(localStorage.getItem(`swarhub:supabase-${ids.alice}`) || 'null'),
    bob: JSON.parse(localStorage.getItem(`swarhub:supabase-${ids.bob}`) || 'null'),
    guest: localStorage.getItem('swarhub:guest')
  }), { alice: people['alice@example.test'].id, bob: people['bob@example.test'].id });
  assert.equal(stored.alice.projects[0].title, 'Secret Song', 'Alice keeps her own workspace');
  assert.equal(stored.bob?.projects?.some((project) => project.title === 'Secret Song') ?? false, false, 'Bob workspace must not contain Alice data');
  assert.equal(stored.guest, null, 'Account data must never be copied into the guest workspace');

  assert.deepEqual(errors, [], 'Uncaught page errors');
  console.log('PASS URL tampering, cross-account isolation, stored XSS escaping and unsafe-link rejection');
} finally {
  await browser?.close();
  await server.close();
}
