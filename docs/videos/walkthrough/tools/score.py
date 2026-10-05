"""The walkthrough film's music: bright marimba, plucked bass, vibes and glockenspiel in F major, 96 BPM, 48 bars (120 s).

Built on the film's acts, one act per run of 2.5 s bars (notes/STORYBOARD.md):
  bars 0-3   (0.0-10.0)   hook, then the mark on 5.0: marimba notes on the words, a warm chord on the pot
  bars 4-7   (10.0-20.0)  join: marimba eighths come in
  bars 8-17  (20.0-45.0)  write and organize: sixteenths, plucked bass, snaps, then a light kick
  bars 18-27 (45.0-70.0)  correct, history, sync: vibes answer on the offbeats, claps
  bars 28-33 (70.0-85.0)  flashcards and practice: the full groove, glockenspiel tune
  bars 34-37 (85.0-95.0)  the readout: the kick drops out, about 6 dB down, a riser into the lift
  bars 38-41 (95.0-105.0) search: everything again
  bars 42-44 (105.0-112.5) the class knows more together: everything, the tune
  bars 45-47 (112.5-120.0) the end card: F major with a glockenspiel run, held into the fade
The keystrokes and clicks sit at 6 to 10 kHz (assets/audio/sfx), so the bed keeps its shakers and hats low and soft.
Parts are played by FluidSynth from the FluidR3 GM soundfont (MIT, LICENSE-FluidR3_GM.txt); seeded, so every run writes
the same file. Writes assets/audio/bed.wav (the music alone) for tools/mix.py.
  python3 tools/score.py
"""
import os
import subprocess
import wave

import numpy as np

import lib
from lib import BAR, BEAT, N, SR, m, place

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
END = 112.5  # the end card's first frame (storyboard)
LIFT = 95.0  # out of the readout into search
CLOSE = 105.0  # the closing line


def bt(bar, beat=0.0):
    return bar * BAR + beat * BEAT


C = {  # bass, the marimba's four notes, the pad's voicing
    "Dm": (m("D2"), [m("D4"), m("A4"), m("D5"), m("F5")], [m("D4"), m("F4"), m("A4"), m("C5")]),
    "Bb": (m("Bb1"), [m("Bb3"), m("F4"), m("Bb4"), m("D5")], [m("D4"), m("F4"), m("Bb4"), m("C5")]),
    "F": (m("F2"), [m("C4"), m("F4"), m("A4"), m("C5")], [m("C4"), m("F4"), m("A4"), m("C5")]),
    "C": (m("C2"), [m("C4"), m("G4"), m("C5"), m("E5")], [m("C4"), m("E4"), m("G4"), m("D5")]),
    "Gm7": (m("G1"), [m("Bb3"), m("D4"), m("F4"), m("G4")], [m("Bb3"), m("D4"), m("F4"), m("G4")]),
    "Csus4": (m("C2"), [m("C4"), m("F4"), m("G4"), m("C5")], [m("C4"), m("F4"), m("G4"), m("Bb4")]),
}
CYCLE = ["F", "C", "Dm", "Bb"]  # I V vi IV, warm and forward
PAT = [0, 2, 1, 3, 2, 0, 3, 1, 0, 2, 1, 3, 2, 3, 1, 2]
TUNE = [  # glockenspiel, four bars over F C Dm Bb
    [(0, 1, "A5"), (1, 0.5, "C6"), (1.5, 0.5, "F6"), (2, 1, "E6"), (3, 1, "C6")],
    [(0, 1, "G5"), (1, 0.5, "C6"), (1.5, 0.5, "E6"), (2, 1.5, "D6"), (3.5, 0.5, "C6")],
    [(0, 1, "A5"), (1, 0.5, "D6"), (1.5, 0.5, "F6"), (2, 1, "E6"), (3, 1, "D6")],
    [(0, 1, "D6"), (1, 0.5, "C6"), (1.5, 0.5, "Bb5"), (2, 2, "A5")],
]


def section(b):
    if b < 4:
        return "hook"
    if b < 8:
        return "join"
    if b < 18:
        return "write"
    if b < 28:
        return "correct"
    if b < 34:
        return "study"
    if b < 38:
        return "readout"
    if b < 45:
        return "lift"
    return "end"


def render():
    mar, bass, vib, glock, pad = (lib.Part(12, 1, human_t=0.004), lib.Part(32, 2), lib.Part(11, 3),
                                  lib.Part(9, 4, human_t=0.0), lib.Part(89, 5, human_t=0.0))
    kit = lib.Kit(41)
    drums, fx, sub = lib.silence(), lib.silence(), lib.silence()
    K = kit.kick(tone=52, punch=110, decay=9, click=0.12)

    # ---- the hook (bars 0-3): sparse marimba on the words, a pad, a chord on the mark at bar 2.
    mar.chord(0.35, 1.2, [m("F4"), m("A4"), m("C5")], 66, roll=0.02)
    mar.note(1.6, 0.6, m("D5"), 62).note(1.9, 0.9, m("F5"), 68)
    pad.chord(0.0, 2 * BAR, C["F"][2], 60)
    mar.chord(bt(2), 1.6, [m("F3"), m("C4"), m("F4"), m("A4"), m("C5")], 84, roll=0.012)
    vib.chord(bt(2), 2.4, [m("A4"), m("C5"), m("F5")], 60)
    for i, name in enumerate(["F5", "A5", "C6", "F6"]):
        glock.note(bt(2) + 0.25 + i * 0.1, 0.6, m(name), 58 + 4 * i)
    pad.chord(bt(2), 2 * BAR, C["Bb"][2], 54)
    place(fx, kit.swell(0.8, level=0.22), bt(2) - 0.8)
    sub[:] += lib.sub(bt(2), 2 * BAR - 0.1, m("F1"), 0.3, attack=0.01, release=0.6)

    # ---- bars 4-44: the cycle, building by section.
    for b in range(4, 45):
        sec = section(b)
        name = CYCLE[(b - 4) % 4]
        bs, four, voicing = C[name]
        if sec == "join":
            for k in range(0, 16, 2):
                mar.note(bt(b, k * 0.25), 0.25, four[PAT[k]], 60 + (8 if k % 4 == 0 else 0))
        elif sec == "readout":
            for k in range(0, 16, 2):
                mar.note(bt(b, k * 0.25), 0.25, four[PAT[k]], 58 + (8 if k % 4 == 0 else 0))
        else:
            base = {"write": 60, "correct": 64, "study": 70, "lift": 74}[sec]
            for k in range(16):
                mar.note(bt(b, k * 0.25), 0.2, four[PAT[k]], min(96, base + (10 if k % 4 == 0 else 0)))
        if sec != "join":
            for q, ln, v in ((0, 1.4, 86), (1.5, 0.4, 70), (2, 0.9, 82), (3, 0.5, 68), (3.5, 0.4, 74)):
                bass.note(bt(b, q), ln * BEAT, bs + (12 if q == 3.5 else 0), v if sec != "readout" else v - 14)
            sub[:] += lib.sub(bt(b), 2 * BEAT, bs + 12, 0.26 if sec in ("write", "readout") else 0.38)
        pad.chord(bt(b), BAR, voicing, {"join": 50, "write": 52, "correct": 56, "study": 60, "readout": 64, "lift": 66}[sec])
        if sec in ("correct", "readout"):
            for q, idx in ((1.5, 3), (3.5, 2)):
                vib.note(bt(b, q), 0.6, four[idx] + 12, 74 if sec == "correct" else 66)
        if (sec == "study" and (b - 28) % 8 < 4) or (sec == "lift" and b >= 42):
            for beat, beats, nm in TUNE[(b - 4) % 4]:
                glock.note(bt(b, beat), beats * BEAT, m(nm), 92)
                vib.note(bt(b, beat), beats * BEAT, m(nm) - 12, 50)
        # drums
        if sec in ("write", "correct", "study", "lift") and b >= 8:
            for q in (1, 3):
                place(drums, kit.snap() if sec == "write" else kit.clap(), bt(b, q), 0.36 if sec == "write" else 0.42)
        if (sec == "write" and b >= 10) or sec in ("correct", "study", "lift"):
            for q in ((0, 2.5) if sec in ("write", "correct") else (0, 1.5, 2, 2.5)):
                place(drums, K, bt(b, q), 0.5 if q in (0, 2) else 0.36)
        if sec in ("study", "lift"):
            for s in range(8):
                place(drums, kit.shaker(0.1 if s % 2 else 0.15), bt(b, s * 0.5))

    # Act lifts: a soft cymbal and swell into the new act's first bar.
    for b in (4, 8, 18, 28, 42):
        place(fx, kit.swell(1.2, level=0.18), bt(b) - 1.2)
        place(drums, kit.cymbal(1.8, 0.16), bt(b))
    # Out of the readout: a riser and a sixteenth of silence before the lift.
    n = int(SR * 2.4)
    tt = np.arange(n) / SR
    riser = lib.bp(kit.noise(n), 600, 8000) * (tt / tt[-1]) ** 2.5
    riser[-int(SR * 0.16):] = 0
    place(fx, riser, LIFT - 2.4, 0.16)
    place(fx, kit.boom(lib.hz(m("F1")), 1.6, 0.32), LIFT)
    place(drums, kit.cymbal(2.0, 0.2), LIFT)
    place(fx, kit.swell(1.2, level=0.16), CLOSE - 1.2)
    place(drums, kit.cymbal(1.8, 0.18), CLOSE)

    # ---- the end card (112.5): F major, a glockenspiel run, held into the fade.
    mar.chord(END, 1.6, [m("F3"), m("C4"), m("F4"), m("A4"), m("C5"), m("F5")], 92, roll=0.01)
    pad.chord(END, 120.0 - END, [m("F3"), m("C4"), m("F4"), m("A4"), m("C5")], 78)
    bass.note(END, 2.4, m("F1"), 96)
    vib.chord(END + 2.5, 3.0, [m("A4"), m("C5"), m("F5")], 58)
    for i, name in enumerate(["F5", "A5", "C6", "F6", "A6", "C7"]):
        glock.note(END + 0.3 + i * 0.1, 0.8, m(name), 60 + 3 * i)
    place(drums, kit.cymbal(3.0, 0.24), END)
    place(fx, kit.boom(lib.hz(m("F1")), 3.0, 0.34), END)
    sub[:] += lib.sub(END, 6.0, m("F1"), 0.36, attack=0.005, release=2.0)

    # The hook's last words ('speed', 'of', 'thought.') on their ticks at 2.2, 2.5 and 2.833, so the open does not drop
    # out. Added here, after every other note, because lib.Part draws its timing jitter from a seeded sequence at each
    # note() call: placed in the hook block they would shift every marimba note in the film.
    mar.note(2.2, 0.6, m("A4"), 62).note(2.5, 0.6, m("C5"), 64).note(2.833, 1.4, m("F5"), 68)
    Mr, Bs, Vb, Gl, Pd = mar.render(0.7), bass.render(0.7), vib.render(0.6), glock.render(0.55), pad.render(0.5)
    ir = lib.reverb_ir(2.2, seed=13, damp=0.45, bright=9000)
    Mr = lib.reverb(Mr, ir, 0.22)
    Vb = lib.reverb(Vb, ir, 0.35)
    Gl = lib.reverb(Gl, ir, 0.4)
    Pd = lib.reverb([lib.lp(x, 5000) for x in Pd], ir, 0.3)
    D = lib.reverb(lib.pan(lib.lp(drums, 7000), 0.0), lib.reverb_ir(0.9, seed=14, damp=0.3), 0.15)
    F = lib.reverb(lib.pan(fx, 0.0), ir, 0.25)
    Mr = [Mr[0] * 0.85 + Mr[1] * 0.15, Mr[1] * 0.85 + Mr[0] * 0.15]
    stems = {
        "marimba": lib.stem(Mr, 0.85),
        "bass": lib.stem(Bs, 0.7),
        "vibes": lib.stem(Vb, 0.75),
        "glock": lib.stem(Gl, 1.1),
        "pad": lib.stem(Pd, 0.35),
        "drums": lib.stem(D, 0.55),
        "sub": lib.stem(lib.pan(lib.lp(sub, 120), 0.0), 0.2),
        "fx": lib.stem(F, 0.5),
    }
    stems = lib.glue(stems, thresh_db=-12, ratio=2.0)
    L = sum(v["L"] * v["gain"] for v in stems.values())
    R = sum(v["R"] * v["gain"] for v in stems.values())
    return L, R


def write(path, l, r):
    pcm = np.clip(np.stack([l, r], axis=1) * 32767, -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    L, R = render()
    t = np.arange(N) / SR
    fade = np.minimum(1, t / 0.05) * np.clip((120.0 - t) / 1.2, 0, 1) ** 1.5
    L, R = lib.hp(L * fade, 30), lib.hp(R * fade, 30)
    pk = max(np.abs(L).max(), np.abs(R).max())
    L, R = L / pk * 0.5, R / pk * 0.5
    out = os.path.join(HERE, "assets", "audio", "bed.wav")
    write(out, L, R)
    print("wrote", out)
