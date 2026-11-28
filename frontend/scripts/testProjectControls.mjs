// Focused E2E for the two destructive controls: discard a take before saving,
// and delete a saved project from its detail page (never from the card grid).
// Run: node frontend/scripts/testProjectControls.mjs
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'project-controls-e2e-'));
const rate = 44100;
const stamp = Date.now();

function wav(seconds, sample) {
  const frames = seconds * rate, bytes = frames * 2, out = Buffer.alloc(44 + bytes);
  out.write('RIFF'); out.writeUInt32LE(36 + bytes, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(2 * rate, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(bytes, 40);
  for (let i = 0; i < frames; i++) out.writeInt16LE(Math.round(32767 * sample(i / rate)), 44 + 2 * i);
  return out;
}
function music(t) {
  const notes = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]][Math.floor(t / 2) % 4];
  const beat = t % .5, env = Math.min(1, beat * 90) * Math.exp(-5 * beat);
  return env * notes.reduce((v, n) => v + .15 * Math.sin(2 * Math.PI * 440 * 2 ** ((n - 69) / 12) * t), 0);
}

let server, browser, failed = 0;
try {
  const file = join(temp, 'control-test.wav');
  await writeFile(file, wav(8, music));
  let baseURL = process.env.BASE_URL;
  if (!baseURL) {
    server = await createServer({root, logLevel: 'error', server: {host: '127.0.0.1', port: 0, hmr: false}});
    await server.listen();
    baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  }
  browser = await chromium.launch({
    ...(process.env.BROWSER_PATH ? {executablePath: process.env.BROWSER_PATH} : {channel: 'chrome'}),
  });
  const context = await browser.newContext({baseURL, viewport: {width: 1280, height: 900}});
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  const discardName = `Discard probe ${stamp}`;
  const deleteName = `Delete probe ${stamp}`;
  const openCapture = async () => {
    await page.goto('/capture');
    await page.getByRole('button', {name: 'Record a take'}).waitFor();
  };
  const upload = async () => {
    await page.locator('input[type=file]').setInputFiles(file);
    await page.getByRole('button', {name: 'Save this take'}).waitFor({timeout: 120000});
  };
  const openSaveDialog = async title => {
    await page.getByRole('button', {name: 'Save this take'}).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByLabel('Project name').fill(title);
    await dialog.getByLabel('Private', {exact: true}).check();
    return dialog;
  };

  try {
    await page.goto('/dashboard');
    await page.getByRole('heading',{name:'No recordings yet'}).waitFor();
    assert.equal(await page.locator('.project-card').count(),0);
    // Browsers that already stored the three starter projects must also open empty.
    await page.evaluate(()=>{
      const projects=['scarborough-fair','tidal-room','after-hours'].map(id=>({
        id,title:id,demo:true,takes:[{id:'main',part:'guitar',created:'Studio demo'}]
      }));
      localStorage.setItem('swarhub:guest',JSON.stringify({projects}));
    });
    await page.reload();
    await page.getByRole('heading',{name:'No recordings yet'}).waitFor();
    assert.equal(await page.locator('.project-card').count(),0);

    // 1. The X in the naming box cancels the take and leaves no project behind.
    await openCapture();
    await upload();
    const dialog = await openSaveDialog(discardName);
    await dialog.getByRole('button', {name: 'Cancel and delete this recording'}).click();
    await page.getByRole('dialog').waitFor({state: 'detached'});
    assert.equal(await page.getByRole('button', {name: 'Save this take'}).count(), 0,
      'Discarding must clear the analysed take');
    assert.equal(await page.locator('.analysis audio, .hook-preview a').count(), 0,
      'Discarding must remove the take preview and highlight export');
    await page.goto('/dashboard');
    await page.getByRole('heading', {name: 'Your projects.'}).waitFor();
    assert.equal(await page.getByText(discardName, {exact: true}).count(), 0,
      'Discarded take must not be saved to the dashboard');
    await page.reload();
    assert.equal(await page.getByText(discardName, {exact: true}).count(), 0,
      'Discarded take must not reappear after reload');
    console.log('PASS discard from the naming dialog');

    // 2. The text button below the form also discards.
    await openCapture();
    await upload();
    await page.getByRole('button', {name: 'Save this take'}).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', {name: 'Cancel & delete take'}).click();
    await page.getByRole('dialog').waitFor({state: 'detached'});
    assert.equal(await page.getByRole('button', {name: 'Save this take'}).count(), 0);
    console.log('PASS discard from the dialog action');

    // 3. Closing the dialog with Escape also deletes the unsaved take.
    await openCapture();
    await upload();
    await page.getByRole('button', {name: 'Save this take'}).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state: 'detached'});
    assert.equal(await page.getByRole('button', {name: 'Save this take'}).count(), 0,
      'Closing the dialog must delete the unsaved take');
    console.log('PASS discard by closing the dialog');

    // 4. Delete is only offered on the project detail page, never on a card.
    await openCapture();
    await upload();
    await openSaveDialog(deleteName);
    await page.getByRole('dialog').getByRole('button', {name: 'Save to dashboard'}).click();
    await page.waitForURL(/\/dashboard\?project=.+&take=.+/);
    await page.getByRole('heading', {name: `${deleteName}.`, exact: true}).waitFor();
    assert.equal(await page.locator('.project-card').count(), 0,
      'Project cards are not rendered on the detail page');
    await page.getByRole('link', {name: 'All projects'}).click();
    await page.getByRole('heading', {name: 'Your projects.'}).waitFor();
    const card = page.getByRole('link').filter({has: page.getByRole('heading', {name: deleteName, exact: true})});
    await card.waitFor();
    assert.equal(await page.locator('.project-card').count(),1);
    const storedDate = await page.evaluate(()=>JSON.parse(localStorage.getItem('swarhub:guest')).projects[0].takes[0].created);
    assert.equal(await card.locator('time').getAttribute('datetime'),storedDate);
    await card.locator('img').evaluate(image=>image.decode());
    assert.ok(await card.locator('img').evaluate(image=>image.naturalWidth>0));
    assert.equal(await card.getByRole('button', {name: /delete/i}).count(), 0, 'Card must not expose a delete control');
    assert.equal(await card.locator('.btn.danger').count(), 0, 'Card must not expose a danger action');
    await card.click();
    await page.getByRole('heading', {name: `${deleteName}.`, exact: true}).waitFor();
    await page.getByText('Project settings', {exact: true}).click();
    await page.getByRole('button', {name: 'Delete project'}).click();
    await page.getByRole('button', {name: 'Delete permanently'}).click();
    await page.waitForURL(/\/dashboard$/);
    await page.getByRole('heading', {name: 'Your projects.'}).waitFor();
    assert.equal(await page.getByText(deleteName, {exact: true}).count(), 0,
      'Deleted project must disappear from the dashboard');
    await page.reload();
    await page.getByRole('heading', {name: 'Your projects.'}).waitFor();
    await page.getByRole('heading',{name:'No recordings yet'}).waitFor();
    assert.equal(await page.getByText(deleteName, {exact: true}).count(), 0,
      'Deleted project must stay deleted after reload');
    console.log('PASS delete from the project detail page');

    await page.evaluate(()=>{
      const projects=Array.from({length:12},(_,i)=>({
        id:`photo-${i}`,title:`Session ${i}`,takes:[{id:`take-${i}`,created:'2026-05-01T12:00:00Z'}]
      }));
      localStorage.setItem('swarhub:guest',JSON.stringify({projects}));
    });
    await page.reload();
    const photos=page.locator('.sleeve-card img');
    await photos.first().waitFor();
    const sources=await photos.evaluateAll(async images=>Promise.all(images.map(async image=>{
      image.loading='eager';
      await image.decode();
      return image.getAttribute('src');
    })));
    assert.equal(new Set(sources).size,12);
    assert.ok(sources.every(src=>/^\/art\/projects\/\d+\.webp$/.test(src)));
    await page.getByRole('searchbox').fill('Session 8');
    assert.equal(await photos.getAttribute('src'),sources[8]);
    await page.reload();
    await photos.first().waitFor();
    assert.deepEqual(await photos.evaluateAll(images=>images.map(img=>img.getAttribute('src'))),sources);
    console.log('PASS 12 distinct Dashboard photos decode and stay stable across search and reload');

    assert.deepEqual(errors, [], 'Uncaught page errors');
  } catch (error) {
    failed++;
    console.error(`FAIL\n${error.stack}${errors.length ? '\nPage errors: ' + errors.join('; ') : ''}`);
  } finally {
    await context.close();
  }
} finally {
  try { await browser?.close(); } finally {
    try { await server?.close(); } finally { await rm(temp, {recursive: true, force: true}); }
  }
}
if (failed) process.exitCode = 1;
