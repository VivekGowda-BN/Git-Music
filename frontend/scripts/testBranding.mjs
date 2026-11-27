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
  // Check the actual tab icon, which cannot inherit the header's CSS filter.
  const icon = await page.locator('link[rel=icon]').evaluate(async (link) => {
    const image = new Image();
    image.src = link.href;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];
    return { corner: pixel(0, 0), centre: pixel(canvas.width / 2, canvas.height / 2) };
  });
  assert.equal(icon.corner[3], 0, 'The tab icon background must be transparent');
  const [red, green, blue, opacity] = icon.centre;
  assert.ok(Math.min(red, green, blue) >= 250, 'The tab clef must render white');
  assert.equal(opacity, 255, 'The middle of the tab clef must be opaque');

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
