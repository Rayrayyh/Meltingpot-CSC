"""The demo video's music: a calm piano bed in Eb major, 96 BPM, 39 bars (97.5 s), on the demo's sections.

Bars 1-6 (titles): a three-note motif on the title words, a warm chord and a celesta on the logo.
Bars 7-32 (the eight steps, 15.0 to 80.0): an eighth-note piano figure over I V6 vi IV, strings under it, a sub from
bar 10, a shaker from bar 13, a soft kick from bar 17; a celesta chime as each step begins.
Bars 33-36 (how it is built): the figure stops; held chords climb toward home.
Bars 37-39 (the end card, 90.0): Eb, with a celesta run under the wordmark, held into the fade.
Parts are played by FluidSynth from the FluidR3 GM soundfont (MIT, LICENSE-FluidR3_GM.txt); seeded, so every run
writes the same file. Mastered to -14 LUFS with true peaks under -1.5 dBFS.
  python3 tools/bed.py  ->  assets/audio/bed.wav
"""
import os
import subprocess
import wave

import numpy as np

import lib
from lib import BAR, BEAT, N, SR, m, place

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEPS = [15.0, 22.5, 30.0, 40.0, 47.5, 55.0, 62.5, 72.5]


def bt(bar, beat=0.0):
    return bar * BAR + beat * BEAT


C = {  # bass, the figure's four notes, the strings' voicing
    "Eb": (m("Eb2"), [m("Bb3"), m("Eb4"), m("G4"), m("Bb4")], [m("Eb3"), m("Bb3"), m("G4"), m("Bb4")]),
    "Bb/D": (m("D2"), [m("Bb3"), m("D4"), m("F4"), m("Bb4")], [m("D3"), m("Bb3"), m("F4"), m("Bb4")]),
    "Cm": (m("C2"), [m("C4"), m("Eb4"), m("G4"), m("C5")], [m("C3"), m("G3"), m("Eb4"), m("G4")]),
    "Ab": (m("Ab1"), [m("Ab3"), m("C4"), m("Eb4"), m("G4")], [m("Ab2"), m("Eb3"), m("C4"), m("Eb4")]),
    "Fm7": (m("F1"), [m("Ab3"), m("C4"), m("Eb4"), m("F4")], [m("F2"), m("C3"), m("Ab3"), m("Eb4")]),
    "Bbsus4": (m("Bb1"), [m("Bb3"), m("Eb4"), m("F4"), m("Bb4")], [m("Bb2"), m("F3"), m("Eb4"), m("F4")]),
    "Bb": (m("Bb1"), [m("Bb3"), m("D4"), m("F4"), m("Bb4")], [m("Bb2"), m("F3"), m("D4"), m("F4")]),
}
CYCLE = ["Eb", "Bb/D", "Cm", "Ab"]
FIG = [0, 1, 2, 3, 2, 1, 2, 3]


def render():
    piano, strings, celesta, choir = lib.Part(0, 1), lib.Part(48, 2, human_t=0.0), lib.Part(8, 3, human_t=0.0), lib.Part(52, 4, human_t=0.0)
    kit = lib.Kit(5)
    drums, sub = lib.silence(), lib.silence()

    # ---- the titles (bars 1-6): the motif on the words, a chord on the logo card.
    piano.note(0.30, 2.6, m("Eb3"), 44).note(0.30, 2.4, m("G4"), 56)
    piano.note(1.90, 2.0, m("Bb4"), 52).note(2.05, 2.4, m("Eb5"), 56)
    bass, four, voicing = C["Ab"]
    piano.chord(bt(2), 2.3, [bass + 12] + four[1:], 50, roll=0.03)
    piano.chord(7.8, 3.0, [m("Eb2"), m("Bb2"), m("G3"), m("Eb4"), m("G4")], 60, roll=0.03)
    for i, name in enumerate(["Eb5", "G5", "Bb5"]):
        celesta.note(7.9 + i * 0.12, 1.2, m(name), 60, exact=True)
    strings.chord(7.8, 7.2, C["Eb"][2], 50)
    piano.chord(bt(5), 2.3, [m("Ab2")] + C["Ab"][1][1:], 54, roll=0.03)

    # ---- the steps (bars 7-32).
    for b in range(6, 32):
        name = CYCLE[(b - 6) % 4]
        bass, four, voicing = C[name]
        full = b >= 16
        vbase = 56 + (8 if full else 0)
        for k, idx in enumerate(FIG):
            piano.note(bt(b, k * 0.5), 0.55, four[idx], vbase + (6 if k % 2 == 0 else 0))
        piano.note(bt(b), 1.2, bass + 12, vbase - 6)
        piano.note(bt(b, 2), 1.2, four[0] - 12, vbase - 12)
        strings.chord(bt(b), BAR, voicing, 58 if not full else 70)
        if b >= 9:
            sub[:] += lib.sub(bt(b), BAR - 0.05, bass, 0.22 if not full else 0.3, release=0.25)
        if b >= 12:
            for s in range(8):
                place(drums, kit.shaker(0.14 if s % 2 else 0.2), bt(b, s * 0.5) + (0.012 if s % 2 else 0))
        if b >= 16:
            for q in (0, 2):
                place(drums, kit.soft_kick(), bt(b, q), 0.45)
    for t in STEPS:  # a chime as each step begins
        celesta.note(t + 0.15, 1.0, m("Bb5"), 54, exact=True).note(t + 0.27, 1.0, m("Eb6"), 50, exact=True)
    for t, val in ((0, 70), (bt(6), 64), (bt(16), 90), (bt(32), 80)):
        strings.cc(t, 11, val)

    # ---- how it is built (bars 33-36): held chords climbing home.
    for i, name in enumerate(["Ab", "Bb/D", "Cm", "Bbsus4"]):
        bass, four, voicing = C[name]
        piano.chord(bt(32 + i), 2.3, [bass + 12] + four[1:], 58 + 3 * i, roll=0.03)
        strings.chord(bt(32 + i), BAR, voicing, 66 + 4 * i)
        sub[:] += lib.sub(bt(32 + i), BAR - 0.05, bass, 0.2, release=0.3)

    # ---- the end card (90.0): Eb, a celesta run under the wordmark, held into the fade.
    piano.chord(90.0, 7.0, [m("Eb1"), m("Eb2"), m("Bb2"), m("G3"), m("Bb3"), m("Eb4"), m("G4")], 84, roll=0.012)
    strings.chord(90.0, 7.5, [m("Eb2"), m("Bb2"), m("G3"), m("Eb4"), m("Bb4"), m("G5")], 86)
    choir.chord(90.05, 7.4, [m("Eb4"), m("G4"), m("Bb4")], 64)
    for i, name in enumerate(["Eb5", "G5", "Bb5", "Eb6", "G6", "Bb6"]):
        celesta.note(90.3 + i * 0.11, 1.4, m(name), 58 + 3 * i, exact=True)
    sub[:] += lib.sub(90.0, 7.4, m("Eb1"), 0.45, attack=0.01, release=2.0)
    place(drums, kit.cymbal(3.0, 0.16), 90.0)

    P = [lib.shelf_lp(x, 2600, 0.5) for x in piano.render(0.7)]
    ir = lib.reverb_ir(2.8, seed=3, damp=0.55)
    stems = {
        "piano": lib.stem(lib.reverb(P, ir, 0.32), 1.0),
        "strings": lib.stem(lib.reverb(strings.render(0.6), ir, 0.38), 0.5),
        "celesta": lib.stem(lib.reverb(celesta.render(0.6), ir, 0.5), 0.5),
        "choir": lib.stem(lib.reverb(choir.render(0.5), ir, 0.5), 0.3),
        "drums": lib.stem(lib.reverb(lib.pan(lib.lp(drums, 9000), 0.0), lib.reverb_ir(1.2, seed=4), 0.15), 0.5),
        "sub": lib.stem(lib.pan(lib.lp(sub, 140), 0.0), 0.22),
    }
    stems = lib.glue(stems, thresh_db=-12, ratio=2.0)
    L = sum(v["L"] * v["gain"] for v in stems.values())
    R = sum(v["R"] * v["gain"] for v in stems.values())
    return L, R


def measure(l, r, path):
    write(path, l, r)
    out = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = out.split("Integrated loudness:")[1]
    return float(s.split("I:")[1].split("LUFS")[0]), float(s.split("LRA:")[1].split("LU")[0]), float(s.split("Peak:")[1].split("dBFS")[0])


def write(path, l, r):
    pcm = np.clip(np.stack([l, r], axis=1) * 32767, -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def limit(x, ceiling_db):
    lim = 10 ** (ceiling_db / 20)
    knee = lim * 0.8
    a = np.abs(x)
    y = x.copy()
    over = a > knee
    y[over] = np.sign(x[over]) * (knee + (lim - knee) * np.tanh((a[over] - knee) / (lim - knee)))
    return y


if __name__ == "__main__":
    L0, R0 = render()
    t = np.arange(N) / SR
    fade = np.minimum(1, t / 0.05) * np.clip((97.5 - t) / 0.6, 0, 1) ** 1.5
    L0, R0 = lib.hp(L0 * fade, 30), lib.hp(R0 * fade, 30)
    pk = max(np.abs(L0).max(), np.abs(R0).max())
    L0, R0 = L0 / pk * 0.5, R0 / pk * 0.5
    out = os.path.join(HERE, "assets", "audio", "bed.wav")
    tmp = out + ".tmp.wav"
    ceiling = -1.5
    for attempt in range(5):
        L, R = L0, R0
        for _ in range(4):
            i, _, _ = measure(L, R, tmp)
            g = 10 ** ((-14 - i) / 20)
            L, R = limit(L * g, ceiling), limit(R * g, ceiling)
        i, lra, tp = measure(L, R, tmp)
        if tp <= -1.8:
            break
        ceiling -= tp + 1.8 + 0.2
    os.remove(tmp)
    write(out, L, R)
    print(f"wrote {out}: {i:.1f} LUFS, LRA {lra:.1f} LU, true peak {tp:.1f} dBFS")
