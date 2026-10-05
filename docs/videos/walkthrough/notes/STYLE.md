# Walkthrough film: style contract

The build contract for the 120 s light-mode MeltingPot product film (1920x1080, 30 fps, one paused GSAP timeline). It takes its look from Motionfly V2 for Notion AI (66.4 s, 1080p30) and Cua Spaces (34.0 s, 1080p60), its typing and click sounds from the Tabbit film (37.5 s, 1080p30) (re-measured: 66.41, 33.96 and 37.50 s), and its storyline from the owner's 39 s landing film. Every fact about a reference carries how it was checked: **measured** (numbers from frames or audio), **looked** (read from dumped frames), **fetched** (read from a file), or **inferred**. Numbers without a label are this contract's choices.

Method (2026-10-05): scene cuts with ffmpeg `select='gt(scene,0.3)'`; frames at 1 fps for every film and at 3 to 6 fps around every transition (480 px JPEG); per-frame mean absolute difference on 160x90 greyscale for holds and move durations; colour, text and window boxes from full-resolution frames; ebur128 loudness; spectral-flux tempo; 3 to 10 kHz transient picking for keys and clicks.

## 0. The rules in one screen

1. Light cream stage `#faf4e6` all the way through. No full dark cards; at most one ink moment (section 5).
2. Camera scale changes stay at or under 1.12x, never faster than 0.08x per second, and never as a cut-in to a screenshot. Movement comes from a cursor, typing, scrolling, cards and words. This cap comes from the owner's "much less zoom" ask, not from the references: both references zoom hard at their peaks (Motionfly 2.3x in 0.73 s, Cua 2.8x; re-measured, see Skeptic notes), so do not copy their zoom moments at any scale.
3. Every product beat is rebuilt UI in a centred warm-white window on the stage (Cua), with a caption under it: a small Phosphor icon, then a sentence with one bold keyword.
4. Headlines build word by word in Fraunces; the newest word arrives in brand orange and settles to ink; a second line sits in muted ink (Motionfly).
5. The cursor is always doing something: moving, hovering, clicking, or leaving. UI typing is 22 characters per second with seeded jitter; headline caret typing is 14.
6. 96 BPM, 2.5 s bars, 48 bars. Scenes change on bar lines; clicks and word arrivals land on beats.
7. Sound: keys 15 to 18 dB under the music, clicks level with it, a release 0.12 s after each click (re-measured) 9 dB down (level not confirmed, see Skeptic notes), no ducking. Music only lifts twice and breaks down once.

## 1. What to take from each reference

### Motionfly V2 (Notion AI)

| Technique | Where (s) | Measured or looked | Use in our film |
|---|---|---|---|
| Caret typing on the opening word ("Meet" with a blue caret), then logo, then wordmark | 0.0 to 3.2 | looked; logo lands by 1.0, wordmark holds 2.17 to 3.20 (measured hold) | Open on "meltingpot" wordmark built from the pot mark, after one typed word. |
| Word-by-word headline build with inline UI chips ("Docs [doc card] and [Digest agent chip] agents") | 6.0 to 8.9 | looked; motion 7.40 to 8.93 (1.53 s), peak at 76% through, so ease in-out weighted late (measured) | Headlines may carry one small inline chip (a note card, a "Waiting on your review" pill) between words. |
| A word in a second colour | "Docs" blue 6.0, "in one" blue 9.7, "3.7" 27.6 | looked | Newest or key word in `#ab5a14`. No gradient (Motionfly's "3.7" is a blue-to-violet gradient: do not copy). |
| Newest word arrives coloured, then settles to ink | "to" blue at 39.93, white by 40.27; "scale." blue 41.93 to 42.27, white by 42.60 | measured from 3 fps frames: settle within 0.33 s | Word enters `#ab5a14`, fades to `--ink` over 0.35 s after a 0.3 s dwell, except the one keyword per headline that stays orange. |
| Ambient dot-field behind a hero line ("in one workspace.") | 9.0 to 11.0 | looked; motion 9.00 to 10.97 at diff 1.3 peak (slow drift, measured) | A faint dot grid in `--edge` drifting 12 px/s behind the opening and closing headlines only. |
| Tilted floating UI cards drifting past (Ask AI menu, chat, search results) | 11.0 to 13.9 | measured: 2.73 s of continuous motion, accelerating to the end (peak at 100%), then a hard cut | Cards fly through on a 6 to 10 degree tilt during the hook; exit by accelerating off frame, never by zoom. |
| Composer typing, cursor arrives as the last words type, click send | 13.9 to 15.4 | re-measured at 30 fps: the shot opens on a cut at 13.87 with 29 characters already typed; 48 by 14.97, so 18 to 19 cps, the text updating every 2 to 3 frames by 1 to 2 characters; cursor enters at 14.57 from the bottom-right corner, is within 5 px of send by 15.07 and at rest by 15.17 | The core grammar for every write action. Typing may start mid-sentence after a cut. |
| "Thinking" state | dark card 15.83 to 20.50 (spinner, "Searching your workspace...", "Read 6 pages"), and inline "Thinking..." at 26.0 | re-measured: no visible press state on send (looked at 30 fps); the cursor rests on send 15.17 to 15.57, the composer starts sliding left at 15.60, hard cut to dark at 15.87, so about 0.7 s after the cursor lands | Organizer state "Organizing your note" with the app's stirring pot, inline in the window, light. |
| Result streams in, then a board appears | 19.0 to 22.4 | looked; the board holds 22.40 to 23.37 (measured) | Organized note rises in beside the raw note. |
| Dark interstitial type cards ("New in Notion 3.7", "Write it once.") | 15.83, 27.43 to 28.20, 31 to 35.5, 58.6 to 61.9 | measured hard cuts at 15.83, 20.50, 28.20, 39.97, 44.50; re-measured dark (mean luma under 100, stage `#181818`): 15.87 to 20.53, 27.47 to 28.23, 31.83 to 35.80, 58.73 to 61.87 = 12.2 s fully dark, plus the half-dark split screen 40.00 to 44.53 (4.5 s), so "about 17 s" only if the split counts as dark | Not taken (light mode). See section 5. |
| Line-size swap ("TEACH / EVERY AGENT": line 1 shrinks as line 2 grows) | 28.27 to 28.77 | measured 0.5 s | Optional for one headline. |
| Floating card stacks (skill cards scattered, flying in from edges, then blurred behind a headline) | 29.5 to 33.3 | measured: 3.77 s, peak at 51% (symmetric in-out) | Flashcards and practice questions fly in as a loose stack for "Turn notes into practice." |
| Caret typing a headline's second line in grey ("Every agent knows how.") | 33.4 to 34.8 | re-measured at 10 fps from the line's width: first characters at 33.4, all 22 by 34.8, so 21 characters in 1.4 s = 15 cps, steady through the line. The line is centred and stays centred while it types: both edges grow outward | Use for 2 headlines at 14 cps; centre-anchored lines re-centre each character, left-anchored lines grow right only. |
| Labelled chips pointing at a headline with a small arrow ("Release notes", "Bug triage") | 36.0 to 38.0 | looked | Collaborator name chips (cursor-flag style) around "Keep the class in sync." |
| Split screen: headline on one half, live UI typing on the other | 39.97 to 44.50 | measured cut in and out; half and half (looked); right side typing about 30 cps (10 characters per 0.33 s, looked) | Use once, in light: headline on `--paper` left, window right. |
| Vertical scroll through a tall diagram inside the right half | 42.27 to 44.27 | looked; about 2 s | Scroll grammar for the history list and the teaching readout. |
| Hover menu: hand cursor over "Skills", menu opens, row highlight follows | 45.0 to 48.0 | looked; cursor move 46.97 to 47.57 (0.60 s, measured) | Hover states (section 3). |
| One push-in on the composer's first word ("What" very large) | 49.1 to 49.9 | re-measured: the composer's line box grows from 68 to 158 px between 49.10 and 49.83, a 2.3x push in 0.73 s (about 3x per second) while "What did we a" types, then a hard cut back to the normal composer at about 49.93 | Not taken: it is a zoom. |
| Phone mockup, tilted, with the same composer | 53.7 to 55.5 | measured 1.80 s move, peak at 9% (fast out, long settle) | Optional, one beat: the student's phone shows the same Pot. |
| Headline with a UI card inserted between words ("You didn't just [card] take notes.") | 55.0 to 56.5 | looked; holds 55.77 to 56.50 (measured) | Closing line can hold a small note card between words. |
| Orbit of app icons round a central card | 56.5 to 58.4 | looked | Optional: classmates' avatars orbiting one shared note. |
| Pull back to a grid of many orbits, then logo | 58.1 to 61.6 then 61.93 | measured: 3.47 s, peak at 17%; magnitude re-measured by eye on a 2 fps sheet (looked): the central card shrinks about 5x between 57.5 and 58.5, then the grid keeps receding to 61.6; logo after a cut at 61.93; logo shrinks 61.93 to 62.6 then wordmark slides out 63.07 to 63.80 (0.73 s) | Only a gentle version (section 2). Logo end taken. |
| End card: mark plus wordmark, one small line under it | 64.2 to 66.1 hold (measured 1.9 s) | measured | End on the pot mark plus "meltingpot" in Baloo 2, URL under it, 2.5 s hold. |

### Cua Spaces

| Technique | Where (s) | Measured or looked | Use in our film |
|---|---|---|---|
| Window centred on a stage | 5.5 to 24 | re-measured: window box x 469 to 1450 (51% of width) at 10 to 12 s, 476 to 1443 at 8 s, but 45.6% of width from 20 to 22 s (the dark "New Space" state); height 46 to 51%; so 46 to 51% of width, not a fixed size | Our window is 58% of frame width (1114 px) and at most 60% of height, centred, top edge at about 20% of height. Wider than Cua because our UI must read. |
| Window colour vs app inside | 7 to 21 | measured: window chrome `#eae0d4`, app surface `#fcfcfc`, stage `#020404` (stage re-measured: corner `#020404`, dominant `#010205` to `#020306` in every sampled second) | Stage `#faf4e6`, window chrome `--sunken` `#f2e9d4` (corrected: `#f3ead6` is not an app token; fetched from web/app/globals.css), app surface `#fffdf6`. |
| Caption under the window: small icon, then a sentence with one bold keyword | 6.13 ("Teleport"), 7.3 ("any app"), 13 ("Go **multiplayer** with your agents"), 17 ("Turn spare computers into **infinite desktops**") | measured: one line 875 to 931 px (icon included), two lines 856 to 903 and 915 to 965 (59 px pitch), text `#fbfcfc`, centred, about 80 px under the window | Caption at y 880 to 960, Inter 500 at 38 px (3.5% of height), keyword Inter 700 in `--ink`, rest in `--ink-muted`, Phosphor icon 32 px in `#ab5a14`. |
| Caption builds in two parts: keyword first, rest of the sentence about 1.2 s later | 6.13 then 7.3; 16.9 then 17.9 | looked | Same: icon and bold keyword on the beat, tail of the sentence 2 beats later (1.25 s), each part rising 12 px with a 6 px blur over 0.35 s. |
| Title in plain white over the stage, two lines building | 1.0 to 4.8 | looked: line 2 joins at 2.0 | Opening headline builds line by line too. |
| Title fades as the window dissolves up from black | 5.10 to 5.62 | re-measured at 60 fps: 0.52 s, peak at 5.45 (68% through). The title fades over 5.10 to 5.45, then the window appears by opacity alone over 5.45 to 5.62 at its final size and place: no rise, no scale (looked at 20 fps); keycaps keep settling to 6.05 | Section transitions between product beats: outgoing window content fades and the next window's content rises in 0.45 to 0.5 s, while the stage never moves. (The rise is our addition; Cua uses opacity only.) |
| Floating 3D keycaps that re-form into a ring, then into giant arrow cursors, then into columns | 0 to 33 | measured: never still, frame difference 0.1 to 0.2 every frame at 60 fps; hold share only 12% | Ambient props: flat paper "note cards" and Phosphor-icon keycaps in cream and one orange, drifting 6 to 12 px/s with 2 to 4 degree rotation. They re-form around the window per section. No 3D render needed: flat cards with `--shadow-raised`. |
| Props shaped like the action (keycaps form two big arrow cursors for "multiplayer") | 11 to 16 | looked | Optional: note cards form a pot outline around "The class knows more together." |
| Cut on change of section with a short flash of the old window | 15.93 to 16.40 | measured 0.47 s, peak at 36%; re-measured: main change 15.90 to 16.40, peak 16.12 (about 40%); the caption fades first (15.93 to 16.00), the window content cross-fades 16.13 to 16.40, and the keycaps go on re-forming until about 16.98 | Section changes swap the props layout in 0.5 s while the window content swaps. |
| Zoom out to a grid of many windows | 22.4 to 27.2 | measured: 1.70 s pull back, then a 1.75 s acceleration ending in a cut at 27.23 (peak diff 68); magnitude re-measured from the central window's edge: 45.6% of frame width at 22.1, 31% at 24.0, near hold to 25.1, about 16% by 26.9, so a 2.8x pull back (0.36x) in two pushes | Taken only as a slow pull back to at most 0.89x showing several classmates' windows (section 2). |
| End: line in a light weight with one italic or bold word, product name, a white pill button, URL | 27.6 to 34.0 | looked; holds 29.43 to 32.98 (measured) | End card: "The class knows more together." then mark plus wordmark, a pill "meltingpots.xyz" in `#ab5a14` with `--on-primary` text. |

### Owner's landing film (storyline base, not the look)

- 39.0 s, light cream `#fbf2e3` sampled (measured), Fraunces headlines, 120 BPM (measured), -20.6 LUFS, LRA 1.1 LU (measured).
- 75% of its frames are still, with holds up to 3.05 s (measured). The new film must move far more: target under 25% still frames, and no still hold over 1.2 s.
- Take its eight lines as the chapter titles (section 6). Do not take its layout.

## 2. Transitions that are not zooms

Measured in the references, in order of how often the new film should use them.

| Transition | Reference and timing | Spec for our film |
|---|---|---|
| Hard cut on action (a click sends, the next scene answers) | Motionfly 15.83 (0.6 s after the send click), 20.50, 28.20, 39.97, 44.50 (measured) | Cut on the frame after a click's press bottom (t + 0.08 s) or on a bar line. Up to 8 in the film. |
| Type-on and word build | Motionfly 6 to 9, 33 to 37, 39.9 to 42 (looked); words about 0.17 to 0.33 s apart | Words every 0.156 s (a sixteenth at 96 BPM) to 0.3125 s (an eighth); each from y +24, blur 6 px, opacity 0, over 0.4 s on `power3.out`. |
| Content swap inside a still window (dissolve plus rise) | Cua 5.10 to 5.62 (0.52 s, peak at 68%, opacity only, no rise), 15.90 to 16.40 (0.50 s) (re-measured) | 0.45 s: old content fades and drops 8 px on `power2.in` over 0.2 s; new rises from y +16 on `power3.out` over 0.35 s, overlapping by 0.1 s. |
| Scroll inside a window | Motionfly 42.27 to 44.27 (about 2 s, looked); Motionfly 3.2 to 6.3 doc stack scroll, 3.13 s, peak at 16% (measured) | Scroll by the cursor's wheel: 300 to 900 px in 0.9 to 1.6 s on `power2.inOut`, a 0.15 s ease-in head; content under the cursor gets hover states as it passes. |
| Cards flying in from the edges, scattered and slightly tilted | Motionfly 29.5 to 33.3 (3.77 s, symmetric) (measured) | Each card 0.6 to 0.8 s on `expo.out`, staggered by 0.078 s (a 32nd), tilt -8 to 8 degrees, landing tilt under 4 degrees. |
| Push from below (a sheet or panel rises into place) | Motionfly 19.0 board, 53.7 phone (1.8 s, fast start, long settle; measured) | 0.6 to 0.9 s on `power4.out`, from 120 to 420 px below, with 4 px vertical blur in the first third. |
| Split screen in and out | Motionfly 39.97 to 44.50 (hard cuts, measured) | Once. A paper half slides in from the left over 0.5 s on `power3.inOut`; the window shifts right 25% at the same time. |
| Words exit one by one, leaving the last word, then cut | Motionfly 44.27 ("scale." alone) (looked) | Exits: whole line fades and lifts 10 px in 0.25 s, or leave the keyword for one beat before the cut. |
| Blur hand-off | Motionfly 31 to 33 (cards blurred behind "Skills"), 59 to 61 (orbits blurred behind the line) (looked) | Behind a headline, blur the window to 10 px and drop it to 35% opacity over 0.4 s. Use this rather than a dark card to give a headline a clean ground. |
| Logo resolve | Motionfly 61.93 to 63.80: mark shrinks, wordmark slides out from behind it (0.73 s, peak at 27%; measured) | Pot mark lands, shrinks to 60% over 0.5 s on `power3.out`, then "meltingpot" slides out to its right over 0.6 s. |

**Camera scale limit.** The only allowed scale changes:

- a slow push of 1.00 to at most 1.06x across a whole product beat (6 to 10 s), linear or `sine.inOut`, as an ambient drift;
- one pull back for "Keep the class in sync." from 1.00 to 0.89x (1 / 1.12) over 2.5 s on `power2.inOut`, revealing classmates' windows around ours (Cua's grid, gentled a long way: Cua's own pull back is 2.8x, 45.6% to about 16% of frame width over 22.4 to 26.9 in two pushes, then a cut; re-measured).

Never above 1.12x in either direction, never faster than 0.08x per second (the pull back runs at about 0.045x per second, inside that limit), no push-ins on a word or a button (Motionfly's 2.3x push at 49.1 is not taken), no zoom as a transition. Emphasis comes from the cursor, highlights and colour instead.

How much the references zoom (re-measured): Motionfly has three big scale moments, the 2.3x push in 0.73 s at 49.1, the orbit pull back of about 5x at 57.5 to 58.5 continuing to 61.6 (looked), and a hard-cut crop from the full board to the composer at about 3x near 23.4 (looked); Cua has one, the 2.8x grid pull back. Everything else in both films holds scale. So the references are not low-zoom films; they are mostly still-camera films with a few violent zooms. We keep the still camera and drop the violent zooms.

## 3. Cursor and typing grammar

**Cursor (Motionfly measured and looked; Tabbit from fetched notes).**

- Shape: macOS-style arrow, `--ink` `#24222c` fill, 2 px `#ffffff` outline, shadow `0 2px 6px rgba(36,34,44,0.18)`. Motionfly's cursor is 66 px tall at 1080 against UI text whose line box is 45 px (measured at 15.0 s; height re-measured 67 px at 15.25 s). Ours: 52 px tall, since our UI is drawn at about 1.6x.
- Hand pointer over anything clickable (Motionfly 45 to 48, looked): swap arrow to a Phosphor hand at hover entry, back on exit, no animation on the swap.
- Speed (corrected, re-measured at 30 fps from the cursor tip): Motionfly's cursor enters at the bottom-right corner already moving at about 2,450 px/s and slows every frame (1,150 px/s at 14.77, 580 px/s at 14.90), so its curve is ease-out with no visible ease-in; it travels 566 px in 0.60 s (about 940 px/s average), is within 5 px of send by 15.07 and at rest by 15.17, a settle of about 0.3 s, not 0.17 s. The earlier "378 px in 0.33 s, 1,100 px/s peak" came from 6 fps frames and understates the peak by about half. Ours: moves that start at rest inside the frame take 0.45 to 0.75 s on `power3.inOut`, peak 900 to 1,400 px/s; entrances from a frame edge take 0.5 to 0.65 s on `power3.out` (or `expo.out`), starting at 1,800 to 2,500 px/s, to match the reference.
- Path: nearly straight in Motionfly (looked). Ours: a quadratic arc whose control point sits 8% of the distance off the straight line, always bowing the same way within a scene.
- Entrance: from a frame edge, already moving, while the last words type (Motionfly 14.57 during typing, measured). Exit: drifts off-frame down and right after a click while the result appears (Motionfly 26.6 to 27.3, looked).
- Idle: never fully still for more than 1 s; a 3 to 6 px drift on `sine.inOut` while reading.
- Click: cursor dips to 0.88 scale over 0.08 s (`power2.in`) and returns over 0.18 s (`back.out(2.5)`); the pressed control scales to 0.96 and takes its `--primary-active` colour for 0.12 s, then changes state. No ring, no ripple. (This press feedback is our choice: Motionfly's send button shows no press state at all, looked at 30 fps over 15.4 to 15.83; the click is read from the next motion.) The click sound sits at the press (section 7).
- Hover: buttons take `--primary-hover`, rows take `--primary-soft` fill (Motionfly's menu row highlight follows the cursor, looked at 47.0), 0.12 s.
- Focus: the composer gets a 2 px `--focus-ring` `#e0761a` outline as typing starts (Motionfly's composer outline turns blue at 45 to 46, looked).

**Typing.**

- UI typing: Motionfly 18 to 19 cps on its first composer (re-measured: 29 to 48 characters, 13.87 to 14.97) and about 28 to 30 cps later (looked); Tabbit about 31 to 34 cps by its key spacing (fetched: keys every 29.5 and 32.5 ms in launch/notes/TABBIT.md) and about 37 to 40 cps on screen (re-measured by counting characters on a 2.5 fps sheet: 9 at 10.4 s, 25 at 10.8, 41 at 11.2, 56 at 11.6, all 64 by 12.0). Ours: 22 cps base, the slow end of the references, so every word reads. Each character's gap is 1/22 s times a seeded factor in 0.7 to 1.3; add 0.12 s after a comma and 0.2 s after a full stop. Deterministic: a fixed seed per string.
- Headline caret typing: Motionfly 15 cps on "Every agent knows how." (re-measured, 33.4 to 34.8, centred line growing both ways) and about 11 cps elsewhere (looked). Ours: 14 cps, no jitter, two headlines only.
- Mono raw text: the student's raw note types into a plain composer in Inter 400 (the app's own field). The organized note never types; it streams in by line (0.08 s per line, rise 6 px) to show it is the organizer's output.
- Caret: 2 px wide, full line height, `#ab5a14`; solid while typing, blinking 0.3125 s on and 0.3125 s off (an eighth at 96 BPM) once idle; 3 px for headlines. Motionfly's caret is a blue bar of the same kind (looked).
- Send: the send button is grey while empty and fills with `--primary` on the first character (Motionfly's blue send fills when text exists, looked 25 to 26).
- Overlap: the cursor starts moving to the next control while the last 6 to 10 characters type.

## 4. Typography

Measured on Motionfly full-resolution frames (heights are the ink band from ascender to descender, as a share of 1080):

| Role | Motionfly | Ours |
|---|---|---|
| One-line hero ("in one workspace.") | band 16.6% (179 px), so the type is about 17% of height (re-measured: rows 466 to 644, 179 px, x 195 to 1725, steady 9.5 to 10.5 s) | Fraunces 600, 150 px (13.9%), tracking -2%, `opsz` 144 (and `SOFT` 50 if the bundled file carries that axis). Never more than 4 words. |
| Two-line statement ("Write it once. / Every agent knows how.") | 8.6% and 10.6% bands, line pitch 12.2% (132 px) (line 1 re-measured: 91 to 93 px, 8.4 to 8.6%, at 33.9 and 35.0 s) | Fraunces 600, 104 px (9.6%), line height 1.12, tracking -1.5%. Line 1 in `--ink`, line 2 in `--ink-muted` `#5c5952` (Motionfly's grey second line, looked). |
| Kicker over a headline ("TEACH") | 5.3% | Inter 600, 30 px, tracking 6%, sentence case, `#ab5a14`. Used at most 3 times. |
| End card sub-line | 2.6% | Inter 500, 28 px, `--ink-muted`. |
| UI text inside the window | composer line box 4.2% (so Motionfly draws its UI at about 2.8x, inferred) | App UI at 1.6x: body 22 to 26 px Inter, note bodies Source Serif 4 at 26 px. Must read at 1080. |
| Captions under the window | Cua one line about 4.4% band with icon | Inter 500 38 px, keyword Inter 700 (section 1). |

- Line breaks: break on meaning, one phrase per line, never one word alone on line 2 (both references, looked).
- Second colour: one word per headline in `#ab5a14`; the newest word passes through orange and settles to ink in 0.35 s (Motionfly measured). Never a gradient, never violet.
- Wordmark: "meltingpot" lowercase in Baloo 2 700 only on the opening and end.
- Copy: sentence case, no em dashes, no emojis, no numbers the film invents.

## 5. Light palette for the stage

- Stage: `--paper` `#faf4e6` (Motionfly's equivalent is a warm grey `#f5f3ef` to `#f6f4f2`, white type cards `#fdfdfd`, dark cards `#181818`; re-measured as the dominant colour at 19 sampled seconds). Cua's stage is near-black `#020404` and its frames are dark 93% of the time (re-measured), so only Cua's window-on-stage layout carries over, never its stage colour.
- Window chrome: `--sunken` `#f2e9d4` (corrected from `#f3ead6`, which is not an app token; fetched from web/app/globals.css) with a 1 px `--edge` `#ede3cc` border, 18 px radius, shadow `0 24px 60px rgba(62,45,30,0.10), 0 2px 6px rgba(36,34,44,0.06)`. App surface inside: `--surface` `#fffdf6`; raised cards `#ffffff` with `--shadow-card`.
- Ink `#24222c`, muted `#5c5952`, faint `#756f5e`.
- Accent use: `--primary` `#ab5a14` for the caret, the one headline keyword, primary buttons, caption icons and the end pill; `--primary-soft` `#fbead3` for hovers and the organizer's highlight; `--focus-ring` `#e0761a` for focus only. Functional colours (`--success` `#43804c`, `--pending` `#9a6a16` with their soft fills) only for statuses, additions and removals.
- Props (Cua keycap equivalents): cream note cards `#fffdf6` and keycaps in `--sunken` `#f2e9d4`, one in `#c36514` (`--clay`) per scene, `--shadow-raised`.
- Dark moments: Motionfly uses about 17 s of dark in 66 s to mark "the AI is thinking" and chapter breaks; Cua is dark throughout (measured). The owner asked for light mode, so the default is none. If one contrast reset is wanted, allow a single ink `#24222c` split panel for at most 2.5 s, behind the organizer's thinking line, and nowhere else. Otherwise give headlines a clean ground with the blur hand-off (section 2).
- No gradients except inside the pot mark.

## 6. Pacing, beat grid and scene budget

**Measured pacing.**

| | Motionfly | Cua | Tabbit | Owner's film |
|---|---|---|---|---|
| Length | 66.4 s | 34.0 s | 37.5 s | 39.0 s |
| Tempo | 95 BPM | 88 BPM | 96 BPM | 120 BPM |
| Detected hard cuts | 9 | 1 | 0 | 0 |
| Distinct scenes (looked) | about 30, about 27 per minute, 2.2 s average | 6 sections, about 5.5 s each | 9 | 8 |
| Still-frame share | 21% (re-measured 25% at diff under 0.1, 31% under 0.2) | 12% (re-measured 16% at diff under 0.1, 42% under 0.2) | 25% | 75% |
| Longest hold | 1.1 s (1.9 s end) | 1.6 s (end) | 1.4 s | 3.05 s |

Music lifts (measured RMS per 0.5 s): Tabbit rises from about -30 dBFS to -14 at 5.0 s as the product appears; Cua jumps from -20 to -7 at 4.8 s as the window arrives; Motionfly is flat (LRA 1.5 LU) with one dip of 6 to 7 dB from about 51 to 58 s under the answer and phone, then back up for the orbit and logo.

**Beat grid: 96 BPM.** Beat 0.625 s, bar 2.5 s, 48 bars in 120 s, phrases of 4 bars (10 s). Motionfly (95) and Tabbit (96) already sit here (measured). Scene changes on bar lines; word arrivals on sixteenths (0.156 s); clicks on beats.

**Scene budget (about 34 scenes, about 17 per minute, average 3.5 s; product beats long, type cards short).**

| Bars | Time (s) | Chapter | Scenes | Main grammar |
|---|---|---|---|---|
| 1 to 2 | 0 to 5 | Hook: "Study at the speed of thought." | 2 | Caret types "Study", line builds word by word over a drifting dot field; note cards drift past. Music quiet. |
| 3 to 4 | 5 to 10 | Brand | 2 | First lift at 5.0. Pot mark and wordmark; tilted UI cards fly through. |
| 5 to 8 | 10 to 20 | Join with a class code | 4 | Window rises; cursor types the six-character code key by key; Pot preview swaps in; click "Join Pot". Caption: icon, "**Join** with a class code". |
| 9 to 12 | 20 to 30 | "Write it down. Keep moving." | 3 | Headline (2 lines, caret on line 2), blur hand-off, composer typing a raw note at 22 cps, cursor arrives as it ends. |
| 13 to 18 | 30 to 45 | AI organizing | 5 | Click "Organize"; thinking line with the stirring pot; organized note streams in beside the raw one ("both kept" in the caption, keyword bold); hover over a change; click "Share with class". |
| 19 to 22 | 45 to 55 | "Good notes get better." | 3 | Select a sentence, type the correction, click "Send to maintainer"; content swap to the maintainer's review; click accept. |
| 23 to 24 | 55 to 60 | "Every change has a history." | 2 | Scroll the history list under the cursor. |
| 25 to 28 | 60 to 70 | "Keep the class in sync." | 3 | The one pull back to 0.89x: classmates' windows around ours; name chips point at the headline. |
| 29 to 32 | 70 to 80 | "Turn notes into practice." | 4 | Flashcards fly in as a stack; click flips one; a practice question is answered by click. |
| 33 to 38 | 80 to 95 | Teaching readout | 3 | Breakdown: music drops 6 dB. Split screen once (headline left, readout right); slow scroll through the readout; cursor hovers the rows. |
| 39 to 42 | 95 to 105 | "Find it when it matters." | 2 | Second lift at 95. Search typing at 22 cps, results drop in, click one. |
| 43 to 46 | 105 to 115 | "The class knows more together." | 2 | Props form round the window; line builds; the window blurs behind it. |
| 47 to 48 | 115 to 120 | End | 1 | Logo resolve, wordmark, URL pill, 2.5 s hold, music tail. |

Headlines hold 1.0 to 1.5 s after the last word lands (Motionfly holds 0.5 to 1.1 s, measured); product beats keep moving throughout with no still hold over 1.2 s; the end holds 2.5 s.

## 7. Sound

**Measured.**

- Loudness: Motionfly -22.2 LUFS (LRA 1.5), Cua -12.0 LUFS (LRA 4.4), Tabbit -13.6 LUFS (LRA 5.8), owner's film -20.6 LUFS (LRA 1.1).
- Tabbit typing: two bursts, 10.31 to 12.07 s (1.76 s) and 20.57 to 21.89 s (1.32 s). In those windows 3 to 10 kHz peaks sit about 10 dB over the window RMS, against 0 to 3 dB outside them; 10 to 11 transients per second resolved at 12 ms (measured here; re-measured: that count is detector-limited, a 1 ms onset detector finds 14 to 24 onsets per second in 10.3 to 12.1 s with a 27.5 ms median gap at its most sensitive, which agrees with the fetched one key per character). The earlier residual study fetched from docs/videos/launch/notes/TABBIT.md found one key per character (29.5 and 32.5 ms apart), 14 to 19 dB under the music's 500 ms RMS, and no ducking.
- Tabbit clicks: press plus a release 0.12 s later at 14.36/14.48 and 24.41/24.53 (re-measured: 0.118 s both times; in the 3 to 10 kHz band the release peak is level with the press, +2.0 and +0.4 dB, so the 9 dB figure below is not confirmed in that band); the earlier study measured the release 9.2 to 9.4 dB under the press and clicks within -2.5 to +3.6 dB of the music RMS (fetched). Short shortcut-key presses at 5.39 to 5.66 (measured).
- Density in Tabbit: 2 typing bursts and 3 to 4 clicks in 37.5 s, so about one typing burst and one click per 10 s (measured).
- Motionfly and Cua: no keystroke or click train I could separate from the music. Their high-band transients run about 10 per second in typing and non-typing windows alike and fall on the beat grid (measured), so their UI moments are carried by the music alone (inferred). Cua's music drops at 4.8 s on the window reveal (measured).
- No separate whooshes or risers were found in any of the three (inferred from the transient lists; each lift is the music itself).

**Rules for our mix.**

- Target -14 LUFS integrated, true peak at or under -1 dBTP, 48 kHz stereo.
- Keys: one per typed character from `assets/audio/sfx/key_*.wav`, rotated with seeded variation (pitch ±3%, gain ±1.5 dB), 15 to 18 dB under the music's 500 ms RMS. Above 25 characters per second, keep every key but drop each one by 2 dB.
- Clicks: `click_*.wav` at the press, level with the music RMS (0 to +2 dB); a release 0.12 s later (corrected from 0.11, re-measured), 9 dB down full band; keep its top end (3 to 10 kHz) near the press level, as in Tabbit. `enter_*.wav` for sends.
- No ducking. Under typing the music's own hats thin out (arrangement, not a sidechain).
- Density: about 10 typing passages and 25 to 35 clicks in 120 s; no more than one click per beat.
- Lifts: quiet open (-24 LUFS short-term) to 5.0 s; first lift at 5.0 s on the brand; breakdown down about 6 dB from 80 to 95 s for the teaching readout; second lift at 95 s; final hit on the logo at about 115 s, tail out by 120.
- Whooshes: none by default. If a card flight needs one, a soft filtered air sweep 18 dB under the music, at most 4 in the film.

## 8. Components with free licences

Rebuild these by hand in the composition (no runtime fetches); check each licence at the source before copying code:

- Magic UI (MIT): `typing-animation`, `blur-fade`, `orbiting-circles` (classmates' orbit, optional), `dot-pattern` (hook background), `animated-list` (history rows), `pointer` and `smooth-cursor` (cursor reference).
- React Bits (MIT plus Commons Clause; ok for a non-commercial film, inferred): `SplitText` and `BlurText` for word builds, `ScrollStack` for the flashcard stack, `TextType` for caret typing.
- 21st.dev community components: licences vary per component, so use only those marked MIT.
- skiper-ui and watermelon-ui: use for reference only unless the component page states a free licence.

All motion stays inside the one paused timeline: no CSS animations, no `requestAnimationFrame`, every state a function of time.

## Skeptic notes

A second pass on 2026-10-05 re-measured the claims builders lean on hardest, straight from the three videos (30 and 60 fps full-resolution frames, 1 ms audio envelopes). Each re-check is marked "(re-measured)" above. What held, what moved, and what to watch:

- **Held.** Durations and frame rates; Motionfly's stage `#f5f3ef`, `#fdfdfd` and dark `#181818`; Cua's `#020404`; the hero band (179 px) and the two-line band (91 to 93 px); composer typing at 18 to 19 cps; headline caret typing at 15 cps; Cua's caption band (882 to 931 px, about 90 px under the window); Tabbit's click release spacing (0.118 s); Motionfly's cursor height (67 px). All measured.
- **Corrected: cursor speed.** Motionfly's cursor peaks near 2,450 px/s, not 1,100, and its entrance is ease-out from the frame edge with a 0.3 s settle (measured at 30 fps). Edge entrances now use `power3.out`; in-frame moves keep `power3.inOut`.
- **Corrected: Cua's window is not a fixed size.** It runs 46 to 51% of frame width depending on the section (measured). Ours stays at 58% by choice.
- **Corrected: Cua's first transition** is 0.52 s and opacity only, title out then window in, with no rise or scale (measured and looked). Our rise of 16 px is an addition, kept because it reads on a light stage.
- **Corrected: the click's release** follows at 0.12 s, not 0.11 (measured). The 9 dB release level comes from a fetched note and does not show in the 3 to 10 kHz band, where the release is level with the press (measured).
- **Corrected: Motionfly's dark time** is 12.2 s fully dark plus 4.5 s of half-dark split screen (measured). "About 17 s" only holds if the split counts as dark.
- **Corrected: the window chrome colour.** `#f3ead6` is not in the app's palette; use `--sunken` `#f2e9d4` (fetched from web/app/globals.css). All other tokens in section 5 match the app's light theme (fetched).
- **Added: how much the references zoom.** The earlier draft never stated it. Motionfly pushes 2.3x in 0.73 s at 49.1 (measured), pulls back about 5x at 57.5 to 58.5 (looked) and crops about 3x by hard cut near 23.4 (looked); Cua pulls back 2.8x over 22.4 to 26.9 (measured). Between those moments both films hold scale. The 1.12x cap is the owner's ask, not a reference-derived number; do not loosen it by pointing at the references.
- **Threshold-dependent.** Still-frame shares (section 6) move by 5 to 30 points with the difference threshold (measured), so treat "under 25% still" as a direction, not a gate, unless the same threshold (diff under 0.1 on 160x90 grey) is used for our render.
- **Not re-checked.** The 0.33 s colour settle of a new word, the dot-field drift, the line-size swap (0.5 s), the beat tempos and the loudness figures stand as first measured.

**Against the owner's asks** (light mode, the correct palette, much less zoom, more typing and clicking, browsing animations, the two references):

- **Conflict, light mode.** Rule 1 and section 5 still allow one ink `#24222c` split panel for up to 2.5 s. The owner asked for a light film; recommend not using it and relying on the blur hand-off (inferred from the ask).
- **Risk, much less zoom.** Section 2 allows a slow 1.00 to 1.06x push across a whole product beat. Applied to every product beat, the camera would be zooming for most of the 120 s, which reads against "much less zoom motion" even at this speed. Recommend at most three product beats with the drift, never two in a row, and none on beats where the cursor is already travelling (inferred from the ask). The single 0.89x pull back for "Keep the class in sync." is the film's one deliberate scale move.
- **Palette.** Fixed above (window chrome). No purple, no gradient outside the pot mark, and no em dashes in this file (fetched).
- **Typing, clicking, browsing.** Covered: about 10 typing passages, 25 to 35 clicks, scroll grammar, hover states, cursor always moving. UI typing at 22 cps is the slow end of the references (18 to 40 cps), so it reads, but it is not "fast"; do not slow it further.
- **The two references.** Followed for layout, type and grammar. Two Motionfly habits are correctly left out: the dark cards and the zooms. Cua's dark stage is correctly left out.
