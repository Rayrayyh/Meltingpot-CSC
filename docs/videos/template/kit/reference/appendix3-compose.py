"""The launch video's score and sound effects, composed in code (bold, innovative and emotional). Worked example: Tabbit.

C minor, 96 BPM, one bar (2.5 s) per scene, 15 bars, harmony i-VI-III-VII (Cm Ab Eb Bb).
- Bars 1-2: a heartbeat under a dark bed; a filtered arp that opens; a riser lands the panel.
- Bar 3: an impact and the drums, a sidechain-pumped supersaw bed, a driving bass and the hook (bars 3-7).
- Bar 8: the breakdown under the headline: drums out, a choir chord, the heartbeat back.
- Bar 9: the drop (a riser, an impact and a low brass "braam"); four on the floor through the trip (bars 9-12).
- Bar 13: the rotating line: each verb is a hit, a snare roll and a riser, then half a second of silence.
- 32.95 s: the mark: impact, braam, choir and bells together; the hook once more to the fade.
Interface sounds sit on the composition's own event times. Seeded, so every run writes the same file.
Usage (from this folder): python3 tools/compose.py  ->  assets/audio/score.wav (+ score.m4a via ffmpeg).
"""
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = BEAT * 4  # 2.5 s
LENGTH = 37.5
N = int(SR * LENGTH)
MARK = 32.95  # the mark lands (index.html: lockup 32.95, mark 33.0)
# What the composition types, and when (index.html typeInto: letter k shows at t0 + (k - 0.5) * (t1 - t0) / len).
TYPING = [(10.35, 11.95, "ditch the youtube tabs and stick the github ones in a work group"), (20.55, 21.85, "save Trip and reopen it Saturday at 9 AM")]
ENTERS = [11.97, 22.32]  # just before the typed card fades (S5: Tabbit thinks, then its preview rises)
CLICKS = [10.25, 14.3, 24.35]  # index.html click(t): the cursor dips over 0.08 s, then springs back
rng = np.random.default_rng(20261001)
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "assets", "audio")
T = np.arange(N) / SR


TRANSPOSE = 0  # semitones from C minor (e.g. -3 for A minor, +2 for D minor); every pitched part moves with it


def hz(m):
    return 440.0 * 2 ** ((m + TRANSPOSE - 69) / 12)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 500)], "band", fs=SR, output="sos"), x)


def place(buf, x, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    a = max(0, -i)
    j = min(len(buf), i + len(x))
    buf[max(i, 0):j] += x[a: j - i] * gain


def adsr(n, a, d, s, r_start, r):
    """Attack, decay, sustain level, release start and release length (seconds)."""
    t = np.arange(n) / SR
    hold = max(a + d, r_start)
    return np.interp(t, [0, a, a + d, hold, hold + r], [0, 1, s, s, 0])


def saw(f, n, cents=0.0):
    """A saw made at twice the rate and brought down (less aliasing), random start phase."""
    ff = f * 2 ** (cents / 1200)
    x = 2 * ((rng.uniform(0, 1) + ff * np.arange(n * 2) / (SR * 2)) % 1.0) - 1
    return resample_poly(x, 1, 2)[:n]


def supersaw(f, n, voices=5, spread=18):
    out = np.zeros(n)
    for v in range(voices):
        c = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
        out += saw(f, n, c)
    return out / voices


def opening_lp(x, f0, f1, curve):
    """A filter that opens: two filtered copies crossfaded by `curve` (0..1), no steps."""
    return lp(x, f0) * (1 - curve) + lp(x, f1) * curve


# ---------------------------------------------------------------- the arrangement (one entry per bar)
CH = {
    "Cm": [48, 60, 63, 67, 72], "Ab": [44, 60, 63, 68, 72], "Eb": [51, 58, 63, 67, 70], "Bb": [46, 58, 62, 65, 70],
    "Fm9": [41, 56, 60, 63, 67], "Absus": [44, 61, 63, 68, 70], "Cm9": [48, 62, 63, 67, 70],
}
BARS = ["Cm", "Cm", "Ab", "Eb", "Bb", "Cm", "Ab", "Fm9", "Cm", "Ab", "Eb", "Bb", "Absus", "Cm9", "Cm9"]
DRUMS = [0, 0, 1, 1, 1, 1, 1, 0, 2, 2, 2, 2, 3, 0, 0]  # 0 none, 1 groove, 2 four on the floor, 3 the verbs
BED = [0.35, 0.55, 0.65, 0.65, 0.7, 0.7, 0.75, 0.4, 1.0, 1.0, 1.0, 1.05, 1.1, 1.0, 0.85]
VERB_HITS = [30.3 + i * 0.45 + 0.17 for i in range(5)]  # index.html: each verb lands

bus = {k: [np.zeros(N), np.zeros(N)] for k in ("bed", "lead", "choir")}
mono = {k: np.zeros(N) for k in ("bass", "drums", "fx", "ui", "bell")}
kick_env = np.zeros(N)


def duck(t0, depth=1.0):
    place(kick_env, np.exp(-np.arange(int(SR * 0.4)) / SR * 8) * depth, t0)


# Supersaw bed: a filter that opens with the energy; bar 2 sweeps open; silence from 32.5 to the mark.
for b, name in enumerate(BARS):
    g = BED[b]
    t0 = b * BAR - (0 if b == 0 else 0.04)
    dur = BAR + 0.3
    a, rel = 0.03, 0.3
    if b == 0:
        a = 1.6
    if b == 12:
        dur, rel = BAR + 0.04, 0.03
    if b == 13:
        t0, dur = MARK, 13 * BAR + BAR - MARK + 0.3
    if b == 14:
        dur, rel = BAR, 0.6
    n = int(SR * dur)
    curve = np.clip(np.arange(n) / n, 0, 1) ** 1.5
    for side in (0, 1):
        x = np.zeros(n)
        for m in CH[name][1:]:
            x += supersaw(hz(m), n, spread=16 + 7 * side)
        if b == 0:
            x = lp(x, 380)
        elif b == 1:
            x = opening_lp(x, 380, 2600, curve)
        else:
            x = lp(x, 1000 if b == 7 else 1200 + 3600 * g)
        place(bus["bed"][side], x * adsr(n, a, 0.25, 0.9, dur - rel, rel), t0, g)

# Bass: driving eighths on the root (octave lift on each beat's "and" at the end of the bar), a growl on each attack.
for b, name in enumerate(BARS):
    if b < 2 or b in (7, 12, 13, 14):
        continue
    root = CH[name][0]
    while root > 40:
        root -= 12
    for k in range(8):
        m = root + (12 if k in (3, 7) else 0)
        n = int(SR * BEAT / 2 * 0.92)
        t = np.arange(n) / SR
        body = saw(hz(m), n) * 0.7 + np.sin(2 * np.pi * hz(m) * t)
        snap = np.exp(-t * 16)
        x = lp(body, 2200) * snap + lp(body, 260) * (1 - snap)
        sub = np.sin(2 * np.pi * hz(root) * t)
        e = np.minimum(1, t / 0.004) * np.minimum(1, (t[-1] - t) / 0.01 + 1e-9)
        place(mono["bass"], (np.tanh(1.5 * x) * 0.7 + sub * 0.45) * e, b * BAR + k * BEAT / 2, 1.0)
# The verbs: a sub hit under each; the mark: one long low C.
for v in VERB_HITS:
    n = int(SR * 0.42)
    t = np.arange(n) / SR
    place(mono["bass"], np.tanh(2 * (np.sin(2 * np.pi * hz(36) * t) + 0.4 * saw(hz(36), n))) * np.exp(-t * 6), v, 0.9)
n = int(SR * 4.0)
t = np.arange(n) / SR
place(mono["bass"], (np.sin(2 * np.pi * hz(36) * t) + 0.3 * lp(saw(hz(36), n), 300)) * np.exp(-t * 0.9) * np.minimum(1, t / 0.01), MARK, 1.0)


# Heartbeat (bars 1-2 and the breakdown) and the opening arp (bar 2, sixteenths, the filter opening).
def thump(dec=11):
    n = int(SR * 0.4)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(55 + 45 * np.exp(-t * 30)) / SR) * np.exp(-t * dec)


for b in (0, 1, 7):
    for bt, g in ((0.0, 1.0), (0.3, 0.6), (BEAT * 2, 1.0), (BEAT * 2 + 0.3, 0.6)):
        place(mono["drums"], thump(), b * BAR + bt, 0.75 * g)
for k in range(16):
    m = [60, 63, 67, 72, 67, 63, 67, 72][k % 8] + 12
    n = int(SR * 0.24)
    t = np.arange(n) / SR
    x = saw(hz(m), n) * np.exp(-t * 15)
    x = lp(x, 700 + 3800 * (k / 15) ** 1.4)
    place(bus["lead"][k % 2], x, BAR + k * BEAT / 4, 0.35 + 0.45 * k / 15)

# The hook: a rising, singing line (G C Eb D C Bb; then C Eb G F Eb), a bright detuned lead with vibrato.
HOOK = [(0, 67, 0.5), (0.5, 72, 0.5), (1, 75, 1.0), (2, 74, 0.5), (2.5, 72, 0.5), (3, 70, 1.0)]
HOOK2 = [(0, 72, 0.5), (0.5, 75, 0.5), (1, 79, 1.5), (2.5, 77, 0.5), (3, 75, 1.0)]


def lead_note(m, beats, bright):
    n = int(SR * (beats * BEAT + 0.3))
    t = np.arange(n) / SR
    vib = 1 + 0.005 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.12) / 0.3, 0, 1)
    ph = np.cumsum(hz(m) * vib) / SR
    x = (2 * (ph % 1) - 1) * 0.5 + (2 * ((ph * 1.004) % 1) - 1) * 0.5 + 0.5 * np.sin(2 * np.pi * ph)
    return lp(x, 1800 + 3200 * bright) * adsr(n, 0.01, 0.18, 0.75, beats * BEAT, 0.25)


for b, line, g, bright in ((2, HOOK, 0.8, 0.5), (4, HOOK2, 0.8, 0.55), (6, HOOK, 0.8, 0.6), (8, HOOK, 1.0, 0.9),
                           (10, HOOK2, 1.0, 0.95), (12, HOOK2, 1.1, 1.0), (14, HOOK, 0.75, 0.6)):
    for off, m, ln in line:
        x = lead_note(m, ln, bright)
        place(bus["lead"][0], x, b * BAR + off * BEAT, g)
        place(bus["lead"][1], x, b * BAR + off * BEAT, g)


# Choir: formant-filtered saws ("aah"): the breakdown (Fm9) and the mark (Cm9).
def choir(notes, dur, a=0.5):
    n = int(SR * dur)
    x = np.zeros(n)
    for m in notes:
        for c in (-10, 0, 9):
            x += saw(hz(m), n, c)
    v = bp(x, 650, 950) + 0.6 * bp(x, 1050, 1400) + 0.3 * bp(x, 2300, 2800)
    return v * adsr(n, a, 0.4, 0.85, dur - 1.0, 1.0)


for side, d in ((0, 0.0), (1, 0.025)):
    place(bus["choir"][side], choir([53, 56, 60, 63, 67], BAR + 0.6), 7 * BAR - 0.1 + d, 1.0)
    place(bus["choir"][side], choir([48, 55, 63, 67, 70, 74], LENGTH - MARK, a=0.12), MARK + d, 1.1)


# Drums: punchy kick, clap on 2 and 4, hats; the verbs bar is five hits and a roll.
def kick():
    n = int(SR * 0.36)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(45 + 160 * np.exp(-t * 32)) / SR) * np.exp(-t * 7)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 350) * 0.45
    return np.tanh(1.8 * (body + click))


def clap():
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 6000)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 110) * (t >= d) for d in (0.0, 0.012, 0.024))
    return noise * (0.7 * bursts + 0.45 * np.exp(-t * 14)) + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28) * 0.5


def hat(open_=False):
    n = int(SR * (0.25 if open_ else 0.05))
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7800) * np.exp(-t * (12 if open_ else 75))


K, CL = kick(), clap()
for b, mode in enumerate(DRUMS):
    t0 = b * BAR
    if mode in (1, 2):
        kicks = (0, 1, 2, 3) if mode == 2 else (0, 1.5, 2)
        for q in kicks:
            place(mono["drums"], K, t0 + q * BEAT, 1.0)
            duck(t0 + q * BEAT)
        for q in (1, 3):
            place(mono["drums"], CL, t0 + q * BEAT, 0.55)
        for s in range(16):
            if mode == 1 and s % 2:
                continue
            open_ = mode == 2 and s % 4 == 2
            place(mono["drums"], hat(open_), t0 + s * BEAT / 4, (0.15 if open_ else 0.2) * (1.0 if s % 4 == 2 else 0.6))
    if mode == 3:
        for v in VERB_HITS:
            place(mono["drums"], K, v, 1.1)
            place(mono["drums"], CL, v, 0.6)
            duck(v)
        roll = [31.25 + k * BEAT / 4 for k in range(4)] + [31.875 + k * BEAT / 8 for k in range(8)]
        roll += [32.1875 + k * BEAT / 16 for k in range(int((32.48 - 32.1875) / (BEAT / 16)))]
        for i, rt in enumerate(roll):
            place(mono["drums"], CL[: int(SR * 0.09)], rt, 0.12 + 0.4 * i / len(roll))


# Risers, reverse swells, impacts and the low brass "braam".
def riser(dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for s in range(32):
        a, z = s * n // 32, (s + 1) * n // 32
        f = 250 * 48 ** (s / 31)
        out[a:z] = bp(noise, f * 0.8, f * 1.3)[a:z]
    tone = np.sin(2 * np.pi * np.cumsum(110 * 8 ** (t / dur)) / SR) * 0.3
    return (out + tone) * (t / dur) ** 2.2


def impact(dur=2.4):
    n = int(SR * dur)
    t = np.arange(n) / SR
    boom = np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 7)) / SR)) * np.exp(-t * 2.4)
    body = lp(rng.standard_normal(n), 1800) * np.exp(-t * 18) * 0.8
    crash = hp(rng.standard_normal(n), 4500) * np.exp(-t * 2.6) * 0.3
    return boom + body + crash


def braam(dur=2.4):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = sum(supersaw(hz(m), n, voices=5, spread=12) for m in (24, 36, 43, 48))
    swell = np.minimum(1, t / 0.07) * np.exp(-t * 1.3)
    return np.tanh(2.5 * opening_lp(x, 180, 1400, swell)) * adsr(n, 0.02, 0.4, 0.7, dur - 0.9, 0.9)


def reverse_swell(dur):
    return hp(impact(dur + 0.2)[: int(SR * dur)][::-1], 400)


place(mono["fx"], riser(2.3), 2 * BAR - 2.3, 0.45)
place(mono["fx"], impact(), 2 * BAR, 0.6)
place(mono["fx"], braam(1.6), 2 * BAR, 0.18)
place(mono["fx"], reverse_swell(1.3), 7 * BAR - 1.3, 0.5)
place(mono["fx"], riser(2.5), 8 * BAR - 2.5, 0.55)
place(mono["fx"], impact(), 8 * BAR, 0.8)
place(mono["fx"], braam(2.4), 8 * BAR, 0.3)
place(mono["fx"], riser(2.0), 12 * BAR - 2.0, 0.45)
place(mono["fx"], impact(1.4), 12 * BAR, 0.45)
place(mono["fx"], riser(2.2), 32.48 - 2.2, 0.6)
place(mono["fx"], reverse_swell(0.42), MARK - 0.42, 0.25)
place(mono["fx"], impact(3.0), MARK, 1.0)
place(mono["fx"], braam(3.2), MARK, 0.34)


# ---------------------------------------------------------------- interface sounds, on the composition's events
def tick(level=1.0):
    n = int(SR * 0.025)
    t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2200, 6500) * np.exp(-t * 260) * level


def click():
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (180 + 200 * np.exp(-t * 60)) * t) * np.exp(-t * 40)
    return body * 0.8 + np.concatenate([tick(1.4), np.zeros(n - int(SR * 0.025))])


def whoosh(dur=0.45, up=True):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for s in range(12):
        a, z = s * n // 12, (s + 1) * n // 12
        frac = s / 11
        f = 400 + (4200 if up else 1400) * (frac if up else 1 - frac)
        out[a:z] = bp(noise, f * 0.7, f * 1.4)[a:z]
    return out * np.sin(np.pi * t / dur) ** 1.5


def bell(m, dur=1.8):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = sum(amp * np.sin(2 * np.pi * hz(m) * r * t) * np.exp(-t * dec) for r, amp, dec in ((1, 1, 2.2), (2.76, 0.35, 4.0), (5.4, 0.15, 7.0), (2.0, 0.2, 3.0)))
    return x * np.minimum(1, t / 0.004)


def pop(f=880):
    n = int(SR * 0.09)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 45)


def key_press(kind="letter"):
    """One key: the switch's snap, two keycap resonances and the bottom-out "thock" (deeper for space and Enter)."""
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    f1 = rng.uniform(1700, 2600) * {"letter": 1.0, "space": 0.62, "enter": 0.8}[kind]
    f2 = f1 * rng.uniform(1.9, 2.3)
    f3 = {"letter": rng.uniform(380, 520), "space": rng.uniform(170, 220), "enter": rng.uniform(240, 300)}[kind]
    snap = hp(rng.standard_normal(n), 3000) * np.exp(-t * 900)
    modes = 0.5 * np.sin(2 * np.pi * f1 * t) * np.exp(-t * 150) + 0.22 * np.sin(2 * np.pi * f2 * t) * np.exp(-t * 240)
    thock = np.sin(2 * np.pi * f3 * t) * np.exp(-t * (32 if kind == "space" else 55))
    d = int(SR * rng.uniform(0.006, 0.01))
    bottom = np.concatenate([np.zeros(d), (hp(rng.standard_normal(n), 1500) * np.exp(-t * 650))[: n - d]])
    x = 0.8 * snap + 0.7 * modes + (1.1 if kind != "letter" else 0.8) * thock + 0.55 * bottom
    return x * np.minimum(1, t / 0.0004)


def key_release():
    n = int(SR * 0.04)
    t = np.arange(n) / SR
    return (hp(rng.standard_normal(n), 2500) * np.exp(-t * 1100) + 0.3 * np.sin(2 * np.pi * rng.uniform(2200, 2900) * t) * np.exp(-t * 300)) * 0.5


def mouse(press=True):
    """A mouse button: a crisp plastic click; the release is higher and softer."""
    n = int(SR * 0.06)
    t = np.arange(n) / SR
    snap = bp(rng.standard_normal(n), 2000, 9000) * np.exp(-t * 1500)
    tone = 0.6 * np.sin(2 * np.pi * (3100 if press else 3700) * t) * np.exp(-t * 520) + 0.45 * np.sin(2 * np.pi * (850 if press else 1050) * t) * np.exp(-t * 260)
    return (snap + tone) * (1.0 if press else 0.55)


sfx = np.zeros(N)
for t0, t1, text in TYPING:  # a key per letter as it shows; at over 18 keys a second, every other letter (and every space)
    per = (t1 - t0) / len(text)
    thin = 1 / per > 18
    for k, ch in enumerate(text, start=1):
        if thin and k % 2 == 0 and ch != " ":
            continue
        kind = "space" if ch == " " else "letter"
        place(sfx, key_press(kind), t0 + (k - 0.5) * per + rng.uniform(-0.005, 0.005), rng.uniform(0.75, 1.0) * (0.9 if kind == "space" else 1.0))
for t0 in ENTERS:
    place(sfx, key_press("enter"), t0, 1.15)
    place(sfx, key_release(), t0 + 0.11, 0.8)
for t0 in CLICKS:
    place(sfx, mouse(True), t0 + 0.07, 2.2)
    place(sfx, mouse(False), t0 + 0.17, 1.6)
for i in range(3):  # S3: ⌥⇧V pressed one after another (index.html: down 5.35 + 0.05 i, up 5.5 + 0.05 i)
    place(sfx, key_press("letter"), 5.35 + 0.05 * i + 0.03, 0.9)
    place(sfx, key_release(), 5.5 + 0.05 * i + 0.06, 0.8)
mono["sfx"] = sfx

ui, bells = mono["ui"], mono["bell"]
for i in range(14):  # S2: each tab drops into the strip
    place(ui, tick(0.6), 2.62 + i * 0.1, 0.5)
for k in range(6):  # the panel docks: a pitched stutter
    place(ui, pop(1100 + 150 * k)[: int(SR * 0.03)], 4.1 + k * 0.045, 0.22)
place(bells, bell(84, 0.9), 5.5, 0.2)  # S3: listening (the shortcut's keys are in sfx)
for t0 in (7.85, 8.05, 8.25):  # S4: the mute swaps; the spoken reply
    place(ui, pop(1320), t0, 0.25)
place(bells, bell(79, 1.2), 8.15, 0.22)
place(ui, whoosh(0.42, True), 12.65, 0.2)  # S5-S6: typing and clicks are in sfx; the AI's sheet rises
place(ui, whoosh(0.5, False), 14.75, 0.2)  # S7: the tabs fold; the toast
place(ui, pop(990), 14.7, 0.25)
place(ui, whoosh(0.42, True), 22.4, 0.2)  # S9-S10: the sheet; Saturday rings
place(bells, bell(75, 1.4), 23.2, 0.2)
place(bells, bell(79, 1.4), 23.4, 0.18)
for i in range(3):  # S11: the tabs fly into the folder; it closes
    place(ui, whoosh(0.8, False), 25.15 + i * 0.12, 0.14)
place(ui, click() * 0.7, 26.15, 0.8)  # the folder shuts
place(ui, pop(990), 24.75, 0.25)
for k in range(9):  # S12: the clock rolls; the notification; the tabs fly home
    place(ui, tick(0.6), 27.5 + k * 0.1, 0.45)
place(bells, bell(79, 1.6), 28.42, 0.3)
place(bells, bell(84, 1.8), 28.55, 0.3)
for i in range(3):
    place(ui, whoosh(0.75, True), 28.7 + i * 0.1, 0.14)
place(bells, bell(72, 3.0), 33.0, 0.35)  # S14: the mark
place(bells, bell(79, 3.0), 33.0, 0.2)
place(bells, bell(87, 3.0), 33.05, 0.14)

# ---------------------------------------------------------------- mix: sidechain pump, space, glue
MIX = {"bed": 0.18, "lead": 0.28, "choir": 0.07, "bass": 0.12, "drums": 0.32, "fx": 0.3, "ui": 0.25, "bell": 0.15, "sfx": 0.5}
pump = 1 - 0.6 * np.clip(lp(kick_env, 40, 1), 0, 1)
# While keys and clicks sound, the music steps back about 4 dB (a smooth envelope, 60 ms in, 250 ms out).
busy = np.zeros(N)
for t0, t1, _ in TYPING:
    busy[int((t0 - 0.06) * SR):int((t1 + 0.1) * SR)] = 1
for t0 in ENTERS + CLICKS + [5.35]:
    busy[int((t0 - 0.03) * SR):int((t0 + 0.3) * SR)] = 1
music_gain = 1 - 0.37 * np.clip(lp(busy, 3, 1), 0, 1)


def impulse(seconds, seed):
    r = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n) / SR
    return lp(r.standard_normal(n), 6000) * np.exp(-t * 2.2) * 0.02


def ping_pong(x, delay=BEAT * 0.75, fb=0.4, wet=0.35):
    out = [np.zeros(N), np.zeros(N)]
    d = int(SR * delay)
    tap = x.copy()
    for k in range(1, 7):
        tap = np.concatenate([np.zeros(d), tap[:-d]]) * fb
        out[k % 2] += tap * wet
    return out


parts = {}
lead_echo = ping_pong(lp((bus["lead"][0] + bus["lead"][1]) / 2, 5000))
IR = [impulse(2.8, 7), impulse(2.8, 8)]
mix = []
for side in (0, 1):
    p = {
        "bed": bus["bed"][side] * pump * MIX["bed"],
        "lead": (bus["lead"][side] + lead_echo[side]) * MIX["lead"],
        "choir": bus["choir"][side] * MIX["choir"],
        "bass": mono["bass"] * (0.45 + 0.55 * pump) * MIX["bass"],
        "drums": mono["drums"] * MIX["drums"],
        "fx": mono["fx"] * MIX["fx"],
        "ui": mono["ui"] * MIX["ui"],
        "bell": mono["bell"] * MIX["bell"],
    }
    for k in ("bed", "lead", "choir", "bass", "drums"):
        p[k] = p[k] * music_gain
    p["sfx"] = mono["sfx"] * MIX["sfx"]
    send = p["bed"] * 0.5 + p["lead"] * 0.9 + p["choir"] * 1.2 + p["bell"] * 1.5 + p["ui"] * 0.5 + p["fx"] * 0.3
    wet = fftconvolve(send, IR[side])[:N]
    mix.append(hp(sum(p.values()) + 1.4 * wet, 30))
    if side == 0:
        parts = p
L, R = mix
fade = np.minimum(1, T / 0.1) * np.clip((LENGTH - T) / 0.55, 0, 1) ** 1.5
L, R = L * fade, R * fade


def write_wav(path, l, r):
    pcm = np.clip(np.stack([l, r], axis=1) * 32767, -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def measure(l, r):
    tmp = os.path.join(OUT, "_measure.wav")
    write_wav(tmp, l, r)
    out = subprocess.run(["ffmpeg", "-nostats", "-i", tmp, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    os.remove(tmp)
    summary = out.split("Integrated loudness:")[1]
    i = float(summary.split("I:")[1].split("LUFS")[0])
    lra = float(summary.split("LRA:")[1].split("LU")[0])
    tp = float(summary.split("Peak:")[1].split("dBFS")[0])
    return i, lra, tp


def limit(x, ceiling_db=-1.0):
    lim = 10 ** (ceiling_db / 20)
    knee = lim * 0.8
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    y[over] = np.sign(x[over]) * (knee + (lim - knee) * np.tanh((a[over] - knee) / (lim - knee)))
    return y


os.makedirs(OUT, exist_ok=True)
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.5, R / peak * 0.5
for _ in range(4):  # loudness to -14 LUFS, peaks softly held under -1.5 dBFS (true peak about -1 dB after AAC)
    i, _, _ = measure(L, R)
    g = 10 ** ((-14 - i) / 20)
    L, R = limit(L * g, -1.5), limit(R * g, -1.5)
i, lra, tp = measure(L, R)

wav = os.path.join(OUT, "score.wav")
write_wav(wav, L, R)
bar_rms = lambda x: [20 * np.log10(np.sqrt(np.mean(x[int(b * BAR * SR):int((b + 1) * BAR * SR)] ** 2)) + 1e-9) for b in range(15)]
print("bar RMS dBFS:", " ".join(f"{v:.1f}" for v in bar_rms((L + R) / 2)))
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("part     full  break  mark (RMS dB before the master gain: bars 9-12, bar 8, 32.95-35 s)")
for k, v in parts.items():
    print(f"  {k:6} {db(v[int(8 * BAR * SR):int(12 * BAR * SR)]):6.1f} {db(v[int(7 * BAR * SR):int(8 * BAR * SR)]):6.1f} {db(v[int(MARK * SR):int(35 * SR)]):6.1f}")
lim_knee = 10 ** (-1.5 / 20) * 0.8
print(f"samples in the limiter's knee: {100 * np.mean(np.abs(L) > lim_knee):.2f}%")
print(f"integrated {i:.1f} LUFS, LRA {lra:.1f} LU, true peak {tp:.1f} dBFS")
m4a = os.path.join(OUT, "score.m4a")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "256k", m4a], check=True)
print(f"wrote {wav} and {m4a}")
# Keys and clicks against the music under them: each sound's 10 ms peak over the music's level there (dB).
win = int(SR * 0.01)
music = sum(v for k, v in parts.items() if k != "sfx")
for name, spans in (("typing S5", [TYPING[0][:2]]), ("typing S9", [TYPING[1][:2]]), ("clicks", [(c + 0.05, c + 0.22) for c in CLICKS])):
    ratios = []
    for a0, b0 in spans:
        s0, s1 = int(a0 * SR), int(b0 * SR)
        fx_peak = max(np.sqrt(np.mean(parts["sfx"][i:i + win] ** 2)) for i in range(s0, s1 - win, win // 2))
        mus = np.sqrt(np.mean(music[s0:s1] ** 2))
        ratios.append(20 * np.log10(fx_peak / mus))
    print(f"  {name}: sfx peaks " + ", ".join(f"{r:+.1f}" for r in ratios) + " dB over the music")
