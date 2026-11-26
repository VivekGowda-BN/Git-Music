// node frontend/scripts/testCaptureBrowser.mjs ["path/to/another song.mp3" ...]
// BASE_URL: existing dev/preview URL (otherwise start Vite on a free local port).
// BROWSER_PATH: installed Chrome/Chromium executable (default: Chrome channel).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const songs = [join(root, 'public/audio/the-nights-excerpt.mp3'), ...process.argv.slice(2).map(p => resolve(p))];
const temp = await mkdtemp(join(tmpdir(), 'capture-e2e-'));
const rate = 44100;

function wav(seconds, sample) {
  const frames = seconds * rate, bytes = frames * 2, out = Buffer.alloc(44 + bytes);
  out.write('RIFF'); out.writeUInt32LE(36 + bytes, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(2 * rate, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(bytes, 40);
  for (let i = 0; i < frames; i++) out.writeInt16LE(Math.round(32767 * sample(i / rate)), 44 + 2*i);
  return out;
}
function music(t) {
  const notes = [[60,64,67],[65,69,72],[67,71,74],[60,64,67]][Math.floor(t / 2) % 4];
  const beat = t % .5, env = Math.min(1, beat * 90) * Math.exp(-5 * beat);
  return env * notes.reduce((v,n) => v + .15*Math.sin(2*Math.PI*440*2**((n-69)/12)*t), 0);
}
function near(value, expected, tolerance, label) {
  assert.ok(Number.isFinite(value) && Math.abs(value - expected) <= tolerance,
    `${label}: ${value}, expected ${expected} ± ${tolerance}`);
}
function range(value, min, max, label) {
  assert.ok(Number.isFinite(value) && value >= min && value <= max, `${label}: ${value} outside [${min}, ${max}]`);
}
function seconds(time) {
  const [m,s] = time.split(':').map(Number);
  return m*60+s;
}
const labels = ['Tempo','Musical key','Frequency span','Dynamics','Average level','Peak level'];
async function readings(page) {
  const rows = page.locator('.analysis .readouts > div');
  const result = {};
  for (const label of labels) {
    const row = rows.filter({has: page.getByText(label, {exact:true})});
    assert.ok(await row.isVisible(), `Missing reading: ${label}`);
    result[label] = (await row.locator('strong').innerText()).trim();
  }
  await page.getByRole('heading', {name:'Frequency balance'}).waitFor();
  return result;
}
async function inspect(page, sourceDuration) {
  const panel = page.locator('.analysis');
  const link = panel.getByRole('link', {name:/Export highlight as WAV/});
  await link.waitFor({timeout:120000});
  const values = await readings(page);
  const bpm = values.Tempo === 'Unclear' ? null : Number(/^(\d+) BPM$/.exec(values.Tempo)?.[1]);
  if (bpm !== null) range(bpm, 38, 245, 'tempo');
  assert.match(values['Musical key'], /^(Unclear|[A-G][♭♯b#]? (major|minor))$/);
  const span = /^([\d.]+) (k?Hz) – ([\d.]+) (k?Hz)$/.exec(values['Frequency span']);
  assert.ok(span, `frequency span: ${values['Frequency span']}`);
  const hz = (v,unit) => Number(v)*(unit === 'kHz' ? 1000 : 1);
  const lo = hz(span[1],span[2]), hi = hz(span[3],span[4]);
  range(lo, 1, 24000, 'lower frequency'); range(hi, lo, 24000, 'upper frequency');
  const level = (label,unit) => {
    assert.ok(values[label].endsWith(` ${unit}`), `${label}: ${values[label]}`);
    return Number(values[label].split(' ')[0]);
  };
  const rms = level('Average level','dBFS'), peak = level('Peak level','dBFS');
  range(peak,-150,6,'peak'); range(rms,-170,peak+.001,'RMS');
  range(level('Dynamics','dB'),0,150,'dynamics');
  const bands = {};
  for (const name of ['low','mid','high']) {
    const item = panel.locator('.band-legend span').filter({hasText:new RegExp(name,'i')});
    assert.ok(await item.isVisible(), `Missing ${name} band`);
    const text = await item.locator('b').innerText();
    assert.match(text,/^\d+%$/); bands[name] = parseInt(text);
    range(bands[name],0,100,`${name} balance`);
  }
  near(bands.low+bands.mid+bands.high,100,1,'rounded band shares');
  const bounds = await panel.locator('.clip-range').innerText();
  assert.match(bounds,/^\d+:\d\d\.\d – \d+:\d\d\.\d$/);
  const [start,end] = bounds.split(' – ').map(seconds);
  range(start,0,sourceDuration+.051,'start'); range(end,start,sourceDuration+.051,'end');
  assert.ok((await panel.locator('.hook-preview p').innerText()).trim(), 'Missing highlight explanation');

  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  assert.match(download.suggestedFilename(), /\.wav$/i);
  const body = await readFile(await download.path());
  assert.equal(body.toString('ascii',0,4),'RIFF'); assert.equal(body.toString('ascii',8,16),'WAVEfmt ');
  assert.equal(body.readUInt32LE(4)+8,body.length); assert.equal(body.readUInt16LE(20),1,'PCM WAV');
  const channels = body.readUInt16LE(22), sr = body.readUInt32LE(24), align = body.readUInt16LE(32);
  range(channels,1,32,'export channels'); range(sr,8000,192000,'export sample rate');
  assert.equal(body.readUInt16LE(34),16); assert.equal(align,2*channels);
  assert.equal(body.toString('ascii',36,40),'data'); assert.equal(body.readUInt32LE(40),body.length-44);
  const duration = (body.length-44)/align/sr;
  range(duration,1/sr,15+1/sr,'WAV duration');
  near(duration,end-start,.101,'WAV vs rounded on-screen bounds');
  let power = 0;
  for (let pos = 44; pos < body.length; pos += 2) power += (body.readInt16LE(pos)/32768)**2;
  assert.ok(power > 0, 'Exported silent WAV');
  const wavRms = 10*Math.log10(power/((body.length-44)/2));
  const player = panel.getByLabel('Play suggested highlight');
  const played = await player.evaluate(async audio => {
    await audio.play();
    const result = {active:!audio.paused, duration:audio.duration};
    audio.pause(); return result;
  });
  assert.ok(played.active); near(played.duration,duration,.001,'preview vs exported WAV');
  return {values,bands,bounds,duration,channels,wavRms,hash:createHash('sha256').update(body).digest('hex')};
}

async function openCapture(page) {
  await page.goto('/capture');
  await page.getByRole('button',{name:'Record a take'}).waitFor();
}
async function upload(page, file) {
  await page.locator('input[type=file]').setInputFiles(file);
}
async function ready(page) {
  const save = page.getByRole('button',{name:'Save this take'});
  const alert = page.getByRole('alert');
  await save.or(alert).first().waitFor({timeout:120000});
  if (await alert.count()) assert.fail(`Capture: ${await alert.first().innerText()}`);
}
async function readyRecording(page) {
  const dialog = page.getByRole('dialog');
  const alert = page.getByRole('alert');
  await dialog.or(alert).first().waitFor({timeout:120000});
  if (await alert.count()) assert.fail(`Capture: ${await alert.first().innerText()}`);
  return dialog;
}
async function saveAndReopen(page, original, duration, title) {
  await page.getByRole('button',{name:'Save this take'}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Project name').fill(title);
  await dialog.getByLabel('Private',{exact:true}).check();
  await dialog.getByRole('button',{name:'Save to dashboard'}).click();
  await page.waitForURL(/\/dashboard\?project=.+&take=.+/);
  await page.getByRole('heading',{name:`${title}.`,exact:true}).waitFor();
  await page.getByRole('link',{name:'All projects'}).click();
  await page.reload();
  await page.getByRole('link').filter({has:page.getByRole('heading',{name:title,exact:true})}).click();
  await page.getByRole('heading',{name:`${title}.`,exact:true}).waitFor();
  const reopened = await inspect(page,duration);
  assert.deepEqual(reopened,original,'Reopened readouts, excerpt and WAV bytes must survive reload');
  await page.getByRole('button',{name:'Play full take'}).click();
  await page.getByRole('button',{name:'Stop full take'}).click();
}
function summary({values,bands,bounds,duration,channels}) {
  return {...values,bands,bounds,wavSeconds:+duration.toFixed(4),channels};
}
async function uploadCase(page,file) {
  await openCapture(page); await upload(page,file); await ready(page);
  const audio = page.locator('label audio');
  await page.waitForFunction(() => Number.isFinite(document.querySelector('label audio')?.duration));
  const duration = await audio.evaluate(a => a.duration);
  const profile = await inspect(page,duration);
  return {duration,profile};
}
async function fitsViewport(page) {
  const layout = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const controls = [...document.querySelectorAll('.analysis .readouts strong,.analysis audio,.analysis a,dialog[open] input,dialog[open] button')];
    return {width,body:document.documentElement.scrollWidth,outside:controls.filter(el => {
      const r = el.getBoundingClientRect(); return r.left < -1 || r.right > width+1;
    }).map(el => el.textContent || el.tagName)};
  });
  assert.ok(layout.body <= layout.width+1 && !layout.outside.length, `Mobile overflow: ${JSON.stringify(layout)}`);
}

let server, browser, failed = 0;
try {
  const mic = join(temp,'test-microphone.wav');
  await writeFile(mic,wav(16,music));
  let baseURL = process.env.BASE_URL;
  if (!baseURL) {
    server = await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});
    await server.listen(); baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  }
  browser = await chromium.launch({
    ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {channel:'chrome'}),
    args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',`--use-file-for-fake-audio-capture=${mic}`],
  });
  console.log(`Capture E2E | Chrome ${browser.version()} | ${baseURL}`);
  async function run(name, fn, mobile=false) {
    const context = await browser.newContext({baseURL,permissions:['microphone'],acceptDownloads:true,
      viewport:mobile ? {width:360,height:740} : {width:1280,height:900}});
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(15000);
    page.on('pageerror',e => errors.push(e.message));
    try {
      const result = await fn(page);
      assert.deepEqual(errors,[],'Uncaught page errors');
      console.log(`PASS ${name}`, JSON.stringify(result ?? {}));
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack}${errors.length ? '\nPage errors: '+errors.join('; ') : ''}`);
    } finally { await context.close(); }
  }
  for (const file of songs) {
    await run(`song upload → save → reopen: ${basename(file)}`,async page => {
      const {profile,duration} = await uploadCase(page,file);
      if (basename(file) === 'the-nights-excerpt.mp3')
        near(parseFloat(profile.values.Tempo),124,2,'known song tempo');
      await saveAndReopen(page,profile,duration,`Browser test ${basename(file).slice(0,80)}`);
      return summary(profile);
    });
  }
  await run('calibrated six-second tone in silence, 360px viewport',async page => {
    const file = {name:'calibration.wav',mimeType:'audio/wav',buffer:wav(18,t =>
      t >= 4.037 && t < 10.037 ? .5*Math.sin(2*Math.PI*1000*t) : 0)};
    const {profile} = await uploadCase(page,file);
    const {values,bands,bounds,duration} = profile;
    assert.equal(values.Tempo,'Unclear'); assert.equal(values['Musical key'],'Unclear');
    near(parseFloat(values['Average level']),10*Math.log10(.25/2/3),.11,'calibrated RMS');
    near(parseFloat(values['Peak level']),-6.02,.11,'calibrated peak');
    near(parseFloat(values.Dynamics),0,.11,'steady-tone dynamics');
    assert.ok(bands.mid >= 90,'1 kHz should be predominantly midrange');
    const [start,end] = bounds.split(' – ').map(seconds);
    near(start,4.037,.051,'tone onset'); near(end,10.037,.051,'tone offset');
    near(duration,6,.003,'exact exported tone length');
    near(profile.wavRms,10*Math.log10(.25/2),.02,'export contains the actual tone without padding');
    assert.equal(profile.channels,1);
    await fitsViewport(page);
    await page.getByRole('button',{name:'Save this take'}).click();
    await page.getByRole('dialog').waitFor(); await fitsViewport(page);
    await page.getByRole('button',{name:'Review audio'}).click(); return summary(profile);
  },true);
  await run('known 120 BPM / C major progression',async page => {
    const {profile} = await uploadCase(page,mic);
    near(parseFloat(profile.values.Tempo),120,2,'known tempo');
    assert.equal(profile.values['Musical key'],'C major'); return summary(profile);
  });
  await run('fake microphone → MediaRecorder → save → reopen',async page => {
    await openCapture(page); await page.getByRole('button',{name:'Record a take'}).click();
    const stop = page.getByRole('button',{name:'Stop recording'});
    await stop.waitFor();
    await page.waitForFunction(() => Number(document.querySelector('.rec-dial.live strong')?.textContent.split(':')[1]) >= 5);
    await stop.click();
    // A finished recording opens the naming dialog; review it without saving.
    const dialog = await readyRecording(page);
    await dialog.getByRole('button',{name:'Review audio'}).click();
    await dialog.waitFor({state:'detached'});
    // MediaRecorder WebM can omit a duration in its container; the app displays the decoded duration.
    const status = await page.locator('.analysis [role=status]').innerText();
    const match = /(\d+:\d\d)/.exec(status);
    assert.ok(match,status); const duration = seconds(match[1]);
    range(duration,4,12,'recorded duration');
    const profile = await inspect(page,duration+1);
    range(profile.duration,3.5,duration+1,'recorded excerpt duration');
    await saveAndReopen(page,profile,duration+1,'Recorded browser take'); return summary(profile);
  });
  await run('malformed upload → recover with silence → no fabricated results',async page => {
    // Replacing a successful take must clear its previous measurements and blob URLs.
    await openCapture(page); await upload(page,mic); await ready(page);
    await upload(page,{name:'bad.mp3',mimeType:'audio/mpeg',buffer:Buffer.from('not an audio file')});
    const error = page.getByRole('alert');
    await error.waitFor(); assert.match(await error.innerText(),/decode|invalid|audio/i);
    assert.equal(await page.getByRole('button',{name:'Save this take'}).count(),0);
    assert.equal(await page.locator('.hook-preview a,label audio').count(),0);
    await upload(page,{name:'silence.wav',mimeType:'audio/wav',buffer:wav(3,() => 0)});
    await page.getByText('No audible passage to preview.').waitFor();
    assert.equal(await error.count(),0);
    const values = await readings(page);
    for (const key of labels) assert.equal(values[key], ['Tempo','Musical key'].includes(key) ? 'Unclear' : '—',key);
    await page.getByText('Not enough measurable spectral energy.').waitFor();
    assert.equal(await page.locator('.hook-preview audio,.hook-preview a').count(),0);
  });
} finally {
  try { await browser?.close(); } finally {
    try { await server?.close(); } finally { await rm(temp,{recursive:true,force:true}); }
  }
}
if (failed) process.exitCode = 1;
