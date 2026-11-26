# Capture analysis

Capture decodes the take in the browser and runs the analysis in
`frontend/src/studio/analysis.worker.js`. Audio is not uploaded, and no model
or analysis API is called. The worker returns the readings shown in the panel:

| Reading | What it measures |
| --- | --- |
| Tempo | Global pulse in BPM; half/double alternatives remain in the data |
| Musical key | Best-fitting major or minor key |
| Frequency span | Central 90% of spectral power |
| Dynamics | Quiet-to-loud spread of active frames |
| Average level | RMS across the take in dBFS |
| Peak level | Highest sample in the analysis mix |
| Frequency balance | Low (<250 Hz), mid, and high (>2 kHz) energy shares |
| Suggested highlight | Up to 15 seconds of repeated or energetic material |

Embedded file tags (`TBPM`, `TKEY`, artist, title) are displayed separately as
reference. They are never fed into the estimators, so the readings remain
independent measurements of the audio.

## Tempo

The estimator builds a three-band onset envelope, then autocorrelates it over
up to seven 12-second windows spread across the take. A broad tactus preference
and a repeat-peak term rank the candidate periods. Very slow readings (45–75
BPM) are doubled only when a comparable peak exists at twice the period; this
avoids reporting half-time on a 120 BPM track while leaving genuine slow pulses
alone.

Confidence measures how sharply the chosen period rises above the troughs
around it, and how far it stands clear of unrelated rival periods. A smooth
short-lag trend raises the whole autocorrelation curve, so the absolute height
of a peak says little; a clear beat still produces a sharp peak in a quiet mix,
while noise produces only shallow ripples. Below 0.20, or when no period
dominates its rivals, the panel says **Unclear** rather than inventing a tempo.

## Key

The estimator samples up to 120 spectral frames, keeps prominent harmonic
peaks, discounts upper partials of strong lower notes, and accumulates a chroma
profile. It correlates that profile against the Krumhansl–Kessler major and
minor profiles in all 12 transpositions. Confidence requires a good fit, a gap
over the runner-up, support for the tonic and third, and enough tonal material;
otherwise the key is **Unclear**.

## Benchmark data and method

Two annotated datasets are used. Both are downloaded to a cache outside the
checkout; audio and labels are never committed.

| Dataset | Content | Reference |
| --- | --- | --- |
| RWC-R | 15 produced recordings, 30-second centre excerpts | Tempo from the median annotated beat interval |
| GuitarSet | 360 solo-guitar recordings, full takes | Tempo and key from JAMS annotations |

Preparation (requires Python and `ffmpeg`):

```text
python frontend/scripts/prepare-capture-benchmark.py rwc-r
python frontend/scripts/prepare-capture-benchmark.py guitarset
```

The default cache is `%TEMP%/opencode/capture-benchmark` on Windows or the
platform temporary directory elsewhere. Run the evaluation with:

```text
node frontend/scripts/benchmarkTempoKey.mjs CACHE/rwc-r
node frontend/scripts/benchmarkTempoKey.mjs CACHE/guitarset
```

`tempoExact` allows ±2 BPM. `tempoOctave` also accepts the half or double of the
reported tempo, which is the usual convention for metrical ambiguity.

## Results

### RWC-R — 15 produced recordings

| Measure | Result |
| --- | --- |
| Answered | 14/15 (93.3%) |
| Exact tempo | 11/15 (73.3%) |
| Octave-tolerant tempo | 14/15 (93.3%) |
| Exact among answered | 11/14 (78.6%) |
| Octave-tolerant among answered | 14/14 (100%) |

The single octave-tolerant miss is an abstention (RWC_R013); every track the
detector answered was correct at the exact or octave level. Exact-only misses
include metrical-level disagreements such as 75 vs 149 BPM, 200 vs 100 BPM, and
182 vs 90 BPM. No key labels are available for this collection.

### GuitarSet — solo guitar stress set

GuitarSet is expressive, often monophonic solo guitar with no drum kit. It is a
harder case than produced songs and is reported separately rather than folded
into the headline result.

| Measure | Result |
| --- | --- |
| Tempo answered | 262/360 (72.8%) |
| Exact tempo | 122/360 (33.9%) |
| Octave-tolerant tempo | 194/360 (53.9%) |
| Exact among answered | 122/262 (46.6%) |
| Octave-tolerant among answered | 194/262 (74.0%) |
| Key answered | 208/360 (57.8%) |
| Exact key | 128/360 (35.6%) |
| Exact key among answered | 128/208 (61.5%) |

These are the full 360 recordings, covering comping and solo versions. They show
the honest limit of the current estimators on solo material: the detector still
abstains on more than a quarter of takes, and when it answers, octave-tolerant
tempo agreement is 74.0% and exact key agreement is 61.5%. No claim of 85–95%
accuracy is made for this set; it is a stress test, not the produced-song
target.

### Known song check

The bundled Avicii “The Nights” excerpt is published as 126 BPM and F♯ major.
The local analysis reports:

- **124 BPM**, confidence 0.96, with 62 / 249 BPM alternatives in the data
- **F♯ major**, confidence 1.00
- highlight **00:17.0 – 00:32.0** (15 seconds), a recurring passage

The 2 BPM difference is within the benchmark tolerance. The excerpt is chosen
from repetition, energy and position, not from a popularity lookup.

## Limitations

- Tempo is metrically ambiguous. A half-time or double-time reading can be
  musically valid; the data still carries the alternatives, but the panel shows
  one reading rather than listing them.
- Solo, rubato, and heavily syncopated material lowers confidence and coverage.
- Key detection is less reliable on monophonic or modal material.
- The highlight is signal-derived. There is no listener replay or popularity
  data for arbitrary uploads; see [capture-highlights.md](capture-highlights.md).
- Analysis cost is bounded by seven rhythm windows and 120 tonal frames, so a
  long upload is analysed from sampled windows rather than every sample.
