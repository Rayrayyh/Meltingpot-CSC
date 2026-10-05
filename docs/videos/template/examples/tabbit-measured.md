<!-- Copied from meltingpot's docs/videos/launch/notes/TABBIT.md as the worked example of how closely to measure a reference. Paths under /tmp are the original study's scratch files and are not in the repo. -->

# Tabbit, measured (2026-10-02)

Notes from tabbit1.mp4: two readers (picture, sound) and a skeptic who re-measured them. Kept as notes only; no frames or audio of the reference are in the repo. Raw results: scratchpad refs/tabbit-study.json.

## Numbers the skeptic confirmed with its own measurements

- Loudness (ffmpeg ebur128 on the mp4 and on my own 48 kHz extraction): integrated -14.1 LUFS (gate -24.4), LRA 5.6 LU (-17.4 to -11.7), true peak -2.3 dBFS, sample peak -2.3 dBFS. Momentary max -9.8 LUFS at 32.4 s.
- Short-term (3 s) LUFS centred on beats 2-15: -19.8, -14.3, -17.2, -14.3, -17.4, -14.5, -15.4, -12.3, -15.1, -12.2, -15.0, -11.3, -13.2, -13.1. Beat 1 momentary max -27.0.
- Stereo and low end: L/R correlation 0.183, side 1.6 dB under mid, energy below 30 Hz 37.8 dB under the total.
- Tempo: beat 0.62496 s from flux autocorrelation (96.006 BPM), bar 2.49991 s (96.003 BPM), grid fit 96.00 BPM at phase -12 ms (STFT window offset).
- Bar lines: the 20-200 Hz steepest rise sits at k*2.5 s within ±5 ms (0.003, 2.500, 4.999, 7.499, 9.997, 12.494, 15.000, 17.500, 19.999, 22.497, 24.999, 27.500, 29.998). Each downbeat is preceded by a 20-30 dB low-band gap from -25 to -5 ms. The mark impact is at 32.950 s.
- Score identity: the film against my own unchanged run of Appendix 3 compose.py gives lag 0, overall r 0.959, and r 0.9998-1.0000 in every 1.25 s window without typing or clicks. Against the effects-free render the gain is -0.09 dB.
- Deterministic script sounds cancel in the residual by 22-33 dB, so they are at the script's times and levels: dock stutter 4.10+0.045k, swap pops 7.85/8.05/8.25, toast pops 14.70/24.75, notification bells 28.42/28.55, mark bells 33.00/33.05.
- No ducking: film/effects-free gain is within ±0.1 dB over 9.8-12.7 s and 20.3-22.6 s. The script's duck there would be -3.6 dB.
- Camera, settled framings (full-res NCC on the panel header): 1.5502@(1299.9,329.9), 1.0997@(999.8,529.9), 1.4001@(1359.9,299.9), 1.2508@(1400.0,611.7), 1.1206@(960.3,535.7), 1.4001@(1359.9,249.9), 1.1505@(1330.1,611.7), 1.0796@(959.8,520.3).
- Camera move timings (quartic in-out fits, scale rms): S2 2.495+2.31 (0.0013; cubic 0.0029), S3 4.900+1.10 (0.0004), S4 7.300+1.00 (0.0004), S5 9.850+0.95 (0.0003), S6 12.455+0.99 (0.0005), S7 14.545+1.11 (0.0005), S9 19.750+1.00 (0.0003), S10 22.355+0.99 (0.0004), S11 24.600+1.00 (0.0002). S13 recede 29.935+0.92, quartic in, to 0.86 (0.0003). Scale holds 1.4001 from 10.83 to 12.45 s, so there is no 11.9 s move.
- Camera interpolation: the translate (x=960-lx*s, y=540-ly*s) is tweened with the same ease as the scale, not the look point. At S2 3.767 s the effective look y is 354.4 measured, 354.2 for the translate model and 401.2 for the look-point model. At 3.2 s it is 1.5579@(960.2,132.5).
- Panel interior: x 360 to 0 from 4.100 s over 0.70 s, quartic out (offset 296 at 4.133, 196 at 4.20, 92 at 4.30, 36 at 4.40, 0 at 4.63).
- Tabs: tab i starts at 2.6+0.1i (50% visible at 2.69+0.1i for i=2..13). Ticks start at 2.619+0.100i (14 of them), about 0.07 s before each tab is half visible.
- Letters: hook in stagger 0.0299 s, out 0.0076 s. Headline 2 in 0.0218 s, out 0.0080 s. The core-contrast 50% offsets (0.422, 17.871, 2.597, 19.837) give the same lag from 0.25, 17.70, 2.30 and 19.55, so those are the starts.
- Cursor dip: the tip is fixed (1414,921 on screen through the S6 click). The sampled minimum is 0.80-0.87 linear (area ratio) at t+0.067 to t+0.083. Overshoot is 1.03-1.06 around t+0.15 to t+0.17, settled by t+0.27. Clicks are at 10.55, 14.30 and 24.35 s. The S6 tip lands at world (1763, 917).
- Sound-to-action pairs: tab ticks 2.619+0.1i to tab drops 2.6+0.1i. Shortcut ticks 5.349/5.399/5.449 to key caps down about 3 world px from 5.35+0.05i (up from 5.50+0.05i, no release sound). Swap pops 7.85/8.05/8.25 to icon swaps (largest frame change at +0.2 s). Click 10.549 to dip minimum 10.633. 56 keys from 10.648 at 29.5 ms to letters 10.65-12.30 s. Enter 12.449, 0.1 s before the card leaves (12.55) and the sheet rises (about 12.60). Click 14.299 to dip 14.367-14.40. Pop 14.697 to the result toast's first frame 14.70. 40 keys from 20.550 at 32.48 ms to letters on frames 20.567 to 21.867. Enter 22.299 to card out from 22.35. Click 24.349 to dip minimum 24.433. Pop 24.746 to the toast's first frame 24.80. Folder click 26.14-26.15 to the front-snap motion spike at 26.167-26.20. Bells 28.42/28.55 to the notification's first frame 28.433 and its text sharp at 28.567. Verb hits 30.468+0.45i to the bar flips. Mark impact 32.950 to the glitch frame 32.967 and the real grow-in from 33.0.
- Verbs: accent #f79451, box y 466-607 (142 px). Box x: Mute. 788-1131, Close. 783-1136, Group. 756-1163, Save. 803-1116, Bring back. 630-1290. First orange at t0+0.033 to 0.05 from t0=30.30+0.45i.
- Colours: ground #0c0805 to #0e0a07. Top-right light median #c5723e at 0-2.4 s. Mark tile #e47420. Hook ink about #f8f2f0.
- Light, top-right 65 px corner Rec.709 luminance: 122 (0-7.5 s), 115 (8), 106 (9), 96 (10), 75 (12), 66 (14), 57 (15), 26-27 (20-20.5), 39 (22.5), 61 (24.5), 70 (27), 95 (30), 108 (31), 115 (33), 119 (35-36.9). Lit area 54% at 0 s, 46% at 2.4 s, 24-27% at 31-37 s.
- Grain: frame-to-frame correlation 0.999, the same pattern from 1 s to 37 s (0.92-0.94). High-pass std 22.5 in the lit corner, falling to about 11 where the light dims.
- End fade: cubic in from 36.95 s over 0.55 s (luma ratio 0.754 at 37.30 against 0.742 for the model). The last frame (37.467) is still at 15% of full luma.

## Corrections to the readers and to the older brief

- **S5 click at about 10.60 s, confirmed by the audio onset at 10.577 s.** The click is at 10.55 s. The press sound starts at 10.549 s. The cursor dip bottoms out at 10.633 s, which is t+0.08 for the 0.08 s dip. The spring overshoot (about 1.06) peaks at 10.70 s. (measured: I built an effects residual (film minus my own effects-free render of Appendix 3, gain -0.09 dB) and took a 3 ms envelope at 60-400 Hz. I also measured the cursor's white-blob area on every )
- **S11 pull-out is a quartic in-out from about 24.52 s for 1.12 s.** It runs 24.600 s + 1.00 s, exactly the brief's cam(24.6, 1.0, 960, 520, 1.08). It settles at 1.0796 about (959.8, 520.3). (measured: I tracked scale per frame by full-res NCC on the static panel header and fitted a quartic in-out (rms 0.0002 in scale; cubic 0.0003).)
- **S9 push-in is about 19.87 s for 0.82 s.** It runs 19.750 s + 1.00 s to 1.4001 about (1359.9, 249.9), the brief's numbers exactly. It starts under the S8 blur. (measured: full-res NCC track of the panel header from 19.93 s on (ncc > 0.9 from 20.13 s). Quartic fit rms 0.0003 against cubic 0.0009.)
- **S10 pull-out is about 22.39 s for 0.93 s.** It runs 22.355 s + 0.99 s to 1.1505 about (1330.1, 611.7). That is the brief's 22.35 + 1.0. (measured: full-res NCC track. Quartic fit rms 0.0004.)
- **S6 move runs 12.49 s + 0.94 s and agrees with the brief's 12.55 + 1.0 within about 0.06 s.** It runs 12.455 s + 0.99 s from 1.40 to 1.2508 about (1400.0, 611.7). The film starts it about 0.10 s before the brief: scale is 1.3956 at 12.70 s, where the brief model gives 1.3994. It is a pull-out, not a push-in. (measured: full-res NCC track and quartic fit (rms 0.0005).)
- **Verb hits are at 30.418, 30.871, 31.312, 31.765 and 32.218 s, each t0+0.115 to 0.12 s, between the bar wipe and the text reveal.** The hits are at 30.468 + 0.45i s, which is t0+0.168. The script has VERB_HITS = 30.3 + 0.45i + 0.17. Each hit lands on the flip: the night bar starts retracting, so orange reappears at the left (frame 30.50 shows orange at 788-986). The word itself first shows one frame later, at t0+0.233 (30.533, 30.967, 31.433, 31.867, 32.333). (measured: low-band (40-200 Hz) onsets on the film mix, plus per-frame orange and white pixel extents over 30.23-32.93 s. The reader's numbers came from the coarse audio.json onset list.)
- **The mark is first detected at 33.27 s at about 123 px, after about 0.45 s of breath following the last verb.** Frame 990 (32.967 s) shows one frame of the full-size, sharp mark (tile x 685-820, y 427-562, no glow) over the still-fading "Bring back.". At 33.000 s it is gone. The blurred grow-in is visible from 33.13 s (105 px at 33.167) and is full by about 33.5 s. This is a composition bug: the lockup is shown at 32.95 s while the mark's fromTo (immediateRender false) only starts at 33.0 s. In the picture there is no clean breath, because "Bring back." fades 32.80-33.03 s. (frames: threshold of orange pixels per frame 32.83-33.67 s, and a montage of frames 989/990/991/996 (markflash.png).)
- **S6 onsets at 14.245 and 14.327 s are the press and release.** The press is at 14.299 s. A weaker second transient follows at 14.409 s, 9.2 dB down. (measured: 2 ms envelope of the effects residual, 40 Hz-8 kHz.)
- **Headline 2 letters stagger 0.0226 s.** They stagger 0.0218 s, i.e. the brief's 0.022 (resid sd 0.0055 s). The exit stagger is 0.0080 s. (measured: core-contrast 50% crossings per glyph, regressed on the true letter index. The "oj" glyph merge is handled, and both full stops are excluded because their tiny glyphs are biased late by neig)
- **Mark hit onset at 32.903 s; S10 click onset at 24.335 s; S1 onsets at 0.244, 1.184 and 2.438 s.** The mark impact is at 32.950 s (20-200 Hz jumps from -50 to -26 dB at +0 ms). The S10 click is at 24.349 s. The bar-1 heartbeat thumps are at 0.30, 1.25 and 1.55 s. (measured: low-band envelope steps and the residual. The audio.json onset list is coarse, up to about 50 ms off.)
- **Bars 13-15 have no downbeat attack.** Bar 13 has one: an impact at 30.000 s (20-200 Hz from -55 to -32 dB within 5 ms). This matches the reader's own beat-13 line, "Impact (1.4 s) at 30.0". Only bars 14 and 15 lack a bar-line attack; bar 14's hit comes at 32.950 s. (measured: 2 ms low-band envelope printed every 5 ms around each bar line.)
- **Only the 14.391 click shows a clear release, 14.5 dB quieter; the other releases are inaudible.** All three cursor clicks have a second transient 0.107-0.109 s after the press (10.658, 14.410, 24.459 s), each 9.2-9.4 dB under the press. The 10.658 one coincides with the first typed key. (measured: 2 ms peak envelope of the effects residual, 40 Hz-8 kHz, press window t-0.005 to t+0.03 and release window t+0.07 to t+0.14.)
- **Per-beat camera: "push-in with the sheet 12.55-13.55" (beat 6), "push-in 22.35-23.35" (beat 10), "push-in 9.75-10.7" (beat 5).** Beat 6 is a pull-out, 1.40 to 1.25 over 12.455-13.445 s. Beat 10 is a pull-out, 1.40 to 1.15 over 22.355-23.345 s. Beat 5 is a push-in, 1.10 to 1.40 over 9.850-10.800 s. (measured: full-res NCC camera tracks (ft_S5/S6/S10.txt).)
- **Mark appears 32.967 (frames).** 32.967 s is a one-frame glitch flash. The real mark tween starts at 33.0 s and is visible from 33.13 s. A builder must not copy the flash. (frames: 989-1011.)
- **Ground has "a fine grain that moves" and music is "96 BPM (measured 95.7)".** The grain is static and screen-locked. It is per-pixel and scales with the light. The tempo is 96.00 BPM; 95.7 was a lag-rounding artifact. (measured: high-pass of the top-right corner correlates 0.999 frame to frame and 0.92-0.94 between 1.0 s and 33-37 s, with best circular shift (0, 0). Tempo: spectral-flux autocorrelation gives a beat )
- **Keys and clicks peak 5-10 dB over the music, and the music ducks about 4 dB under them. Clicks sound at t+0.07, and keys at t0+(k-0.5)*per, thinned above 18 per second.** There is no duck: film against the effects-free render stays within ±0.1 dB through 10.3-12.4 s and 20.5-22.0 s, where the script's duck would be -3.6 dB. Keys sit about 14-15 dB under the music's 500 ms RMS by 2 ms peak (17-19 dB by 10 ms peak). Clicks sit at -2.5, +3.6 and -0.4 dB. Clicks sound at t. Keys fall at t0+(k-1)*per with no thinning: 56 keys at 29.5 ms and 40 keys at 32.48 ms. (measured: I rendered Appendix 3 three ways myself (as written, effects 0 with duck, effects 0 without duck), compared per-50 ms gain at 60-1200 Hz, and peak-picked keys at 3-12 kHz on the residual.)
- **Prepared frames f/NNNN.jpg are at t=(N-1)*0.5 s.** They are at t=(N-1)*0.5+0.2333 s (30 fps index (N-1)*15+7). (measured: mean absolute difference against my own full decode, minimum at offset +7 for all 8 frames tested (N=1, 5, 10, 21, 25, 40, 60, 75).)

## Build spec, beat by beat (the skeptic's corrected version)

MELTINGPOT LAUNCH FILM: corrected build spec (Tabbit times kept; content per PROMPT.md table). All values come from the Tabbit film at 1920x1080 and 30 fps, with t=(n-1)/30. Evidence is in /tmp/claude-0/-home-user-Meltingpot/58cad991-129a-5851-8825-3b529f111197/scratchpad/launch/refs/work-tabbit/skeptic/ (f30/ frames, ft_S*.txt camera tracks, resid.wav effects layer, run_*/ score renders, scripts). Trust ft_S*.txt; cam_all.txt aliases in places.

GLOBAL
- Frames: 1125 at 30 fps.
- World: a 1920x1080 world element with transform-origin 0 0.
- Camera: tween {scale s, x=960-lx*s, y=540-ly*s} together with one ease. The translate interpolates, not the look point (measured at S2).
- Camera ease: quartic in-out, 8p^4 for p<0.5, else 1-(2-2p)^4/2 (GSAP power3.inOut). The one exception is the S13 recede, which is quartic in (p^4).
- Ground: #0c0a09 token, which renders as #0c0805 to #0e0a07.
- Light: two soft orange blobs, top-right and bottom-left, with a dark diagonal between.
  - Colours: corner median #c5723e (brightest #e18956), then #b85025 and #983114, rim #3a1610.
  - Drive: match the measured top-right corner luminance per beat (listed below). Do not use the brief's LIGHT array.
- Grain: one static, screen-locked, per-pixel noise field multiplied into the light (std about 22 grey levels on lit orange, about 4 on the ground). Never animate it. Drop the 24 fps tile overlay.
- Headline type: Instrument Serif 112 px, cap 81-82 px, baseline y 565, centred, ink about #f8f2f0, sentence case with a full stop.
- Letter in: per character (spaces skipped), opacity 0 to 1, y +14 to 0, blur 10 to 0 px, 0.55 s quartic out.
- Letter out: 0.45 s cubic in, y to -10, blur to 10, stagger 0.008 s.
- Cursor: a white arrow with a 1.5 px dark outline and a soft shadow, in world space, about 21x30 world px.
  - Moves: cubic in-out.
  - Click at t: scale to 0.82 over 0.08 s, cubic in, about the tip. Then back to 1 over 0.18 s with back.out(3), overshooting 1.045 at t+0.17.
  - Ring at the click point: 46 px, 2 px accent border, scale 0.4 to 1.5, opacity 0.9 to 0, 0.45 s cubic out.
  - Click sound: the script's click() (a 180+200e^-60t Hz body plus a 2.2-6.5 kHz tick) at t, then a second transient at t+0.11, 9 dB down. Level is about 0 dB against the music's 500 ms RMS.
- Typing:
  - Letter count n = round((t-t0)/(t1-t0)*len).
  - Key k (1..len) at t0+(k-1)*(t1-t0)/len, one per letter, no thinning.
  - Key sound: a 25 ms tick at 2-8 kHz, 14-19 dB under the music.
  - Enter: the same tick, about 11 dB under.
  - Caret: 2 px wide, accent colour, 7 px right of the text, blinking with a 0.417 s half-period after typing.
- Score: reuse Appendix 3 compose.py music unchanged (the film's music is that script: r 0.9998, lag 0). It is C minor, 96.00 BPM, bar 2.5 s, harmony i-VI-III-VII. Set music_gain=1 (no duck) and replace the key and mouse models with the film's ticks and click() as above.
  - Hook in odd bars only: line A (G4 C5 Eb5 | D5 C5 Bb4) in bars 3, 7, 9 and 15; line B (C5 Eb5 G5 | F5 Eb5) in bars 5, 11 and 13.
  - Master target is the film's: -14.1 LUFS integrated, LRA about 5.6, true peak -2.3 dBFS (the plan's ceiling of -1 is also met), high-pass at 30 Hz.
  - Bells with no meltingpot counterpart (5.50, 8.15, 23.20, 23.40) are dropped. Their slots stay silent.

BEAT 1 (0-2.5 s)
- Camera: world hidden, preset at 1.60@(960,114).
- Motion and type: hook letters from 0.25 s with a 0.030 s stagger; out from 2.30 s.
- Light: corner Y 122, lit area 54% shrinking to 46% by 2.4 s.
- Grain: static.
- Effects: none on the letters.
- Score: bar 1, a Cm bed low-passed at about 380 Hz with a 1.6 s attack and heartbeat thumps at 0.30, 1.25 and 1.55 s. Nothing above 4 kHz. Momentary max -27 LUFS.

BEAT 2 (2.5-5 s)
- Camera: 1.60@(960,114) to 1.00@(960,540) over 2.50 s + 2.30 s.
- Motion:
  - Browser opacity 0 to 1 over 0.6 s, cubic out, from 2.5 s.
  - Items drop i=0..13 from 2.6+0.1i: 12 px drop, 0.45 s quartic out.
  - Chip 3.6 s, bar 3.7 s, new-tab 4.0 s.
  - App interior x 360 to 0 from 4.10 s over 0.70 s, quartic out.
  - meltingpot: meltingpots.xyz loads; six notes drop into the feed.
- Light: Y 124-126, the glow shrinking to the corners.
- Effects: one tick per item at 2.62+0.1i (2.2-6.5 kHz noise, 25 ms, about 13 dB under the music). Pitched stutter of 6 pops at 4.10+0.045k, 1100 to 1850 Hz in 150 Hz steps, 30 ms each, about 8 dB under.
- Score: arp filter opening, riser landing on the 5.0 s impact, heartbeat at 2.5, 2.8, 3.75 and 4.05 s. -19.8 LUFS short-term.

BEAT 3 (5-7.5 s)
- Camera: to 1.55@(1300,330) over 4.90 s + 1.10 s.
- Motion:
  - Key caps card in at 5.05 s (0.35 s, y 10).
  - Presses at 5.35+0.05i (down 3 px over 0.07 s); releases from 5.50+0.05i over 0.14 s.
  - Out at 7.0 s.
  - meltingpot: Amy types 5R22AX into the join field. No waveform, no listening state.
- Light: Y about 125 to 121.
- Effects: a tick per key at each press (Tabbit: 5.35, 5.40 and 5.45 s). No release sound.
- Score: impact and low brass at 5.000 s; groove kicks at +0, +0.9375 and +1.25 s; claps and hats; bass on Ab; hook line A. -14.3 LUFS.

BEAT 4 (7.5-10 s)
- Camera: to 1.10@(1000,530) over 7.30 s + 1.00 s.
- Motion:
  - Three item swaps at 7.85, 8.05 and 8.25 s (out 0.22 s, in from +0.12 over 0.34 s with back.out(2.4)).
  - Reply card at 8.15 s: blur 8, y 16, 0.45 s quartic out; out at 9.7 s.
  - meltingpot: the real preview "You found Biology 101" and the click on Join Pot, re-timed to these slots.
- Light: corner dims, Y 115 at 8 s, 106 at 9 s, 96 at 10 s.
- Effects: a 1320 Hz pop at each swap, about 13 dB under.
- Score: Eb bar, no hook. -17.2 LUFS.

BEAT 5 (10-12.5 s)
- Camera: to 1.40@(1360,300) over 9.85 s + 0.95 s, then hold to 12.45 s. No 11.9 s move.
- Cursor:
  - Fades in about 9.9 s at world (1183,522).
  - Moves to the input over 10.00 s + 0.50 s.
  - Clicks at 10.55 s; fades out from 10.80 s.
- "You type" card:
  - Glass, world x 780-1410, top 222, two lines; label in Geist Mono 12 px with 0.08 em tracking; text 27 px with line height 1.3.
  - In at 10.45 s: 0.35 s, blur 8, y 12.
  - Typing from 10.65 s to 12.30 s (Tabbit: 56 characters). meltingpot: the 70-character note, so keep about 34 characters per second or stretch t1.
  - Enter at 12.45 s; card out at 12.55 s (0.3 s, blur 8, y -8).
- Light: Y 96 to 78.
- Effects: click at 10.55 s plus its +0.11 s transient; a key tick per letter; Enter tick at 12.45 s.
- Score: Bb bar, hook line B, no duck. -14.3 LUFS.

BEAT 6 (12.5-15 s)
- Camera: to 1.25@(1400,612) over 12.45 s + 1.00 s.
- Sheet: rises from about 12.60 s (y 680 to 0, 0.5 s quintic out); scrim to 50% over 0.35 s; fully up by 13.1 s. meltingpot: the organized note sheet.
- Cursor: appears at 13.3 s at (1503,762); moves over 13.35 s + 0.85 s to the button (tip at world 1763,917, right of the label); clicks at 14.30 s; fades from 14.60 s.
- Light: Y about 70 to 60.
- Effects:
  - Whoosh up at 12.65 s, about 20 dB under.
  - Click at 14.30 s (the loudest effect, about +3 dB).
  - Toast pop 990 Hz at 14.70 s, as the result toast first shows.
- Score: Cm bar, no hook. -17.4 LUFS.

BEAT 7 (15-17.5 s)
- Camera: to 1.12@(960,536) over 14.55 s + 1.10 s.
- Motion:
  - Re-layout from 14.75 s (0.85 s quartic in-out); removed items collapse over 0.6 s, cubic in.
  - Toast in from about 14.70 s, full by 14.9 s.
  - meltingpot: Amy's note lands at the top of the feed, seven notes.
- Light: Y about 57 to 31.
- Effects: whoosh down at 14.75 s.
- Score: Ab bar, hook line A, reverse swell 16.2-17.5 s. -14.5 LUFS.

BEAT 8 (17.5-20 s)
- Motion and type:
  - World blur 0 to 12 px and opacity 1 to 0.3 from 17.35 s over 0.6 s, cubic in-out.
  - Headline 2 letters from 17.70 s with a 0.022 s stagger; out from 19.55 s.
  - World back from 19.75 s over 0.6 s.
  - meltingpot: "Write it rough. Correct it together."
- Light: the minimum, Y about 26-31.
- Effects: none.
- Score: breakdown with drums out, choir, heartbeat back, riser into 20.0 s. -15.4 LUFS.

BEAT 9 (20-22.5 s)
- Camera: to 1.40@(1360,250) over 19.75 s + 1.00 s, starting under the blur.
- Motion:
  - Card in at 20.35 s.
  - Typing from 20.55 s to 21.85 s (Tabbit: 40 characters, first letter frame 20.567, last 21.867).
  - Target glow from 20.9 s; glow off at 22.3 s.
  - Enter at 22.30 s; card out at 22.35 s.
  - meltingpot: Ibrahim selects a sentence and types his correction.
- Light: Y 26 to 39.
- Effects: a key per letter; Enter at 22.30 s.
- Score: the drop at 20.000 s (impact and braam), four on the floor, Cm, hook line A. -12.3 LUFS.

BEAT 10 (22.5-25 s)
- Camera: to 1.15@(1330,612) over 22.35 s + 1.00 s.
- Motion:
  - Sheet rises from 22.45 s.
  - meltingpot: the real before and after replaces the calendar card, at 22.75 s (0.5 s, blur 10, y 24).
  - Cursor in at 23.55 s; moves over 23.60 s + 0.70 s; clicks "Send to maintainer" at 24.35 s; out at 24.6 s.
  - Toast at 24.7 s, visible from 24.80 s.
- Light: Y about 45 to 61.
- Effects: whoosh up at 22.40 s; click at 24.35 s; pop 990 Hz at 24.75 s.
- Score: Ab bar. -15.1 LUFS.

BEAT 11 (25-27.5 s)
- Camera: to 1.08@(960,520) over 24.60 s + 1.00 s.
- Motion:
  - meltingpot: Rayyan's sidebar card in at 24.9 s (0.5 s quartic out).
  - Item flights at 25.15+0.12i (0.8 s, x cubic in-out, y quartic in) only if a real item moves.
  - Settle snap at 26.15 s (0.35 s, back.out(2)).
- Light: Y 61 to 70.
- Effects: whoosh down per flight; low click() at 26.15 s, about 11 dB under.
- Score: Eb bar, hook line B. -12.2 LUFS.

BEAT 12 (27.5-30 s)
- Camera: hold at 1.08.
- Motion: meltingpot, Rayyan clicks Accept changes, then history shows version 2 and version 1. Keep these slots:
  - 27.5 s: a 0.9 s change.
  - 28.40 s: an opaque card, #1e1a17-like, x 40 to 0, blur 8, 0.45 s quartic out. It is fully opaque by 28.63 s.
  - 28.7+0.1i: return flights (0.75 s).
  - Out at 29.35 s.
- Light: Y 70 to 95.
- Effects: ticks at 27.5+0.1k only if something rolls. Bells G5 at 28.42 s and C6 at 28.55 s only on a real notification-like card. Whoosh up per flight.
- Score: Bb bar, riser 28-30 s. -15.0 LUFS.

BEAT 13 (30-32.5 s)
- Camera: the world recedes from 29.95 s over 0.90 s, quartic in, to 0.86@(960,520), blur 16, opacity 0.
- Motion: five verbs at t0=30.30+0.45i, Instrument Serif 160 px, centred. meltingpot: Join. Write. Organize. Share. Correct.
  - The accent box is #f79451, text width plus about 20 px left and 27 px right, y 466-607.
  - The accent bar scales X from 0 to 1 from the left over 0.13 s, cubic in.
  - A night bar does the same from t0+0.06 over 0.11 s.
  - At t0+0.17 the text turns visible and both origins flip to the right. The night bar goes to 0 over 0.12 s, cubic out. The accent bar goes to 0 from t0+0.20 over 0.16 s, cubic out.
  - The text hard-cuts at t0+0.45. The last verb fades from 32.70 s (0.4 s cubic in, blur 12, y -12).
- Light: Y 108 and rising.
- Effects: none. The hits are in the music.
- Score:
  - Impact at 30.000 s.
  - Kick, clap and C2 sub hit at t0+0.17 (30.47+0.45i).
  - Snare roll 31.25-32.48 s; riser to 32.48 s.
  - A 6 dB dip 32.48-32.95 s, not silence.
  - Loudest bar: -11.3 LUFS, momentary max -9.8 at 32.4 s.

BEAT 14 (32.5-35 s)
- Motion and type:
  - Lockup at 32.95 s. Set the mark to scale 0.6, opacity 0, blur 12 before revealing the lockup, so the reference's one-frame flash at 32.967 s does not happen.
  - Mark tween from 33.0 s: 0.7 s quartic out to scale 1, blur 0, glow 40 px.
  - Wordmark "meltingpot" letters from 33.35 s with a 0.07 s stagger (0.6 s each).
  - Lockup push 1 to 1.04, linear, 32.95-35.0 s.
  - Geometry at 34.0 s: tile 136-138 px centred at (748.5,494.5), gap 45 px, wordmark 136 px from ascender to baseline, whole lockup centred.
- Light: Y 115.
- Score: impact and braam at 32.950 s; Cm9 choir; bells C5+G5 at 33.00 s and Eb6 at 33.05 s; long C2. -13.2 LUFS.

BEAT 15 (35-37.5 s)
- Motion and type:
  - Lockup to y -90 and absolute scale 0.86 over 35.0 s + 0.8 s, quartic in-out.
  - Tagline (68 px serif, cap 50, top at y 649) letters from 35.3 s with a 0.022 s stagger (0.5 s each).
  - Sub-line (Geist 26 px, ink #bdb5ad, y 748-769) in from 36.1 s (0.6 s quartic out, y 10).
  - Fade to black from 36.95 s over 0.55 s, cubic in. In the reference the last frame is still at 15% luma; end the fade by 37.45 s if true black is wanted.
- Light: Y 119, lit area 24-27%.
- Score: hook line A at 0.75 gain over the Cm9 bed. Audio fade ((37.5-t)/0.55)^1.5 from 36.95 s. -13.1 LUFS.
