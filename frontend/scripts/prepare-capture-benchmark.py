"""Fetch published recordings and labels into a cache outside the checkout (stdlib only)."""
import argparse
import csv
import hashlib
import io
import json
import shutil
import statistics
import tempfile
import urllib.request
import wave
import zipfile
from pathlib import Path

GUITAR = "https://zenodo.org/api/records/3371780/files/"
RWC = "https://zenodo.org/api/records/18656623/files/"
REV = "0a1a6c31dbe73a7f5d44f7caef8cd0999402a4c2"
ROOT = Path(__file__).resolve().parents[2]


def fetch(cache, name, url, md5=None):
    dest = cache / name
    if not dest.exists():
        part = dest.with_suffix(".part")
        print(f"Downloading {name} to {cache}", flush=True)
        with urllib.request.urlopen(url, timeout=120) as src, part.open("wb") as out:
            shutil.copyfileobj(src, out, length=1024 * 1024)
        part.replace(dest)
    if md5:
        h = hashlib.md5()
        with dest.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        if h.hexdigest() != md5:
            raise ValueError(f"Checksum mismatch: remove {dest} and retry")
    return dest


def extract(archive, name, out):
    # Copy only the specifically matched WAV member (and check its ZIP CRC on read).
    with archive.open(name) as src, out.open("wb") as dst:
        shutil.copyfileobj(src, dst, length=1024 * 1024)


def guitarset(cache, out):
    audio = fetch(cache, "audio_mono-mic.zip", GUITAR + "audio_mono-mic.zip/content",
                  "275966d6610ac34999b58426beb119c3")
    labels = fetch(cache, "annotation.zip", GUITAR + "annotation.zip/content",
                   "b39b78e63d3446f2e54ddb7a54df9b10")
    tracks = []
    with zipfile.ZipFile(audio) as wavs, zipfile.ZipFile(labels) as jams:
        for name in sorted(wavs.namelist()):
            if not name.endswith("_mic.wav"):
                continue
            basename = Path(name).name
            ident = basename.removesuffix("_mic.wav")
            player, chart, playing = ident.split("_")
            data = json.loads(jams.read(ident + ".jams"))
            refs = {}
            for ann in data["annotations"]:
                if ann["namespace"] in ("tempo", "key_mode"):
                    value, = ann["data"]
                    refs[ann["namespace"]] = value["value"]
            extract(wavs, name, out / basename)
            tracks.append(dict(id=ident, file=basename, bpm=refs["tempo"], key=refs["key_mode"],
                               player=player, chart=chart, playing=playing))
    assert len(tracks) == len({t["id"] for t in tracks}) == 360
    return tracks


def rwc(cache, out, collection):
    name = f"RWC-{collection}.zip"
    md5 = {"R": "63e3b6263656a42c592ce1e90a88caa3", "P": "960a11a2d7fb603ad0dae8428f53d4f0"}
    audio = fetch(cache, name, RWC + name + "/content", md5[collection])
    labels = fetch(cache, "rwc-annotations.zip", f"https://codeload.github.com/rwc-music/rwc-annotations/zip/{REV}")
    prefix = f"rwc-annotations-{REV}/01_annotations_preprocessed/beats/RWC-{collection}/"
    tracks = []
    with zipfile.ZipFile(audio) as wavs, zipfile.ZipFile(labels) as annotations:
        for name in sorted(wavs.namelist()):
            path = Path(name)
            if path.suffix.lower() != ".wav":
                continue
            extract(wavs, name, out / path.name)
            with wave.open(str(out / path.name)) as wav:
                duration = wav.getnframes() / wav.getframerate()
            # Center window fixed by duration alone; reference and detector cover the same audio.
            start = max(0, int((duration - 30) / 2))
            beats = annotations.read(prefix + path.stem + ".csv").decode("utf-8-sig")
            times = [float(row["t"]) for row in csv.DictReader(io.StringIO(beats), delimiter=";")]
            window = [t for t in times if start <= t < start + 30]
            gaps = [b - a for a, b in zip(window, window[1:])]
            if len(gaps) < 4 or min(gaps) <= 0:
                raise ValueError(f"Insufficient ordered beats in {path.name}")
            tracks.append(dict(id=path.stem, file=path.name, bpm=60 / statistics.median(gaps),
                               key=None, start=start, seconds=30, beatIntervals=len(gaps)))
    assert len(tracks) == len({t["id"] for t in tracks}) == {"R": 15, "P": 100}[collection]
    return tracks


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", choices=["guitarset", "rwc-r", "rwc-p"])
    parser.add_argument("--cache", type=Path, default=Path(tempfile.gettempdir()) / "opencode/capture-benchmark")
    args = parser.parse_args()
    cache = args.cache.resolve()
    if cache == ROOT or ROOT in cache.parents:
        parser.error("Choose a data cache outside the checkout.")
    out = cache / args.dataset
    out.mkdir(parents=True, exist_ok=True)
    tracks = guitarset(cache, out) if args.dataset == "guitarset" else rwc(cache, out, args.dataset[-1].upper())
    manifest = out / "manifest.json"
    manifest.write_text(json.dumps({"dataset": args.dataset, "tracks": tracks}, indent=2), encoding="utf-8")
    print(f"{len(tracks)} recordings ready: {manifest}")
