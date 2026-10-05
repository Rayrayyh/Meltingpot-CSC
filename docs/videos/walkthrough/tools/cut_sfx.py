"""Cut the typing and click samples out of the Tabbit launch film (owner's decision, notes/DECISIONS.md section 1).

The owner supplied two cuts of the Tabbit film with the same music, sample aligned: one with sound effects and one
without. Subtracting the second from the first leaves the effects alone (residual music -38 to -50 dB, measured).
This script finds the onsets in that difference and writes each sample, plus catalog.json, to assets/audio/sfx/.
The samples are Tabbit's audio and are not committed (*.wav is git-ignored); run this to rebuild them.

  python3 tools/cut_sfx.py <tabbit-with-effects.mp4> <tabbit-music-only.mp4>
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "assets", "audio", "sfx")
SR = 48000


def decode(path, wav):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR), "-c:a", "pcm_f32le", wav], check=True)
    return wavfile.read(wav)[1].astype(np.float64)


def main(with_fx, music_only):
    with tempfile.TemporaryDirectory() as d:
        a = decode(with_fx, os.path.join(d, "a.wav"))
        b = decode(music_only, os.path.join(d, "b.wav"))
    n = min(len(a), len(b))
    diff = a[:n] - b[:n]
    m = diff.mean(1)
    hop = int(SR * 0.005)
    env = np.array([np.sqrt((m[i:i + hop] ** 2).mean()) for i in range(0, len(m) - hop, hop)])
    db = 20 * np.log10(env + 1e-9)
    onsets, last = [], -1
    for i in range(3, len(db)):  # a rise of 12 dB in 15 ms above -48 dB, at least 40 ms after the last
        if db[i] > -48 and db[i] - db[i - 3] > 12 and (i - last) * 0.005 > 0.04:
            onsets.append(i * 0.005)
            last = i

    def tail_end(i0, i1max, floor_db=-55):
        e = np.abs(diff[i0:i1max]).max(1)
        thr = e.max() * 10 ** (floor_db / 20)
        k = int(SR * 0.003)
        es = np.convolve(e, np.ones(k) / k, "same")
        idx = np.where(es > thr)[0]
        return i0 + (idx[-1] if len(idx) else len(e))

    def cut(t0, t1, name, kind, src_t):
        i0 = int(t0 * SR)
        i1 = tail_end(i0, int(t1 * SR))
        seg = diff[i0:i1].copy()
        fo = min(int(0.008 * SR), len(seg) // 3)
        seg[-fo:] *= np.cos(np.linspace(0, np.pi / 2, fo))[:, None]
        fi = int(0.0005 * SR)
        seg[:fi] *= np.linspace(0, 1, fi)[:, None]
        wavfile.write(os.path.join(OUT, name + ".wav"), SR, seg.astype(np.float32))
        return {"file": name + ".wav", "kind": kind, "source_t": round(float(src_t), 3), "dur_ms": round(len(seg) / SR * 1000),
                "peak_dbfs": round(float(20 * np.log10(np.abs(seg).max())), 1)}

    def group(lo, hi):
        return [t for t in onsets if lo <= t <= hi]

    def nxt(t):
        later = [x for x in onsets if x > t]
        return later[0] if later else t + 0.5

    os.makedirs(OUT, exist_ok=True)
    cat = []
    # The windows below were found by looking at the film (typing at 10.3 and 20.5 s, shortcut keys at 5.35 s, clicks on
    # buttons at 14.3 and 24.35 s, submits at 12.06 and 22.3 s, ticks at 2.6 to 3.9 s, hits at 0.26, 17.7, 33.37, 35.29 s).
    for k, t in enumerate(group(10.29, 11.98) + group(20.54, 21.80)):
        cat.append(cut(t - 0.004, min(nxt(t) - 0.004, t + 0.16), "key_%02d" % (k + 1), "key", t))
    for k, t in enumerate(group(5.34, 5.56)):
        cat.append(cut(t - 0.004, min(nxt(t) - 0.004, t + 0.2), "shortcut_%02d" % (k + 1), "key-heavy", t))
    for k, (s, e) in enumerate(((14.28, 14.95), (24.33, 25.0))):
        cat.append(cut(s, e, "click_%02d" % (k + 1), "click", s))
    cat.append(cut(12.056, 12.40, "enter_01", "enter", 12.06))
    cat.append(cut(22.296, 22.70, "enter_02", "enter", 22.30))
    for k, t in enumerate(group(2.6, 3.95)):
        cat.append(cut(t - 0.004, min(nxt(t) - 0.004, t + 0.1), "tick_%02d" % (k + 1), "tick", t))
    for k, (s, e) in enumerate(((0.26, 1.6), (17.70, 19.2), (33.37, 34.9), (35.29, 36.9))):
        cat.append(cut(s, e, "hit_%02d" % (k + 1), "hit", s))
    json.dump({"source": "Tabbit launch film with effects minus the same film without them: same music, so the difference is the "
                         "sound effects alone", "sr": SR, "samples": cat}, open(os.path.join(OUT, "catalog.json"), "w"), indent=1)
    print(len(cat), "samples ->", OUT)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
