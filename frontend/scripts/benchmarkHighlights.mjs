// Offline evaluation; see docs/capture-highlights.md for the pinned data and files.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {profileSignal} from '../src/studio/signalProfile.js';

const [audioDir, salamiDir, ...subset] = process.argv.slice(2);
if (!salamiDir) throw Error('Usage: node benchmarkHighlights.mjs AUDIO_DIR SALAMI_DIR [SONG_ID ...]');
const ids = subset.length ? subset : [956,968,970,974,982,984,988,992,994,996,998,1004];
const rate = 44100;

function labels(path, duration) {
  const rows = readFileSync(path,'utf8').trim().split(/\r?\n/).map(line => {
    const [sec, label] = line.trim().split(/\t+/);
    return {sec:Number(sec), label};
  });
  // SALAMI sometimes repeats the End timestamp with a trailing Silence row.
  if (!rows.some(r=>r.label.toLowerCase()==='end' && r.sec===rows.at(-1).sec)
    || Math.abs(rows.at(-1).sec - duration) > 1)
    throw Error(`Audio/annotation duration mismatch: ${duration} vs ${rows.at(-1).sec} in ${path}`);
  return rows.slice(0,-1).map(({sec,label},i) => [sec, Math.min(rows[i+1].sec, duration), label]);
}

function score(sections, start, end, duration) {
  const chorus = sections.filter(([, ,label]) => label.toLowerCase() === 'chorus');
  const width = end - start;
  const share = t => chorus.reduce((s,[a,b]) =>
    s + Math.max(0, Math.min(t+width,b) - Math.max(t,a)), 0) / width;
  // Uniform random start over [0, duration-width]. Overlap varies linearly
  // between these boundary crossings, so trapezoids give an exact mean.
  const limit = duration - width;
  const cuts = [0, ...chorus.flatMap(([a,b]) => [a-width,a,b-width,b])
    .filter(x => x > 0 && x < limit), limit].sort((a,b) => a-b);
  let area = 0;
  for (let i=1;i<cuts.length;i++) {
    const a = cuts[i-1], b = cuts[i];
    area += (b-a)*(share(a)+share(b))/2;
  }
  const mid = (start + end)/2;
  return {overlap:share(start), random:limit ? area/limit : share(0),
    centerWindow:share(limit/2), midpointLabel:sections.find(([a,b]) => a<=mid && mid<b)?.[2],
    chorus:chorus.map(([a,b]) => [a,b])};
}

const results = [];
for (const id of ids) {
  const path = join(audioDir, `${id}.mp3`);
  const pcm = execFileSync('ffmpeg',['-v','error','-i',path,'-vn','-ac','1',
    '-ar',String(rate),'-f','f32le','pipe:1'], {maxBuffer:256*1024*1024});
  const mono = new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
  const duration = mono.length/rate;
  const {start,end} = profileSignal(mono,rate);
  if (!(Number.isFinite(start) && start >= 0 && end > start && end <= duration))
    throw Error(`No valid excerpt for ${id}: ${start}..${end}`);
  const row = {id,md5:createHash('md5').update(readFileSync(path)).digest('hex'),duration,start,end};
  for (const n of [1,2]) {
    const ann = join(salamiDir,'annotations',String(id),'parsed',`textfile${n}_functions.txt`);
    if (n === 1 || existsSync(ann)) row[`annotator${n}`] = score(labels(ann,duration),start,end,duration);
  }
  results.push(row);
}
function summarize(key) {
  const rows = results.map(r => r[key]).filter(Boolean);
  if (!rows.length) return null;
  const mean = k => rows.reduce((s,r) => s+r[k],0)/rows.length;
  return {n:rows.length, meanOverlap:mean('overlap'), meanRandom:mean('random'),
    meanCentered:mean('centerWindow'), any:rows.filter(r=>r.overlap>0).length,
    majority:rows.filter(r=>r.overlap>=.5).length};
}
console.log(JSON.stringify({results,annotator1:summarize('annotator1'),annotator2:summarize('annotator2')},null,2));
