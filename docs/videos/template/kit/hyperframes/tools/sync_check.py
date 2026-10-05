"""Measure A/V sync of a render: flash box (bottom-left) onsets vs 1 kHz burst onsets.
usage: python3 sync_check.py out.mp4 [expected burst times...]"""
import subprocess, sys, numpy as np, re
import os
FF = os.environ.get("HYPERFRAMES_FFMPEG_PATH", "/usr/local/bin/ffmpeg")
f = sys.argv[1]
expected = [float(x) for x in sys.argv[2:]] or [0.5, 1.5, 2.5]
# video: mean luma of the flash region per frame
out = subprocess.run([FF, "-v", "error", "-i", f, "-map", "0:v", "-vf",
    "crop=180:180:40:860,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"],
    capture_output=True, text=True).stdout
ys = [float(m) for m in re.findall(r"YAVG=([\d.]+)", out)]
fps = 30.0
lit = [i for i, y in enumerate(ys) if y > 200]
v_on = [i / fps for i in lit if i == 0 or (i - 1) not in lit]
# audio: decode to 48 kHz mono f32, high-pass to isolate the 1 kHz bursts, find onsets
raw = subprocess.run([FF, "-v", "error", "-i", f, "-map", "0:a", "-ac", "1", "-ar", "48000",
    "-af", "highpass=f=500,highpass=f=500", "-f", "f32le", "-"], capture_output=True).stdout
a = np.frombuffer(raw, dtype="<f4")
sr = 48000
env = np.convolve(np.abs(a), np.ones(48) / 48, mode="same")
thr = 0.5 * env.max()
above = env > thr
idx = np.flatnonzero(above & ~np.r_[False, above[:-1]])
a_on = []
for i in idx:
    if not a_on or i / sr - a_on[-1] > 0.2:
        a_on.append(i / sr)
print("frames", len(ys), "audio seconds %.4f" % (len(a) / sr))
print("video flash onsets (s):", [round(x, 4) for x in v_on])
print("audio burst onsets (s):", [round(x, 4) for x in a_on])
for e, v, au in zip(expected, v_on, a_on):
    print("expected %.3f  video %.4f (%+.1f ms)  audio %.4f (%+.1f ms)  audio-video %+.1f ms" % (e, v, (v - e) * 1e3, au, (au - e) * 1e3, (au - v) * 1e3))
