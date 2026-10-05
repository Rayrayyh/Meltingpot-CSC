"""Shared tools for the film's scores (tools/music/<name>.py), used through compose.py with MUSIC=<name>.

Parts written as notes are played by FluidSynth from the FluidR3 GM soundfont (MIT licence, /usr/share/sounds/sf2),
one part per pass, dry; everything else (drums, sub, swells) is synthesised here. Seeded: every run is the same.
Times are in seconds on the film's clock (96 BPM, a bar is 2.5 s).
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
LENGTH = 120.0
N = int(SR * LENGTH)
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def m(name):
    """'Eb4' -> 63."""
    pc, octave = (name[:2], name[2:]) if len(name) > 2 and name[1] in "b#" else (name[:1], name[1:])
    return NOTE[pc] + 12 * (int(octave) + 1)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# ------------------------------------------------------------------ filters and helpers
def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], "band", fs=SR, output="sos"), x)


def shelf_lp(x, f, amount):
    """Darken: blend in a low-passed copy (amount 0..1)."""
    return x * (1 - amount) + lp(x, f) * amount


def place(buf, x, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i < 0:
        x, i = x[-i:], 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * gain


def silence():
    return np.zeros(N)


def stereo():
    return [np.zeros(N), np.zeros(N)]


def pan(x, p):
    """Equal-power pan, p in -1..1."""
    a = (p + 1) * np.pi / 4
    return [x * np.cos(a), x * np.sin(a)]


def env_follow(x, attack=0.005, release=0.12, block=64):
    """Peak follower, one step per block (for speed), so the coefficients are per block too."""
    a, r = np.exp(-block / (SR * attack)), np.exp(-block / (SR * release))
    y = np.zeros_like(x)
    v = 0.0
    ax = np.abs(x)
    for i in range(0, len(x), block):
        blk = ax[i:i + block].max()
        v = a * v + (1 - a) * blk if blk > v else r * v + (1 - r) * blk
        y[i:i + block] = v
    return y


def compress(x, thresh_db=-18, ratio=3.0, attack=0.01, release=0.15, makeup_db=0.0, key=None):
    e = env_follow(x if key is None else key, attack, release) + 1e-9
    lvl = 20 * np.log10(e)
    over = np.maximum(0, lvl - thresh_db)
    g = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * g


def reverb_ir(seconds=2.6, seed=1, predelay=0.018, damp=0.6, bright=7000):
    """A stereo room: decorrelated noise tails, darker as they decay."""
    r = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n) / SR
    out = []
    for side in range(2):
        noise = r.standard_normal(n)
        early = lp(noise, bright) * np.exp(-t * 6.9 / seconds)
        late = lp(noise, bright * (1 - damp) + 600) * np.exp(-t * 6.9 / (seconds * 1.15))
        tail = early * np.exp(-t * 3) + late * (1 - np.exp(-t * 3))
        tail = np.concatenate([np.zeros(int(SR * (predelay + 0.004 * side))), tail])[:n]
        out.append(tail / np.sqrt(np.sum(tail ** 2)))
    return out


def reverb(st, ir, wet=0.25, hp_f=180):
    """Convolve a stereo pair with a stereo IR (true stereo, crossed), return dry + wet."""
    l, r = st
    src = hp((l + r) / 2, hp_f)
    wl = fftconvolve(src, ir[0])[: len(l)]
    wr = fftconvolve(src, ir[1])[: len(r)]
    return [l + wet * wl, r + wet * wr]


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


# ------------------------------------------------------------------ notes played by FluidSynth
class Part:
    """Notes for one General MIDI program, on the film's clock."""

    def __init__(self, program, seed=0, human_t=0.006, human_v=6, bank=0, drums=False):
        self.program, self.bank, self.drums = program, bank, drums
        self.notes, self.ccs = [], []
        self.rng = np.random.default_rng(seed)
        self.ht, self.hv = human_t, human_v

    def note(self, t, dur, midi, vel=80, exact=False):
        if not exact:
            t = max(0.0, t + self.rng.uniform(-self.ht, self.ht))
            vel = int(np.clip(vel + self.rng.integers(-self.hv, self.hv + 1), 1, 127))
        self.notes.append((t, dur, int(midi), int(vel)))
        return self

    def chord(self, t, dur, mids, vel=80, roll=0.0, exact=False):
        for i, x in enumerate(mids):
            self.note(t + i * roll, dur - i * roll, x, vel, exact)
        return self

    def cc(self, t, num, val):
        self.ccs.append((t, num, int(val)))
        return self

    def _smf(self, path):
        ppq = 480
        tick = lambda s: int(round(s / BEAT * ppq))
        ch = 9 if self.drums else 0
        # FluidSynth 2.3.4 releases every voice on a key at that key's note-off, so a note that ends after the same key
        # is struck again would silence the new strike. Strikes of one key under 15 ms apart become one strike (the
        # longer hold, the louder velocity), and every note ends no later than the next strike of its key.
        by_key = {}
        for t, d, x, v in sorted(self.notes):
            lst = by_key.setdefault(x, [])
            if lst and t - lst[-1][0] < 0.015:
                lst[-1][1] = max(lst[-1][1], t + d)
                lst[-1][2] = max(lst[-1][2], v)
            else:
                lst.append([t, t + d, v])
        ev = []
        for x, lst in by_key.items():
            for i, (t, e, v) in enumerate(lst):
                off = tick(e)
                if i + 1 < len(lst):
                    off = min(off, tick(lst[i + 1][0]))  # (tick, 0) sorts before (tick, 1): the off goes first
                ev.append((tick(t), 1, bytes([0x90 | ch, x, v])))
                ev.append((max(off, tick(t) + 1), 0, bytes([0x80 | ch, x, 0])))
        for t, num, val in self.ccs:
            ev.append((tick(t), 0, bytes([0xB0 | ch, num, val])))
        ev.sort(key=lambda e: (e[0], e[1]))

        def vlq(n):
            b = [n & 0x7F]
            n >>= 7
            while n:
                b.insert(0, (n & 0x7F) | 0x80)
                n >>= 7
            return bytes(b)

        trk = bytearray()
        trk += vlq(0) + b"\xff\x51\x03" + int(BEAT * 1e6).to_bytes(3, "big")
        if not self.drums:
            trk += vlq(0) + bytes([0xB0 | ch, 0, self.bank]) + vlq(0) + bytes([0xC0 | ch, self.program])
        trk += vlq(0) + bytes([0xB0 | ch, 7, 110]) + vlq(0) + bytes([0xB0 | ch, 91, 0]) + vlq(0) + bytes([0xB0 | ch, 93, 0])
        last = 0
        for tk, _, data in ev:
            trk += vlq(tk - last) + data
            last = tk
        trk += vlq(ppq * 8) + b"\xff\x2f\x00"
        with open(path, "wb") as f:
            f.write(b"MThd" + (6).to_bytes(4, "big") + (0).to_bytes(2, "big") + (1).to_bytes(2, "big") + ppq.to_bytes(2, "big"))
            f.write(b"MTrk" + len(trk).to_bytes(4, "big") + bytes(trk))

    def render(self, gain=0.5):
        """Dry stereo from FluidSynth, trimmed or padded to the film's length."""
        if not self.notes:
            return stereo()
        with tempfile.TemporaryDirectory() as d:
            mid, wav = os.path.join(d, "p.mid"), os.path.join(d, "p.wav")
            self._smf(mid)
            subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", str(gain), "-r", str(SR), "-O", "s16",
                            "-T", "wav", "-F", wav, SF2, mid], check=True, capture_output=True)
            with wave.open(wav) as w:
                assert w.getframerate() == SR and w.getnchannels() == 2
                a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768
        a = a.reshape(-1, 2)
        out = stereo()
        k = min(N, len(a))
        out[0][:k], out[1][:k] = a[:k, 0], a[:k, 1]
        return out


# ------------------------------------------------------------------ synthesised percussion and textures
class Kit:
    def __init__(self, seed=11):
        self.rng = np.random.default_rng(seed)

    def noise(self, n):
        return self.rng.standard_normal(n)

    def kick(self, tone=50, punch=120, decay=7.0, click=0.25):
        n = int(SR * 0.45)
        t = np.arange(n) / SR
        body = np.sin(2 * np.pi * np.cumsum(tone + punch * np.exp(-t * 35)) / SR) * np.exp(-t * decay)
        c = hp(self.noise(n), 2000) * np.exp(-t * 400) * click
        return np.tanh(1.4 * (body + c))

    def soft_kick(self):
        return lp(self.kick(tone=48, punch=70, decay=9, click=0.05), 900)

    def snare(self, bright=5000, body=190, tail=16):
        n = int(SR * 0.35)
        t = np.arange(n) / SR
        nz = bp(self.noise(n), 1200, bright) * np.exp(-t * tail)
        tone = np.sin(2 * np.pi * body * t) * np.exp(-t * 30) * 0.5
        return nz + tone

    def brush(self):
        n = int(SR * 0.3)
        t = np.arange(n) / SR
        return bp(self.noise(n), 2000, 9000) * (t / 0.02).clip(0, 1) * np.exp(-t * 14) * 0.7

    def clap(self):
        n = int(SR * 0.3)
        t = np.arange(n) / SR
        nz = bp(self.noise(n), 900, 7000)
        bursts = sum(np.exp(-np.clip(t - d, 0, None) * 120) * (t >= d) for d in (0.0, 0.011, 0.023))
        return nz * (0.7 * bursts + 0.4 * np.exp(-t * 16))

    def snap(self):
        n = int(SR * 0.12)
        t = np.arange(n) / SR
        return bp(self.noise(n), 1800, 9000) * np.exp(-t * 70) + 0.4 * np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 90)

    def hat(self, open_=False, level=1.0):
        n = int(SR * (0.3 if open_ else 0.06))
        t = np.arange(n) / SR
        return hp(self.noise(n), 7500) * np.exp(-t * (11 if open_ else 80)) * level

    def shaker(self, level=1.0):
        n = int(SR * 0.09)
        t = np.arange(n) / SR
        e = np.minimum(1, t / 0.018) * np.exp(-t * 38)
        return bp(self.noise(n), 4500, 12000) * e * level

    def tick(self, f=2800, level=1.0):
        """A clock or woodblock tick."""
        n = int(SR * 0.05)
        t = np.arange(n) / SR
        return (np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + 0.4 * bp(self.noise(n), f, f * 2.2) * np.exp(-t * 300)) * level

    def boom(self, f=42, dur=2.2, level=1.0):
        """A soft low impact (no noise crash)."""
        n = int(SR * dur)
        t = np.arange(n) / SR
        x = np.sin(2 * np.pi * np.cumsum(f + 45 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.6)
        return np.tanh(1.3 * x) * np.minimum(1, t / 0.004) * level

    def swell(self, dur, bright=9000, level=1.0):
        """A reversed cymbal: rises into the next downbeat."""
        n = int(SR * (dur + 0.3))
        t = np.arange(n) / SR
        c = hp(self.noise(n), 3000) * np.exp(-t * 2.2)
        c = lp(c, bright)
        return c[::-1][-int(SR * dur):] * level

    def cymbal(self, dur=2.5, level=1.0):
        n = int(SR * dur)
        t = np.arange(n) / SR
        return hp(self.noise(n), 4000) * np.exp(-t * 2.0) * np.minimum(1, t / 0.003) * level


def sub(t0, dur, midi, level=1.0, attack=0.01, release=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(midi) * t) + 0.12 * np.sin(4 * np.pi * hz(midi) * t)
    e = np.minimum(1, t / attack) * np.clip((dur - t) / release, 0, 1)
    out = np.zeros(N)
    place(out, x * e * level, t0)
    return out


def sidechain(trigger_times, depth=0.5, release=0.22):
    """A gain curve that dips on each trigger (kick) and recovers."""
    g = np.ones(N)
    n = int(SR * release * 2.5)
    t = np.arange(n) / SR
    dip = depth * np.exp(-t / release)
    for t0 in trigger_times:
        i = int(t0 * SR)
        j = min(N, i + n)
        g[i:j] = np.minimum(g[i:j], 1 - dip[: j - i])
    return g


def fade(x, t0, t1, to=0.0):
    """Linear gain ramp from 1 at t0 to `to` at t1, then held."""
    g = np.ones(N)
    i, j = int(t0 * SR), int(t1 * SR)
    g[i:j] = np.linspace(1, to, j - i)
    g[j:] = to
    return x * g


def glue(stems, thresh_db=-24, ratio=2.5, attack=0.03, release=0.4):
    """Bus compression: one gain curve from the whole score's level, applied to every stem."""
    mix = sum((v["L"] + v["R"]) / 2 * v["gain"] for v in stems.values())
    e = env_follow(mix, attack, release) + 1e-9
    over = np.maximum(0, 20 * np.log10(e) - thresh_db)
    g = 10 ** (-over * (1 - 1 / ratio) / 20)
    for v in stems.values():
        v["L"], v["R"] = v["L"] * g, v["R"] * g
    return stems


def stem(st, gain=1.0, send=0.0):
    return {"L": st[0], "R": st[1], "gain": gain, "send": send}
