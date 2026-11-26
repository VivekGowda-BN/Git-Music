// Signal-derived mix profile and a representative excerpt.
//
// The excerpt is chosen from repetition, contrast and energy in the recording.
// It is not a claim about listener replay data or commercial popularity: no
// such data is available for an arbitrary local file.

const LOW_HZ = 250;
const HIGH_HZ = 2000;
const CROSSOVER_HZ = 100;
const MAX_HIGHLIGHT = 15;
const MIN_REPEAT = 3;
const MIN_LAG = 1.5;
const CHROMA_LOW_HZ = 150;
const CHROMA_HIGH_HZ = 4000;
const SIMILARITY = 0.82;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const db = v => 20 * Math.log10(v);

function empty(reason) {
  return {
    start: null,
    end: null,
    bandBalance: null,
    dynamicRangeDb: null,
    peakDbfs: null,
    rmsDbfs: null,
    highlightReason: reason,
  };
}

function hann(length) {
  const window = new Float64Array(length);
  if (length < 2) {
    if (length) window[0] = 1;
    return window;
  }
  for (let i = 0; i < length; i++) {
    window[i] = .5 - .5 * Math.cos(2 * Math.PI * i / (length - 1));
  }
  return window;
}

function createFft(n) {
  const rev = new Uint32Array(n);
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const power = new Float64Array(n / 2);
  for (let i = 0; i < n; i++) rev[i] = (rev[i >> 1] >> 1) | ((i & 1) * (n / 2));
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos(-2 * Math.PI * i / n);
    sin[i] = Math.sin(-2 * Math.PI * i / n);
  }
  return {n, rev, cos, sin, re, im, power};
}

function spectrum(plan, samples, start, length, window) {
  const {n, rev, cos, sin, re, im, power} = plan;
  for (let i = 0; i < n; i++) {
    let x = 0;
    if (i < length) {
      x = samples[start + i];
      if (!Number.isFinite(x)) x = 0;
      x *= window[i];
    }
    re[rev[i]] = x;
    im[rev[i]] = 0;
  }
  for (let width = 2; width <= n; width *= 2) {
    const half = width / 2, step = n / width;
    for (let i = 0; i < n; i += width) {
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half, t = k * step;
        const x = re[b] * cos[t] - im[b] * sin[t];
        const y = im[b] * cos[t] + re[b] * sin[t];
        re[b] = re[a] - x;
        im[b] = im[a] - y;
        re[a] += x;
        im[a] += y;
      }
    }
  }
  for (let k = 0; k < n / 2; k++) power[k] = re[k] * re[k] + im[k] * im[k];
  return power;
}

// Linear power crossovers put exactly half of a calibrated tone in each
// neighbouring band at 250 Hz and 2 kHz. The narrow transition keeps the
// bands honest for the rest of the spectrum and respects a low Nyquist limit.
function bandBalanceOf(samples, n, rate) {
  const fftSize = 2048;
  const frameLength = Math.min(n, fftSize);
  const window = hann(frameLength);
  const plan = createFft(fftSize);
  const maxFrames = 512;
  const hop = Math.max(1, Math.round(Math.max(frameLength / 2, Math.ceil(Math.max(1, n - frameLength) / maxFrames))));
  const frames = Math.max(1, Math.floor((n - frameLength) / hop) + 1);
  let low = 0, mid = 0, high = 0;
  for (let f = 0; f < frames; f++) {
    const start = Math.min(n - frameLength, f * hop);
    const power = spectrum(plan, samples, start, frameLength, window);
    for (let k = 1; k < fftSize / 2; k++) {
      const hz = k * rate / fftSize;
      const lowWeight = clamp(.5 - (hz - LOW_HZ) / (2 * CROSSOVER_HZ), 0, 1);
      const highWeight = hz >= rate / 2 ? 0 : clamp(.5 + (hz - HIGH_HZ) / (2 * CROSSOVER_HZ), 0, 1);
      const midWeight = 1 - lowWeight - highWeight;
      const p = power[k];
      low += p * lowWeight;
      mid += p * midWeight;
      high += p * highWeight;
    }
  }
  const total = low + mid + high;
  if (!(total > 0)) return null;
  return {low: 100 * low / total, mid: 100 * mid / total, high: 100 * high / total};
}

function frameAnalysis(samples, n, rate) {
  const targetFrames = 4000;
  let hop = Math.max(1, Math.round(rate * .05));
  hop = Math.max(hop, Math.ceil(n / targetFrames));
  const count = Math.floor((n - 1) / hop) + 1;
  const rms = new Float32Array(count);
  const chroma = new Float32Array(count * 12);
  const fftSize = 2048;
  const frameLength = Math.min(n, fftSize);
  const window = hann(frameLength);
  const plan = createFft(fftSize);
  let peakRms = 0;
  for (let f = 0; f < count; f++) {
    const start = f * hop;
    const end = Math.min(n, start + hop);
    let sum = 0;
    for (let i = start; i < end; i++) {
      let x = samples[i];
      if (!Number.isFinite(x)) x = 0;
      sum += x * x;
    }
    const level = Math.sqrt(sum / Math.max(1, end - start));
    rms[f] = level;
    if (level > peakRms) peakRms = level;

    const center = start + (end - start) / 2;
    const winStart = Math.max(0, Math.min(n - frameLength, Math.round(center - frameLength / 2)));
    const power = spectrum(plan, samples, winStart, frameLength, window);
    const base = f * 12;
    let total = 0;
    for (let k = 1; k < fftSize / 2; k++) {
      const hz = k * rate / fftSize;
      if (hz < CHROMA_LOW_HZ || hz > CHROMA_HIGH_HZ) continue;
      const midi = 69 + 12 * Math.log2(hz / 440);
      const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
      const p = power[k];
      chroma[base + pitchClass] += p;
      total += p;
    }
    if (total > 0) {
      for (let pc = 0; pc < 12; pc++) chroma[base + pc] /= total;
    }
  }
  return {hop, count, rms, chroma, peakRms};
}

function dynamicRangeOf(rms, peakRms) {
  const threshold = Math.max(peakRms * .01, 1e-6);
  const active = [];
  for (const level of rms) if (level >= threshold) active.push(level);
  if (!active.length) return null;
  active.sort((a, b) => a - b);
  const percentile = p => {
    const pos = (active.length - 1) * p;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return active[lo] + (active[hi] - active[lo]) * (pos - lo);
  };
  const quiet = percentile(.05), loud = percentile(.95);
  if (!(quiet > 0)) return null;
  return db(loud / quiet);
}

function similarity(chroma, a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let pc = 0; pc < 12; pc++) {
    const x = chroma[a + pc], y = chroma[b + pc];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
}

function highlightOf(frames, rate) {
  const {hop, count, rms, chroma, peakRms} = frames;
  const frameRate = rate / hop;
  const threshold = Math.max(peakRms * .01, 1e-6);
  const active = new Uint8Array(count);
  for (let i = 0; i < count; i++) active[i] = rms[i] >= threshold ? 1 : 0;
  const minLag = Math.max(1, Math.round(MIN_LAG * frameRate));
  const minFrames = Math.max(1, Math.round(MIN_REPEAT * frameRate));
  const maxFrames = Math.max(1, Math.floor(MAX_HIGHLIGHT * frameRate));

  // For each lag, keep the two longest matching diagonals. Keeping two avoids
  // a loud sustained drone masking a shorter repeated musical phrase at the
  // same lag. Runs are rejected later if they are too stationary to be music.
  const candidates = [];
  for (let lag = minLag; lag < count; lag++) {
    let runStart = -1, runLen = 0, best1 = null, best2 = null;
    const consider = () => {
      if (runLen < minFrames) return;
      const candidate = {start: runStart, end: runStart + runLen - 1, len: runLen};
      if (!best1 || candidate.len > best1.len) {
        best2 = best1;
        best1 = candidate;
      } else if (!best2 || candidate.len > best2.len) {
        best2 = candidate;
      }
    };
    for (let i = 0; i + lag < count; i++) {
      const j = i + lag;
      const match = active[i] && active[j] && similarity(chroma, i * 12, j * 12) >= SIMILARITY;
      if (match) {
        if (runStart < 0) runStart = i;
        runLen++;
      } else {
        consider();
        runStart = -1;
        runLen = 0;
      }
    }
    consider();
    if (best1) candidates.push(best1);
    if (best2) candidates.push(best2);
  }

  let best = null;
  for (const candidate of candidates) {
    const start = candidate.start;
    const end = Math.min(candidate.end, start + maxFrames - 1);
    const len = end - start + 1;
    if (len < minFrames) continue;
    const mean = new Float64Array(12);
    let energy = 0;
    for (let f = start; f <= end; f++) {
      const base = f * 12;
      for (let pc = 0; pc < 12; pc++) mean[pc] += chroma[base + pc];
      energy += rms[f] * rms[f];
    }
    let sum = 0;
    for (let pc = 0; pc < 12; pc++) sum += mean[pc];
    if (!(sum > 0)) continue;
    let entropy = 0;
    for (let pc = 0; pc < 12; pc++) {
      const p = mean[pc] / sum;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    let variation = 0;
    for (let f = start + 1; f <= end; f++) {
      variation += 1 - similarity(chroma, (f - 1) * 12, f * 12);
    }
    variation /= Math.max(1, len - 1);
    const level = Math.sqrt(energy / len) / Math.max(1e-9, peakRms);
    // A sustained note repeats perfectly but has no melodic or harmonic
    // contour. Requiring both spectral variety and change rejects it.
    if (entropy < .7 || variation < .004) continue;
    const duration = len / frameRate;
    const score = duration * (.25 + entropy) * (.25 + variation) * (.5 + .5 * level);
    if (!best || score > best.score) best = {score, start, end};
  }

  if (best) {
    return {
      startFrame: best.start,
      endFrame: best.end,
      reason: 'A passage that recurs, chosen for repetition and energy.',
    };
  }

  // Fallback: the most energetic active region, trimmed to 15 seconds.
  const regions = [];
  let regionStart = -1;
  for (let i = 0; i <= count; i++) {
    const on = i < count && active[i];
    if (on && regionStart < 0) regionStart = i;
    if (!on && regionStart >= 0) {
      regions.push([regionStart, i - 1]);
      regionStart = -1;
    }
  }
  if (!regions.length) return null;
  const prefix = new Float64Array(count + 1);
  for (let i = 0; i < count; i++) prefix[i + 1] = prefix[i] + rms[i] * rms[i];
  let bestRegion = null;
  for (const [start, end] of regions) {
    const duration = (end - start + 1) / frameRate;
    const energy = prefix[end + 1] - prefix[start];
    const score = energy * Math.sqrt(Math.min(duration, MAX_HIGHLIGHT));
    if (!bestRegion || score > bestRegion.score) bestRegion = {score, start, end, duration};
  }
  if (!bestRegion) return null;
  let startFrame = bestRegion.start, endFrame = bestRegion.end;
  if (bestRegion.duration > MAX_HIGHLIGHT) {
    let bestStart = startFrame, bestEnergy = -1;
    for (let s = startFrame; s + maxFrames - 1 <= endFrame; s++) {
      const energy = prefix[s + maxFrames] - prefix[s];
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestStart = s;
      }
    }
    startFrame = bestStart;
    endFrame = bestStart + maxFrames - 1;
  }
  return {
    startFrame,
    endFrame,
    reason: 'The most energetic passage in this recording.',
  };
}

function trim(samples, n, rate, startFrame, endFrame, hop) {
  let first = Math.max(0, Math.floor(startFrame * hop));
  let last = Math.min(n - 1, Math.ceil((endFrame + 1) * hop) - 1);
  if (last < first) return null;
  let peak = 0;
  for (let i = first; i <= last; i++) {
    const x = samples[i];
    const a = Number.isFinite(x) ? Math.abs(x) : 0;
    if (a > peak) peak = a;
  }
  const threshold = Math.max(peak * .01, 1e-6);
  while (first <= last) {
    const x = samples[first];
    if (Number.isFinite(x) && Math.abs(x) >= threshold) break;
    first++;
  }
  while (last >= first) {
    const x = samples[last];
    if (Number.isFinite(x) && Math.abs(x) >= threshold) break;
    last--;
  }
  if (last < first) return null;
  const limit = Math.round(MAX_HIGHLIGHT * rate);
  if (last - first + 1 > limit) last = first + limit - 1;
  return {start: first / rate, end: (last + 1) / rate};
}

/**
 * Describe dynamics, spectral balance and a representative excerpt.
 *
 * @param {Float32Array|number[]} mono decoded mono PCM
 * @param {number} sampleRate Hz
 * @returns {{start: number|null, end: number|null, bandBalance: {low:number,mid:number,high:number}|null, dynamicRangeDb: number|null, peakDbfs: number|null, rmsDbfs: number|null, highlightReason: string}}
 */
export function profileSignal(mono, sampleRate) {
  const n = mono?.length || 0;
  if (!n || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return empty('No measurable signal in this recording.');
  }
  let peak = 0, sumSquares = 0;
  for (let i = 0; i < n; i++) {
    let x = mono[i];
    if (!Number.isFinite(x)) x = 0;
    const a = x < 0 ? -x : x;
    if (a > peak) peak = a;
    sumSquares += x * x;
  }
  if (!(peak > 1e-6)) return empty('No measurable signal in this recording.');

  const bandBalance = bandBalanceOf(mono, n, sampleRate);
  const frames = frameAnalysis(mono, n, sampleRate);
  const dynamicRangeDb = dynamicRangeOf(frames.rms, frames.peakRms);
  const chosen = highlightOf(frames, sampleRate);
  let start = null, end = null, highlightReason = 'No measurable signal in this recording.';
  if (chosen) {
    const excerpt = trim(mono, n, sampleRate, chosen.startFrame, chosen.endFrame, frames.hop);
    if (excerpt) {
      start = excerpt.start;
      end = excerpt.end;
      highlightReason = chosen.reason;
    }
  }
  return {
    start,
    end,
    bandBalance,
    dynamicRangeDb,
    peakDbfs: db(peak),
    rmsDbfs: db(Math.sqrt(sumSquares / n)),
    highlightReason,
  };
}
