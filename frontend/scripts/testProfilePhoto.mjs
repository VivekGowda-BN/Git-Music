// Profile photo upload: choose a local image, crop it in the browser, persist it
// per workspace, reject non-images and remove it again.
// Run: node frontend/scripts/testProfilePhoto.mjs
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

// 1x1 transparent PNG, upscaled by the canvas crop.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

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

  // /preview/profile opens the demo artist so the header avatar is visible.
  await page.goto('/preview/profile');
  await page.waitForURL('**/profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();

  const fileInput = page.locator('.portrait-edit input[type=file]');
  await fileInput.setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: PNG });
  const preview = page.locator('.portrait-edit img');
  await page.waitForFunction(() => document.querySelector('.portrait-edit img')?.src.startsWith('data:image/jpeg'));
  assert.match(await preview.getAttribute('src'), /^data:image\/jpeg;base64,/);

  // A text file is rejected without replacing the chosen photo.
  const before = await preview.getAttribute('src');
  await fileInput.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await page.getByRole('alert').filter({ hasText: 'Choose a JPEG, PNG, WebP, GIF, BMP or AVIF image.' }).waitFor();
  assert.equal(await preview.getAttribute('src'), before);

  await page.getByLabel('Artist name').fill('Photo Artist');
  await page.getByRole('button', { name: 'Save profile' }).click();

  const portrait = page.locator('.artist-portrait');
  assert.match(await portrait.getAttribute('src'), /^data:image\/jpeg;base64,/);
  assert.equal(await portrait.getAttribute('alt'), 'Photo Artist profile photo');
  assert.match(await page.locator('.avatar-link img').getAttribute('src'), /^data:image\/jpeg;base64,/,
    'The header avatar must use the uploaded photo');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('swarhub:guest')).artist);
  assert.equal(stored.name, 'Photo Artist');
  assert.match(stored.photo, /^data:image\/jpeg;base64,/);
  assert.ok(stored.photo.length < 400 * 1024, 'Stored photo must stay small');

  await page.reload();
  await page.locator('.artist-portrait').waitFor();
  assert.match(await page.locator('.artist-portrait').getAttribute('src'), /^data:image\/jpeg;base64,/,
    'Photo must survive a reload');
  assert.match(await page.locator('.avatar-link img').getAttribute('src'), /^data:image\/jpeg;base64,/);

  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  assert.match(await page.locator('.artist-portrait').getAttribute('src'), /\/art\/artist\.svg$/);
  assert.match(await page.locator('.avatar-link img').getAttribute('src'), /\/art\/artist\.svg$/);

  assert.deepEqual(errors, [], 'Uncaught page errors');
  console.log('PASS profile photo upload, crop, persistence, rejection and removal');
} finally {
  await browser?.close();
  await server.close();
}
