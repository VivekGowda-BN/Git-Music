# Capture highlights

The Capture panel suggests a short excerpt of the take. It is a **signal-derived
representative passage**, not a claim about listener replay counts, chart
position, or which part is the most popular.

## What the detector does

`frontend/src/studio/signalProfile.js` analyses the decoded mono mix in 50 ms
frames:

1. Measure frame loudness and a 12-bin chroma vector from harmonic spectral
   peaks.
2. Find repeated passages by comparing frames at least 1.5 seconds apart. Runs
   of similar, active frames are candidates.
3. Reject stationary material: a candidate must have both spectral variety
   (entropy) and harmonic change (variation). A held note repeats perfectly but
   is not a musical section.
4. Rank the remaining candidates by duration, variety and energy, then trim the
   winner to its audible bounds.
5. If no repeated passage qualifies, fall back to the most energetic active
   region. The excerpt is capped at 15 seconds and trimmed to sample-accurate
   non-silent bounds.

The UI reflects the method in its wording:

- a repeated passage: “A passage that recurs, chosen for repetition and energy.”
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
be bundled. The synthetic tests above validate the repetition, trimming, energy
fallback, and 15-second cap without requiring copyrighted recordings.
