import assert from 'node:assert/strict';
import test from 'node:test';
import {profileSignal} from '../studio/signalProfile.js';

const rate = 16000;
function tone(track, from, seconds, hz, amplitude, sr = rate) {
  const start = Math.round(from * sr), length = Math.round(seconds * sr);
  for (let i = 0; i < length; i++) {
    track[start + i] += amplitude * Math.sin(2 * Math.PI * hz * i / sr);
  }
}
function near(actual, expected, tolerance) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`);
}

test('silence, invalid PCM and empty input have no invented measurements or excerpt', () => {
  for (const mono of [[], new Float32Array(35000), [NaN, Infinity]]) {
    const result = profileSignal(mono, rate);
    for (const key of ['start', 'end', 'bandBalance', 'dynamicRangeDb', 'peakDbfs', 'rmsDbfs']) {
      assert.equal(result[key], null, key);
    }
    assert.match(result.highlightReason, /no measurable signal/i);
  }
  assert.equal(profileSignal([1], 0).start, null);
});

test('an isolated off-grid six-second phrase near the end is trimmed to sample accuracy', () => {
  const track = new Float32Array(98 * rate);
  const from = 90.037;
  tone(track, from, 6, 1000, .5);
  const result = profileSignal(track, rate);
  near(result.start, from, 2 / rate);
  near(result.end, from + 6, 2 / rate);
  near(result.peakDbfs, -6.0206, .001);
  near(result.rmsDbfs, 10 * Math.log10(.5 ** 2 / 2 * 6 / 98), .001);
  near(result.dynamicRangeDb, 0, .001);
});

test('peak captures a single off-grid impulse, including at the last sample', () => {
  const track = new Float32Array(15006);
  track[track.length - 1] = -.8;
  const result = profileSignal(track, rate);
  near(result.peakDbfs, 20 * Math.log10(.8), .0001);
  near(result.rmsDbfs, 10 * Math.log10(.64 / track.length), .0001);
  near(result.end - result.start, 1 / rate, 1e-12);
});

test('dynamic range tracks an active 20 dB level change regardless of padding', () => {
  const track = new Float32Array(24 * rate);
  tone(track, 5, 4, 500, .05);
  tone(track, 9, 4, 500, .5);
  const padded = profileSignal(track, rate);
  const cropped = profileSignal(track.subarray(5 * rate, 13 * rate), rate);
  near(padded.dynamicRangeDb, 20, .01);
  near(cropped.dynamicRangeDb, padded.dynamicRangeDb, .01);
  near(cropped.rmsDbfs - padded.rmsDbfs, 10 * Math.log10(3), .001);
});

test('band percentages integrate signal power across the recording', () => {
  const track = new Float32Array(36 * rate);
  tone(track, .25, 1, 55, .2);     // relative energy 1
  tone(track, 16.25, 1, 800, .4);  // relative energy 4
  tone(track, 32.25, 2, 6000, .2); // relative energy 2
  const {low, mid, high} = profileSignal(track, rate).bandBalance;
  // Real crossover bands overlap: allow two percentage points of leakage.
  near(low, 100 / 7, 2);
  near(mid, 400 / 7, 2);
  near(high, 200 / 7, 2);
  near(low + mid + high, 100, 1e-10);
});

test('each crossover splits a calibrated tone nearly equally between neighbors', () => {
  for (const [hz, a, b] of [[250, 'low', 'mid'], [2000, 'mid', 'high']]) {
    const track = new Float32Array(rate);
    tone(track, 0, 1, hz, 1);
    const bands = profileSignal(track, rate).bandBalance;
    near(bands[a], 50, .1);
    near(bands[b], 50, .1);
  }
});

test('band cutoffs respect sample rates with a low Nyquist frequency', () => {
  const track = new Float32Array(2000);
  tone(track, 0, 1, 700, .8, 2000);
  const bands = profileSignal(track, 2000).bandBalance;
  near(bands.high, 0, 1e-10);
  assert.ok(bands.mid > 99);
});

test('a recurring musical contour outranks a louder sustained section', () => {
  const track = new Float32Array(45 * rate);
  tone(track, 0, 16, 650, .8);
  for (const [start, gain] of [[18, .15], [35, .2]]) {
    const notes = [220, 660, 330, 523, 294, 440, 262, 392];
    notes.forEach((hz, i) => tone(track, start + i, 1, hz, gain * (i % 2 ? 1 : .6)));
  }
  const result = profileSignal(track, rate);
  assert.ok([18, 35].some(t => Math.abs(t - result.start) < .01));
  near(result.end - result.start, 8, .01);
  assert.match(result.highlightReason, /recurs/i);
});

test('a long active passage yields a full usable excerpt within the 15-second limit', () => {
  const sr = 44100, track = new Float32Array(19 * sr);
  tone(track, .2, 18, 100, .4, sr);
  const {start, end} = profileSignal(track, sr);
  assert.ok(start >= .2 && end <= 18.2);
  assert.ok(end - start <= 15 && end - start > 14.8);
});
