import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { estimateMusic } from '../studio/musicFeatures.js';

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525)+1013904223) >>> 0;
    return seed/2**32;
  };
}

function drumTrack(rate, bpm, seconds, jitter = 0) {
  const pcm = new Float32Array(rate*seconds), rng = random(9);
  for (let beat = 0; beat*60/bpm < seconds; beat++) {
    const start = Math.round(rate*(.08+beat*60/bpm+jitter*(rng()-.5)));
    for (let i = 0; i < .08*rate && start+i < pcm.length; i++) {
      const t = i/rate;
      pcm[start+i] += Math.exp(-t*65)*(.6*Math.sin(2*Math.PI*68*t)+.4*(2*rng()-1));
    }
  }
  return pcm;
}

function accentedTrack(rate, bpm, seconds, weak, offbeat) {
  // Strong beats every other beat, weaker beats between, plus off-beat noise.
  // The half-time period wins the raw autocorrelation while a comparable peak
  // remains at the true pulse.
  const pcm = new Float32Array(rate*seconds), rng = random(9);
  for (let beat = 0; beat*60/bpm < seconds; beat++) {
    const start = Math.round(rate*(.08+beat*60/bpm));
    const gain = beat%2 ? weak : 1;
    for (let i = 0; i < .08*rate && start+i < pcm.length; i++) {
      const t = i/rate;
      pcm[start+i] += gain*Math.exp(-t*65)*(.6*Math.sin(2*Math.PI*68*t)+.4*(2*rng()-1));
    }
    const off = Math.round(rate*(.08+(beat+.5)*60/bpm));
    for (let i = 0; i < .05*rate && off+i < pcm.length; i++)
      pcm[off+i] += offbeat*Math.exp(-i/rate*90)*(2*rng()-1);
  }
  return pcm;
}

function progression(rate, root, minor) {
  // I-IV-V-I or i-iv-V-i. The bass and its partials are intentionally present.
  const third = minor ? 3 : 4;
  const chords = [[0,third,7],[5,5+third,12],[7,11,14],[0,third,7]];
  return Float32Array.from({ length: rate*8 }, (_,i) => {
    const t = i/rate, chord = chords[Math.floor(t/2)], local = t%2;
    return chord.reduce((s, n) => {
      const p = 2*Math.PI*440*2**((root+n-69)/12)*local;
      return s+.12*(Math.sin(p)+.31*Math.sin(2*p)+.15*Math.sin(3*p));
    }, 0)*Math.min(1,local*40)*Math.exp(-.35*local);
  });
}

test('recovers slow, moderately jittered, and fast pulses at different PCM rates', () => {
  for (const [rate,bpm] of [[8000,63],[44100,117],[22050,182]]) {
    const result = estimateMusic(drumTrack(rate,bpm,12,.012), rate);
    assert.ok(Math.abs(result.bpm-bpm) <= 2, JSON.stringify(result));
    assert.ok(result.tempoConfidence >= .4 && result.tempoConfidence <= 1);
    assert.equal(result.key, null);
    const [chosen,half,double] = result.tempoCandidates;
    assert.equal(chosen, result.bpm);
    assert.ok(Math.abs(half-chosen/2) <= 1 && Math.abs(double-2*chosen) <= 1);
  }
});

test('reports the true pulse when a half-time reading has a comparable double-time peak', () => {
  // Accented 120 BPM: the raw autocorrelation prefers the 60 BPM period, but a
  // clear peak at twice that rate means the faster pulse is the reported one.
  const result = estimateMusic(accentedTrack(22050,120,16,.3,.12),22050);
  assert.equal(result.bpm,120,JSON.stringify(result));
  assert.ok(result.tempoConfidence >= .4,JSON.stringify(result));
  assert.deepEqual(result.tempoCandidates,[120,60,240]);
});

test('a genuine slow pulse without a double-time peak is not doubled', () => {
  const result = estimateMusic(drumTrack(8000,63,12,.012),8000);
  assert.equal(result.bpm,63,JSON.stringify(result));
});

test('the bundled The Nights excerpt gives a plausible pulse and key', {
  skip: (() => {
    try { execFileSync('ffmpeg',['-version'],{stdio:'ignore'}); return false; }
    catch { return 'ffmpeg is not installed'; }
  })(),
}, () => {
  const path = fileURLToPath(new URL('../../public/audio/the-nights-excerpt.mp3',import.meta.url));
  const pcm = execFileSync('ffmpeg',['-v','error','-i',path,'-vn','-ac','1','-ar','44100','-f','f32le','pipe:1'],
    {maxBuffer:64*1024*1024});
  const mono = new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
  const result = estimateMusic(mono,44100);
  // Published at 126 BPM; accept the exact reading or its half/double.
  assert.ok(result.bpm != null,JSON.stringify(result));
  assert.ok([0.5,1,2].some(k => Math.abs(result.bpm*k-126) <= 3),JSON.stringify(result));
  assert.ok(result.tempoConfidence >= .2,JSON.stringify(result));
  assert.ok(result.key != null,JSON.stringify(result));
});

test('finds transposed major and minor keys from harmonic progressions', () => {
  for (const [root, minor, key] of [[60,false,'C major'],[54,true,'F♯ minor'],[58,false,'B♭ major']]) {
    const result = estimateMusic(progression(22050,root,minor),22050);
    assert.equal(result.key, key);
    assert.ok(result.keyConfidence >= .4 && result.keyConfidence <= 1);
  }
});

test('a held chord supports a key without implying a tempo; an open fifth is mode-ambiguous', () => {
  const rate = 8192;
  for (const [notes,key] of [[[60,64,67],'C major'],[[60,67],null]]) {
    const pcm = Float32Array.from({length: rate*6}, (_,i) =>
      notes.reduce((s,n) => s+.2*Math.sin(2*Math.PI*440*2**((n-69)/12)*i/rate),0));
    const result = estimateMusic(pcm,rate);
    assert.equal(result.bpm,null,JSON.stringify(result));
    assert.equal(result.key,key,JSON.stringify(result));
  }
});

test('isolated and irregular transients have no stable tempo', () => {
  const rate = 8192;
  for (const times of [[2,2.5,3], [.4,1.02,2.063,2.309,3.814,4.305,8.23,8.77,10.58,11.161]]) {
    const pcm = new Float32Array(rate*12);
    for (const t of times)
      for (let i = 0; i < 300; i++) pcm[Math.round(t*rate)+i] = Math.exp(-i/80)*Math.sin(i*.12);
    const result = estimateMusic(pcm,rate);
    assert.equal(result.bpm,null,JSON.stringify(result));
  }
});

test('silence, noise, short excerpts and a single sustained note do not imply a key or pulse', () => {
  const rate = 8192, rng = random(137);
  for (const pcm of [
    new Float32Array(rate*10),
    Float32Array.from({length:rate*12}, () => .15*(2*rng()-1)),
    drumTrack(rate,100,1),
    Float32Array.from({length:rate*8}, (_,i) => {
      const p = 2*Math.PI*220*i/rate;
      return .35*Math.sin(p)+.15*Math.sin(2*p)+.09*Math.sin(3*p)+.06*Math.sin(5*p);
    }),
  ]) {
    const r = estimateMusic(pcm,rate);
    assert.equal(r.bpm,null,JSON.stringify(r));
    assert.equal(r.key,null,JSON.stringify(r));
    assert.deepEqual(r.tempoCandidates,[]);
    assert.ok(r.tempoConfidence >= 0 && r.tempoConfidence < .4);
    assert.ok(r.keyConfidence >= 0 && r.keyConfidence < .4);
  }
});

test('finds tonal and rhythmic material well beyond a 90-second silent intro', () => {
  const rate = 8000, pcm = new Float32Array(160*rate);
  const music = progression(rate,57,true);
  pcm.set(drumTrack(rate,96,56),104*rate);
  for (let i = 104*rate; i < pcm.length; i++) pcm[i] += .45*music[(i-104*rate)%music.length];
  const result = estimateMusic(pcm,rate);
  assert.equal(result.key,'A minor',JSON.stringify(result));
  assert.ok(Math.abs(result.bpm-96) <= 1,JSON.stringify(result));
});
