"""Mix the film's sound: the music bed (tools/score.py) plus the typing and click samples lifted from the Tabbit film,
placed on the composition's own events (tools/events.py -> assets/audio/events.json), mastered to -14 LUFS by a
lookahead limiter, with the true peak of the renderer's AAC 192k encode under -1.5 dBTP so the renderer never turns it
down. Writes assets/audio/score.wav, which index.html's <audio id="score"> plays.

Event kinds (index.html window.__events, each on the first frame its change is visible):
  key      one typed character            -> a keystroke sample (seeded choice among the 27)
  key-heavy a shortcut or a space bar press -> a shortcut sample
  enter    a submit by keyboard            -> enter_02
  click    a cursor click's press          -> click_01 or click_02, aligned on its main transient
  tick     a soft type-on tick             -> a tick sample
  hit      a transition impact (sparingly) -> hit_0N (opt-in per event with {"n": N})
Levels are relative to the bed and were set by ear-free measurement: keystroke peaks sit about 10 dB over the bed's
short-term level, as in the Tabbit mix (notes/STYLE.md, measured there at 12 to 14 dB).
  python3 tools/mix.py
"""
import json
import os
import subprocess
import wave

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LENGTH = 120.0
N = int(SR * LENGTH)
SFX = os.path.join(HERE, "assets", "audio", "sfx")

# Gains in dB applied to the samples as cut (their own peaks are about -3 dBFS for keys and clicks).
GAIN = {"key": -15.0, "key-heavy": -13.0, "enter": -13.0, "click": -11.0, "tick": 0.0, "hit": -14.0}
# Where the audible click lands inside each click sample (the press tick comes first), measured from catalog.json.
CLICK_OFFSET = {"click_01.wav": 0.08, "click_02.wav": 0.08}


def read(path):
    with wave.open(path) as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if sw == 4:
        a = np.frombuffer(raw, dtype="<f4").astype(float)
    else:
        a = np.frombuffer(raw, dtype="<i2").astype(float) / 32768
    a = a.reshape(-1, ch)
    if ch == 1:
        a = np.repeat(a, 2, axis=1)
    assert sr == SR, path
    return a


def read_float_wav(path):
    """scipy-free reader for the float32 WAVs the sample cutter wrote."""
    try:
        return read(path)
    except wave.Error:
        from scipy.io import wavfile
        sr, a = wavfile.read(path)
        a = a.astype(float)
        if a.ndim == 1:
            a = np.stack([a, a], axis=1)
        assert sr == SR
        return a


def place(buf, x, t, gain_db):
    i = int(round(t * SR))
    if i < 0:
        x, i = x[-i:], 0
    k = min(len(x), len(buf) - i)
    if k > 0:
        buf[i:i + k] += x[:k] * 10 ** (gain_db / 20)


def lufs(path):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    s = out.split("Integrated loudness:")[1]
    return float(s.split("I:")[1].split("LUFS")[0]), float(s.split("Peak:")[1].split("dBFS")[0])


def write(path, x):
    pcm = np.clip(x * 32767, -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def limit(x, ceiling_db):
    """Lookahead peak limiter: gain from 4x oversampled peaks, held over a 5 ms window either side, 80 ms release,
    smoothed by a 5 ms ramp so the gain never steps."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    from scipy.signal import resample_poly
    lim, L, B = 10 ** (ceiling_db / 20), int(0.005 * SR), 48
    pk = np.abs(resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]
    g = minimum_filter1d(np.minimum(1.0, lim / np.maximum(pk, 1e-9)), 2 * L + 1)
    nb = -(-len(g) // B)
    gb = np.pad(g, (0, nb * B - len(g)), constant_values=1.0).reshape(nb, B).min(1)
    rel, cur, a = np.empty(nb), 1.0, np.exp(-1 / 80.0)
    for i, v in enumerate(gb):
        cur = v if v < cur else 1 - (1 - cur) * a
        rel[i] = cur
    g = uniform_filter1d(np.minimum(g, np.repeat(rel, B)[:len(g)]), L + 1)
    return x * g[:, None]


def aac(wav):
    """The renderer's audio path (hyperframes 0.8.112 mixAudioTracks, then audioPadTrim's trim): wav -> wav.m4a."""
    ff = ["ffmpeg", "-y", "-loglevel", "error"]
    mixed = "[0:a]atrim=0:%g,volume=1,adelay=0|0,apad,asetpts=N/SR/TB,atrim=0:%g[a0];" % (LENGTH, LENGTH)
    mixed += "[a0]amix=inputs=1:duration=longest:dropout_transition=0[mixed];[mixed]volume=1[out]"
    subprocess.run(ff + ["-i", wav, "-filter_complex", mixed, "-map", "[out]", "-acodec", "aac", "-b:a", "192k",
                         "-t", "%g" % LENGTH, wav + ".mix.m4a"], check=True)
    subprocess.run(ff + ["-i", wav + ".mix.m4a", "-af", "atrim=duration=%f,asetpts=PTS-STARTPTS" % LENGTH,
                         "-t", "%f" % LENGTH, "-c:a", "aac", "-b:a", "192k", wav + ".m4a"], check=True)
    os.remove(wav + ".mix.m4a")


def main():
    cat = json.load(open(os.path.join(SFX, "catalog.json")))["samples"]
    by_kind = {}
    for s in cat:
        by_kind.setdefault(s["kind"], []).append(s["file"])
    cache = {f: read_float_wav(os.path.join(SFX, f)) for s in cat for f in [s["file"]]}
    bed = read(os.path.join(HERE, "assets", "audio", "bed.wav"))[:N]
    fx = np.zeros((N, 2))
    events = json.load(open(os.path.join(HERE, "assets", "audio", "events.json")))["events"]
    rng = np.random.default_rng(7)
    last_key = None
    counts = {}
    for e in events:
        kind, t = e["kind"], float(e["t"])
        counts[kind] = counts.get(kind, 0) + 1
        g = GAIN.get(kind, -14.0) + float(e.get("db", 0.0))
        if kind == "key":
            # key_05 and key_23 hold two hits each and sound like a double tap on one character.
            pool = [f for f in by_kind["key"] if f != last_key and f not in ("key_05.wav", "key_23.wav")]
            f = pool[int(rng.integers(len(pool)))]
            last_key = f
            place(fx, cache[f], t - 0.004, g + rng.uniform(-1.5, 1.0))
        elif kind == "key-heavy":
            f = by_kind["key-heavy"][int(e.get("n", rng.integers(3)))]
            place(fx, cache[f], t - 0.004, g)
        elif kind == "enter":
            place(fx, cache["enter_02.wav"], t - 0.004, g)
        elif kind == "click":
            f = "click_01.wav" if counts[kind] % 2 else "click_02.wav"
            place(fx, cache[f], t - CLICK_OFFSET[f], g)
        elif kind == "tick":
            f = by_kind["tick"][counts[kind] % len(by_kind["tick"])]
            place(fx, cache[f], t - 0.004, g)
        elif kind == "hit":
            f = "hit_%02d.wav" % int(e.get("n", 2))
            place(fx, cache[f], t - 0.05, g)
    mix = bed + fx
    # Master: loudness to -14 LUFS, true peak of the AAC encode under -1.5 dBTP.
    out = os.path.join(HERE, "assets", "audio", "score.wav")
    tmp = out + ".tmp.wav"
    x = mix / max(1e-9, np.abs(mix).max()) * 0.5
    # The renderer mixes to AAC 192k, re-encodes that once more to trim it to the video (the AAC priming packet makes it
    # 120.021 s), and turns the whole film down if the second encode's true peak is over -1 dBTP. The loop judges that
    # same second encode, made with the renderer's own ffmpeg arguments, not the WAV.
    ceiling = -3.0
    for attempt in range(6):
        y = x
        for _ in range(4):
            write(tmp, y)
            i, _ = lufs(tmp)
            y = limit(y * 10 ** ((-14 - i) / 20), ceiling)
        write(tmp, y)
        aac(tmp)
        i, tp = lufs(tmp + ".m4a")
        if tp <= -1.5:
            break
        ceiling -= min(1.0, tp + 1.5 + 0.3)
    os.remove(tmp + ".m4a")
    os.replace(tmp, out)
    print(f"wrote {out}: {i:.1f} LUFS, renderer AAC true peak {tp:.1f} dBTP; events " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))


if __name__ == "__main__":
    main()
