# Capture highlights

The Capture panel suggests a short excerpt of the take. It is a **signal-derived
representative passage**, not a claim about listener replay counts, chart
position, or which part is the most popular.

## What the detector does

`frontend/src/studio/signalProfile.js` analyses the decoded mono mix in 50 ms
frames:

1. Measure frame loudness and a 12-bin chroma vector from harmonic spectral
   peaks.
2. Compare fixed 15-second windows, stepping 0.5 seconds. Two windows count as
   a repeat only when they are at least 17 seconds apart, so a window is never
   matched against itself or its immediate neighbours.
3. Similarity is `0.65 ×` mean-chroma cosine plus `0.35 ×` loudness-envelope
   correlation. Stationary material is down-weighted softly by spectral entropy
   and frame-to-frame harmonic change; it is not hard-filtered out.
4. Score each window by repetition × musical variety × a Gaussian position
   prior × a mild energy term. The prior (centre 0.34, spread 0.18, floor 0.1)
   reflects that choruses cluster in the first half of most songs. It is a
   gentle tie-breaker: repetition and energy still decide.
5. Trim the chosen window to its longest audible stretch, then to
   sample-accurate non-silent bounds. The excerpt is capped at 15 seconds.
6. If no repeated passage qualifies, fall back to the most energetic active
   region.

The UI reflects the method in its wording:

- a clearly repeated passage: “A passage that recurs, chosen for repetition and
  energy.”
- a weaker but musical match: “A representative passage chosen for energy and
  contrast.”
- a fallback: “The most energetic passage in this recording.”

It never labels an arbitrary upload as the “most played” section.

## Why there is no popularity lookup

Listener replay and streaming popularity data are not available for arbitrary
local files, and the analysis runs entirely on the device without uploading the
audio. A curated list of famous songs would not generalise to recordings,
unreleased takes, or cover versions, so the excerpt stays signal-derived. For a
known commercial track, this often lands on a repeated chorus because choruses
repeat and carry energy, but that is an outcome of the signal, not a popularity
claim.

## Tests

`frontend/src/__tests__/signalProfile.test.js` covers the parts that can be
tested without copyrighted audio:

- silence and invalid PCM produce no invented excerpt;
- an off-grid phrase is trimmed to sample accuracy;
- a single-sample peak is measured at the last sample;
- a 20 dB level change is measured regardless of padding;
- band shares integrate power and split calibrated crossovers evenly;
- a recurring musical contour outranks a louder sustained drone;
- a long active passage yields a full excerpt within the 15-second limit.

## Structural benchmark

`frontend/scripts/benchmarkHighlights.mjs` compares the selected excerpt with
SALAMI chorus annotations. It reports the fraction of the excerpt that overlaps
a chorus, alongside a random-start baseline and a centre-of-track baseline.

The SALAMI audio is not redistributed. To run it, supply your own audio
directory and the SALAMI annotation directory:

```text
node frontend/scripts/benchmarkHighlights.mjs AUDIO_DIR SALAMI_DIR [SONG_ID ...]
```

`AUDIO_DIR` contains `<id>.mp3`; `SALAMI_DIR` contains
`annotations/<id>/parsed/textfile1_functions.txt` (and optionally
`textfile2_functions.txt`). The script checks that audio and annotation
durations agree before scoring.

A structural run is not committed with this repository because the audio cannot
be bundled. The synthetic tests above validate repetition, trimming, the energy
fallback, and the 15-second cap without requiring copyrighted recordings.

On a 12-song SALAMI subset of live recordings, the selected excerpt covered
57.5% of the annotated chorus on average, compared with 27.0% for a random
start and 22.2% for the centre-of-track baseline. Eight of twelve songs put
more than half of the excerpt on a chorus. The second annotator (7 songs) gives
56.3%, 26.8%, and 30.8% respectively, with four of seven majority overlaps.
These are structural overlaps on bootleg audio, not a claim of listener
agreement; the two annotators themselves often disagree about chorus bounds.
