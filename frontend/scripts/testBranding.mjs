// Brand mark: the transparent PNG loads in the header, auth card and favicon.
// Run: node frontend/scripts/testBranding.mjs
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
let browser;
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: 'chrome' });
  const page = await browser.newPage({ baseURL: base, viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(15000);

  await page.goto('/home');
  const mark = page.locator('.glass-nav .brand img');
  await mark.waitFor();
  assert.match(await mark.getAttribute('src'), /\/art\/swarhub-mark\.png$/);
  assert.equal(await mark.evaluate((image) => image.naturalWidth), 512, 'The 512px mark must decode');
  assert.match(await mark.evaluate((image) => getComputedStyle(image).filter), /invert\(1\)/, 'The header mark is recoloured for the dark nav');
  assert.match(await page.locator('link[rel=icon]').getAttribute('href'), /\/art\/swarhub-mark\.png$/);

  // Corners must be transparent; the middle of the clef must be opaque.
  const alpha = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/art/swarhub-mark.png';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const read = (x, y) => context.getImageData(x, y, 1, 1).data[3];
    return { corners: [read(0, 0), read(511, 0), read(0, 511), read(511, 511)], centre: read(256, 256) };
  });
  assert.deepEqual(alpha.corners, [0, 0, 0, 0], 'The source background must be transparent');
  assert.ok(alpha.centre > 200, 'The mark itself must stay opaque');

  await page.screenshot({ path: join(tmpdir(), 'swarhub-brand-header.png'), clip: { x: 0, y: 0, width: 1280, height: 120 } });

  await page.goto('/login');
  const authMark = page.locator('.auth-brand img');
  await authMark.waitFor();
  assert.match(await authMark.getAttribute('src'), /\/art\/swarhub-mark\.png$/);
  assert.equal(await authMark.evaluate((image) => image.naturalWidth), 512);
  await page.screenshot({ path: join(tmpdir(), 'swarhub-brand-auth.png'), clip: { x: 380, y: 80, width: 520, height: 260 } });

  console.log('PASS transparent 512px brand mark in header, auth card and favicon');
} finally {
  await browser?.close();
  await server.close();
}
