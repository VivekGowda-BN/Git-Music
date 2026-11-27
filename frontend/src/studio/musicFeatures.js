// Onset-envelope autocorrelation: https://www.ee.columbia.edu/~dpwe/pubs/Ellis07-beattrack.pdf
// Spectral-peak chroma / profile matching: https://essentia.upf.edu/tutorial_tonal_hpcpkeyscale.html
// Temperley key profiles. Confidence measures evidence, not probability.
const clamp = v => Math.max(0, Math.min(1, v));
const noteNames = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const profiles = [
  [5, 2, 3.5, 2, 4.5, 4, 2, 4.5, 2, 3.5, 1.5, 4],
  [5, 2, 3.5, 4.5, 2, 4, 2, 4.5, 3.5, 2, 1.5, 4],
];

// Each lag is measured inside a contiguous window. Splicing distant sections
// together would introduce artificial transients and false beat intervals.
function onsetCorrelations(samples, rate, start, length, hop, maxLag) {
  const count = Math.floor(length / hop);
  const bands = new Float64Array(count * 3);
  const lowCoeff = 1 - Math.exp(-2 * Math.PI * 180 / rate);
  const midCoeff = 1 - Math.exp(-2 * Math.PI * 1800 / rate);
  let low = 0, mid = 0, peak = 0;
  for (let i = 0, pos = start; i < count; i++) {
    let a = 0, b = 0, c = 0;
    for (let j = 0; j < hop; j++) {
      const x = samples[pos++];
      low += lowCoeff * (x - low);
      mid += midCoeff * (x - mid);
      a += low * low;
      b += (mid - low) ** 2;
      c += (x - mid) ** 2;
    }
    bands[3*i] = Math.sqrt(a/hop);
    bands[3*i+1] = Math.sqrt(b/hop);
    bands[3*i+2] = Math.sqrt(c/hop);
    peak = Math.max(peak, bands[3*i], bands[3*i+1], bands[3*i+2]);
  }
  if (!(peak > 1e-5)) return null;

  const env = new Float64Array(count);
  const floor = peak * .035;
  for (let b = 0; b < 3; b++) {
    let previous = 0, older = 0;
    for (let i = 2; i < count-2; i++) {
      const k = 3*i+b;
      // Smooth before differencing: carrier phase and beating between chord
      // tones can otherwise produce spurious periodic "onsets" in held notes.
      const rms = (bands[k-6]+2*bands[k-3]+3*bands[k]+2*bands[k+3]+bands[k+6])/9;
      const level = Math.log(floor+rms);
      if (i >= 4) env[i] += Math.max(0, level-older-.06);
      older = previous;
      previous = level;
    }
  }
  // Local contrast removes stationary energy and a little smoothing tolerates
  // human timing variation and beats that fall between analysis hops.
  const prefix = new Float64Array(count+1);
  for (let i = 0; i < count; i++) prefix[i+1] = prefix[i] + env[i];
  let energy = 0, sum = 0;
  for (let i = 0; i < count; i++) {
    const lo = Math.max(0, i-12), hi = Math.min(count, i+13);
    const smoothed = (prefix[Math.min(count,i+3)] - prefix[Math.max(0,i-2)]) / 5;
    env[i] = Math.max(0, smoothed - (prefix[hi]-prefix[lo])/(hi-lo));
    sum += env[i];
    energy += env[i] ** 2;
  }
  // Reject negligible modulation and one-off attacks. Effective support is
  // useful even if a transient is much louder than the rest of the window.
  if (energy < .00004*count || sum*sum/energy < 12) return null;
  const threshold = Math.sqrt(energy/count);
  let attacks = 0, last = -8;
  for (let i = 1; i < count-1; i++) {
    if (i-last >= 8 && env[i] > threshold && env[i] >= env[i-1] && env[i] > env[i+1]) {
      attacks++;
      last = i;
    }
  }
  if (attacks < 4) return null;
  const ac = new Float64Array(maxLag+1);
  const meanPower = (sum/count) ** 2;
  const variance = energy/count - meanPower;
  for (let lag = 1; lag <= maxLag; lag++) {
    let dot = 0;
    for (let i = lag; i < count; i++) dot += env[i]*env[i-lag];
    ac[lag] = (dot/(count-lag) - meanPower)/variance;
  }
  return ac;
}

function tempo(samples, rate) {
  const empty = { bpm: null, tempoConfidence: 0, tempoCandidates: [] };
  if (samples.length < 4*rate) return empty;
  const hop = Math.max(1, Math.round(rate/100)), minute = 60*rate/hop;
  const size = Math.min(samples.length, Math.round(12*rate));
  const windows = Math.min(7, Math.ceil(samples.length/size));
  const maxLag = Math.min(Math.ceil(minute/40)*2+2, Math.floor(size/hop/2));
  const ac = new Float64Array(maxLag+1);
  let active = 0;
  for (let i = 0; i < windows; i++) {
    const start = Math.round((samples.length-size)*i/Math.max(1, windows-1));
    const local = onsetCorrelations(samples, rate, start, size, hop, maxLag);
    if (!local) continue;
    active++;
    for (let l = 1; l <= maxLag; l++) ac[l] += local[l];
  }
  if (!active) return empty;
  for (let l = 1; l <= maxLag; l++) ac[l] /= active;
  const candidates = [];
  for (let l = Math.floor(minute/240); l <= Math.ceil(minute/40); l++) {
    if (ac[l] < ac[l-1] || ac[l] <= ac[l+1] || ac[l] <= 0) continue;
    const offset = .5*(ac[l-1]-ac[l+1])/(ac[l-1]-2*ac[l]+ac[l+1]);
    const bpm = minute/(l+offset);
    const twice = Math.round(2*(l+offset));
    const repeat = twice < maxLag ? Math.max(ac[twice-1], ac[twice], ac[twice+1], 0) : ac[l];
    // Broad tactus preference; break subharmonic ties in favour of the first
    // strong peak rather than mistaking every other identical beat for a beat.
    const score = (.80*ac[l]+.20*repeat) *
      (1-.055*Math.abs(Math.log2(bpm/115))) + .055*Math.log2(bpm/60);
    candidates.push({ bpm, score, strength: ac[l], lag: l });
  }
  candidates.sort((a,b) => b.score-a.score);
  let best = candidates[0];
  if (!best) return empty;
  // A very slow reading is often the half-time view of a 90–150 BPM pulse.
  // Only double it when a comparable peak exists at twice the period; genuine
  // slow pulses without that peak keep their own tempo.
  if (best.bpm >= 45 && best.bpm <= 75) {
    const double = candidates
      .filter(c => Math.abs(Math.log2(c.bpm/best.bpm/2)) < .04 && c.strength >= best.strength*.5)
      .sort((a,b) => b.score-a.score)[0];
    if (double) best = double;
  }
  // Unrelated strong periods are evidence against a single global tempo.
  const rival = candidates.find(c => {
    const ratio = Math.max(best.bpm/c.bpm, c.bpm/best.bpm);
    return Math.abs(ratio-Math.round(ratio)) > .07;
  });
  const clarity = rival ? clamp((best.score-rival.score)/.23) : 1;
  // A smooth short-lag trend raises the whole autocorrelation curve, so the
  // absolute height of a peak says little. What matters is how far it stands
  // above the neighbouring troughs: a clear beat produces a sharp peak even in
  // a quiet mix, while noise produces only a shallow ripple.
  const reach = Math.max(2, Math.round(best.lag*.2));
  let valley = best.strength;
  for (let l = Math.max(2, best.lag-reach); l <= Math.min(maxLag, best.lag+reach); l++) {
    valley = Math.min(valley, ac[l]);
  }
  const prominence = Math.max(0, best.strength-valley);
  const confidence = clamp(prominence/.35) * (.5+.5*clarity);
  // Noise has many comparable peaks, so no single period dominates. A clear
  // pulse stands well clear of its strongest unrelated rival.
  if (clarity < .25 || confidence < .20) return { ...empty, tempoConfidence: confidence };
  const bpm = Math.round(best.bpm);
  return {
    bpm, tempoConfidence: confidence,
    tempoCandidates: [bpm, Math.round(best.bpm/2), Math.round(best.bpm*2)],
  };
}

// Reuse the FFT plan, Hann window and buffers across all sampled frames.
function spectrumReader(n, stride) {
  const rev = new Uint16Array(n), hann = new Float64Array(n);
  const re = new Float64Array(n), im = new Float64Array(n);
  const cos = new Float64Array(n/2), sin = new Float64Array(n/2);
  const mag = new Float64Array(n/2);
  for (let i = 0; i < n; i++) {
    rev[i] = (rev[i >> 1] >> 1) | ((i & 1) * n/2);
    hann[i] = .5-.5*Math.cos(2*Math.PI*i/(n-1));
    if (i < n/2) {
      cos[i] = Math.cos(-2*Math.PI*i/n);
      sin[i] = Math.sin(-2*Math.PI*i/n);
    }
  }
  return (samples, start) => {
    for (let i = 0, pos = start; i < n; i++) {
      let x = 0;
      for (let j = 0; j < stride; j++) x += samples[pos++];
      re[rev[i]] = x*hann[i]/stride;
      im[rev[i]] = 0;
    }
    for (let width = 2; width <= n; width *= 2) {
      const half = width/2, step = n/width;
      for (let i = 0; i < n; i += width) {
        for (let k = 0; k < half; k++) {
          const a = i+k, b = a+half, t = k*step;
          const x = re[b]*cos[t]-im[b]*sin[t], y = im[b]*cos[t]+re[b]*sin[t];
          re[b] = re[a]-x; im[b] = im[a]-y;
          re[a] += x; im[a] += y;
        }
      }
    }
    for (let i = 0; i < mag.length; i++) mag[i] = Math.hypot(re[i], im[i]);
    return mag;
  };
}

function tonality(samples, rate) {
  const empty = { key: null, keyConfidence: 0 };
  const n = 2048, stride = Math.max(1, Math.round(rate/8192)), length = n*stride;
  const frames = Math.min(120, Math.floor(samples.length/length));
  if (frames < 3) return empty;
  const hz = rate/length, lo = Math.max(2, Math.round(55/hz));
  const hi = Math.min(n/2-2, Math.ceil(2500/hz));
  const spectrum = spectrumReader(n, stride);
  const histogram = () => ({chroma:new Float64Array(12), bass:new Float64Array(12), voiced:0});
  const global = histogram();
  const sectionCount = Math.min(8, Math.floor(frames/6), Math.floor(samples.length/(6*rate)));
  const sections = Array.from({length:sectionCount}, histogram);
  for (let i = 0; i < frames; i++) {
    const mag = spectrum(samples, Math.round(i*(samples.length-length)/(frames-1)));
    let peak = 0, bandPower = 0;
    for (let b = lo; b <= hi; b++) {
      peak = Math.max(peak, mag[b]);
      bandPower += mag[b] ** 2;
    }
    if (!(peak > n*1e-6)) continue;
    const bins = new Float64Array(12), peaks = [];
    let tonalPower = 0, total = 0, bassNote = -1;
    for (let b = lo; b <= hi; b++) {
      const v = mag[b];
      if (v < peak*.07 || v <= mag[b-1] || v < mag[b+1]) continue;
      // A Hann-windowed sinusoid has a narrow main lobe. Require prominence
      // above its neighbourhood to exclude broadband percussion and noise.
      const side = Math.max(mag[Math.max(0,b-3)], mag[Math.min(n/2-1,b+3)]);
      if (v < 3*side) continue;
      const a = Math.log(mag[b-1]+1e-15), c = Math.log(mag[b+1]+1e-15);
      const freq = hz*(b+.5*(a-c)/(a+c-2*Math.log(v)));
      const midi = 69+12*Math.log2(freq/440), note = Math.round(midi);
      if (bassNote < 0 && freq < 330 && v >= .20*peak) bassNote = (note%12+12)%12;
      let weight = v;
      // Discount upper partials of strong lower fundamentals. Without this a
      // single harmonically rich note can masquerade as a complete major chord.
      for (const p of peaks) {
        const ratio = freq/p.freq, h = Math.round(ratio);
        if (h >= 2 && h <= 12 && Math.abs(12*Math.log2(ratio/h)) < .20)
          weight = Math.min(weight, Math.max(0, v-1.8*p.v/h));
      }
      peaks.push({freq, v});
      weight *= 1-.6*Math.abs(midi-note);
      bins[(note%12+12)%12] += weight;
      total += weight;
      tonalPower += v*v+mag[b-1]**2+mag[b+1]**2;
    }
    if (!total || tonalPower < .35*bandPower) continue;
    const scale = Math.sqrt(peak)/total;
    const section = sections[Math.floor(i*sectionCount/frames)];
    for (const target of section ? [global,section] : [global]) {
      target.voiced++;
      for (let pc = 0; pc < 12; pc++) target.chroma[pc] += bins[pc]*scale;
      if (bassNote >= 0) target.bass[bassNote] += Math.sqrt(peak);
    }
  }
  const ranking = keyFits(global);
  const best = ranking[0];
  if (best?.confidence >= .40) return {key:best.key, keyConfidence:best.confidence};

  // A loud intro, solo, or contrasting bridge can make two full-track fits
  // almost tie. Look for an independently supported key across sections.
  const votes = new Map();
  let votingSections = 0;
  for (const section of sections) {
    const [local] = keyFits(section);
    if (!local || local.confidence < .40) continue;
    votingSections++;
    votes.set(local.key, (votes.get(local.key) || 0) + 1);
  }
  for (const candidate of ranking.slice(0,3)) {
    const count = votes.get(candidate.key) || 0;
    if (count >= 2 && count > votingSections/2 && candidate.evidence >= .4)
      return {key:candidate.key, keyConfidence:candidate.evidence*count/sections.length};
  }
  if (!best) {
    for (const [key,count] of votes) {
      if (count >= 3 && count >= sections.length/2 && count >= 2*votingSections/3)
        return {key, keyConfidence:count/sections.length};
    }
    return empty;
  }
  // Strong tonal material can support a key even when the runner-up is
  // close. Retain the measured confidence so the UI can mark it as estimated.
  if (best.evidence >= .45 || (best.confidence >= .15 && votes.has(best.key)))
    return {key:best.key, keyConfidence:best.confidence};
  return {...empty, keyConfidence:best.confidence};
}

function keyFits({chroma,bass,voiced}) {
  if (voiced < 3) return [];
  const total = chroma.reduce((s,x) => s+x, 0);
  for (let i = 0; i < 12; i++) chroma[i] /= total;
  if ([...chroma].sort((a,b) => b-a)[2] < .065) return [];
  const norm = Math.sqrt(chroma.reduce((s,x) => s+(x-1/12)**2, 0));
  if (norm < .08) return [];
  const bassWeight = bass.reduce((sum, value) => sum + value, 0);
  const fits = [];
  for (const [mode, profile] of profiles.entries()) {
    const mean = profile.reduce((s,x) => s+x)/12;
    const profileNorm = Math.sqrt(profile.reduce((s,x) => s+(x-mean)**2, 0));
    for (let root = 0; root < 12; root++) {
      let fit = 0;
      for (let pc = 0; pc < 12; pc++)
        fit += (profile[pc]-mean)*(chroma[(root+pc)%12]-1/12);
      // Give the tonic and dominant heard in the bass a vote when melodic
      // evidence alone points almost equally to two relative keys.
      const bassFit = bassWeight ? (bass[root]+.5*bass[(root+7)%12])/bassWeight : 0;
      fit /= norm*profileNorm;
      const support = Math.min(chroma[root], chroma[(root+(mode ? 3 : 4))%12]);
      const evidence = Math.min(clamp((fit-.35)/.50), clamp(support/.08), clamp(norm/.18));
      fits.push({key:`${noteNames[root]} ${mode ? 'minor' : 'major'}`, evidence, score: fit + .45*bassFit});
    }
  }
  fits.sort((a,b) => b.score-a.score);
  const best = fits[0], gap = best.score-fits[1].score;
  best.confidence = best.evidence * clamp(gap/.065);
  return fits;
}

/**
 * Estimate a global pulse and major/minor key from decoded mono PCM.
 * Independent heuristic confidences in [0,1]; null means insufficient
 * evidence. tempoCandidates lists the chosen pulse then half/double-time
 * interpretations (not independent detections). Analysis cost is bounded by
 * seven 12-second rhythm windows and 120 tonal frames across the whole take.
 * @param {Float32Array} mono
 * @param {number} sampleRate Hz
 * @returns {{bpm: number|null, key: string|null, tempoConfidence: number, keyConfidence: number, tempoCandidates: number[]}}
 */
export function estimateMusic(mono, sampleRate) {
  if (!mono?.length || !Number.isFinite(sampleRate) || sampleRate < 1000)
    return { bpm: null, key: null, tempoConfidence: 0, keyConfidence: 0, tempoCandidates: [] };
  return { ...tempo(mono, sampleRate), ...tonality(mono, sampleRate) };
}
