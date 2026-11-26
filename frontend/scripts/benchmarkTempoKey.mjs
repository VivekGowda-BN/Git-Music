// Offline tempo/key evaluation over annotated recordings outside the repo.
// Usage: node frontend/scripts/benchmarkTempoKey.mjs AUDIO_DIR [LIMIT]
// AUDIO_DIR must contain manifest.json produced by prepare-capture-benchmark.py.
// The audio and labels stay in the local cache; nothing is uploaded.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {estimateMusic} from '../src/studio/musicFeatures.js';

const [dir, limitArg] = process.argv.slice(2);
if (!dir) throw Error('Usage: node benchmarkTempoKey.mjs AUDIO_DIR [LIMIT]');
const limit = Number(limitArg || 0);
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const tracks = limit ? manifest.tracks.slice(0, limit) : manifest.tracks;
const rate = 44100;
const pitch = {C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11};

function parseKey(text) {
  if (!text) return null;
  const [rawNote, mode] = String(text).split(':');
  const note = rawNote.replaceAll('♭', 'b').replaceAll('♯', '#');
  return pitch[note] === undefined ? null : {pc: pitch[note], mode};
}
function keyName(value) {
  const match = /^(.+) (major|minor)$/.exec(value || '');
  if (!match) return null;
  const note = match[1].replaceAll('♭', 'b').replaceAll('♯', '#');
  return pitch[note] === undefined ? null : {pc: pitch[note], mode: match[2]};
}
const rows = [];
for (const [index, track] of tracks.entries()) {
  const args = ['-v', 'error', '-i', join(dir, track.file), '-vn', '-ac', '1', '-ar', String(rate)];
  if (track.start != null) args.push('-ss', String(track.start), '-t', String(track.seconds || 30));
  args.push('-f', 'f32le', 'pipe:1');
  const pcm = execFileSync('ffmpeg', args, {maxBuffer: 128 * 1024 * 1024});
  const mono = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  const result = estimateMusic(mono, rate);
  const refKey = parseKey(track.key);
  const gotKey = keyName(result.key);
  const exact = result.bpm != null && Math.abs(result.bpm - track.bpm) <= 2;
  const octave = result.bpm != null && [0.5, 1, 2].some(k => Math.abs(result.bpm * k - track.bpm) <= 2);
  rows.push({
    id: track.id, refBpm: track.bpm, bpm: result.bpm, tempoConfidence: result.tempoConfidence,
    exact, octave, refKey: track.key, key: result.key, keyConfidence: result.keyConfidence,
    keyOk: refKey ? !!gotKey && gotKey.pc === refKey.pc && gotKey.mode === refKey.mode : null,
  });
  if ((index + 1) % 25 === 0) console.error(`${index + 1}/${tracks.length}`);
}

const answered = rows.filter(r => r.bpm != null);
const keyRows = rows.filter(r => r.keyOk !== null);
const keyAnswered = keyRows.filter(r => r.key != null);
const share = (items, predicate) => items.length ? items.filter(predicate).length / items.length : null;
const summary = {
  n: rows.length,
  tempoAnswered: answered.length / rows.length,
  tempoExact: share(rows, r => r.exact),
  tempoOctave: share(rows, r => r.octave),
  tempoExactAmongAnswered: share(answered, r => r.exact),
  tempoOctaveAmongAnswered: share(answered, r => r.octave),
  meanTempoConfidence: rows.reduce((s, r) => s + r.tempoConfidence, 0) / rows.length,
  keyAnswered: keyRows.length ? keyAnswered.length / keyRows.length : null,
  keyExact: keyRows.length ? share(keyRows, r => r.keyOk) : null,
  keyExactAmongAnswered: keyAnswered.length ? share(keyAnswered, r => r.keyOk) : null,
  meanKeyConfidence: rows.reduce((s, r) => s + r.keyConfidence, 0) / rows.length,
};
const misses = rows.filter(r => !r.exact).map(r => ({id: r.id, ref: r.refBpm, got: r.bpm, conf: +r.tempoConfidence.toFixed(2)}));
const keyMisses = keyRows.filter(r => !r.keyOk).map(r => ({id: r.id, ref: r.refKey, got: r.key, conf: +r.keyConfidence.toFixed(2)}));
console.log(JSON.stringify({summary, misses, keyMisses}, null, 2));
