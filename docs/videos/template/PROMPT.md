# Launch video template

**What this is.** A reusable prompt for Claude Code that makes a product's launch film (about 35 s, 16:9, 1080p) the way Rexan Wong's thread describes (x.com/rexan_wong/status/2103707054108299437):

1. Pick reference videos on whatships.com.
2. Build the film in code with HyperFrames.
3. Take UI parts from 21st.dev.
4. Dump the context and get three storyboards.
5. Approve stills before motion.
6. Let it cook, then give director's notes.

It grew out of two films: Tabbit's (a Chrome extension that controls browser tabs by typed or spoken commands; its values below are worked examples) and meltingpot's (`examples/meltingpot.md`, the first fill-in). Everything here was checked on 2026-10-02; how each fact was checked is noted where it matters.

**How to use it**

1. Copy `examples/meltingpot.md` to `examples/<product>.md` and fill every slot of PART 1. Write `none` where a slot doesn't apply. Tabbit's and meltingpot's values are examples, never defaults.
2. Open Claude Code in the product's repository and say: "Follow docs/videos/template/PROMPT.md for examples/<product>.md."
3. Claude asks its questions, proposes references (you send links and decide), and explains three storyboards. **It builds nothing until you say "start".** After that it stops at the stills and at the draft for your notes.

The kit (`kit/`) holds the tested setup and tools: the HyperFrames install and offline environment, the score composer, the grain tile, and the reference code the Tabbit film was built from.

---

## PART 1. Fill in: what belongs to the product

| Slot | What to write | Tabbit (example) |
|---|---|---|
| P1 Product | Name, end-card tagline, sub-line, one line in the maker's words, audience | "Your tabs, a command away." / "Typed or spoken. AI on your computer." |
| P2 Remember | The one thing a viewer must remember, and the abilities the film shows off | "full control of tabs (removing, grouping, adding, muting, reopening, etc.) ... Showcase scheduling and specific groups" |
| P3 Claims | True claims shipped today, each with its proof (a test, docs, a store listing); and what must not be claimed | voice and typed commands; not "works offline" |
| P4 Surface | Web app, extension, desktop or phone app; the address shown (or `none`); how to run it locally with fictional data; the theme; where its AI runs and what a capture needs | a Chrome side panel; `none`; a test build with a seeded profile |
| P5 UI route | (a) match the real app: rebuilt from components, same layout, colours and words; (b) simplified and stylised: built from components, fewer elements, motion-graphics feel; (c) real screens: the captured app as the product, components only around it. In every route, every word of the product's UI comes from the real app | (c) |
| P6 Brand | Mark (SVG or PNG), wordmark, palette tokens (`--night`, `--ink`, `--ink-2`, `--accent`, `--deep`, three light stops), icon set, the product's own fonts | rabbit-ear mark; `#0c0a09`, `#faf7f2`, `#ff9a4d` |
| P7 People | The names on screen (fictional, or with consent) | none |
| P8 References | Structure reference, tone reference, beat references (or "propose") | Koast MCP (structure), Perplexity Computer: Automations (tone) |
| P9 Format | 16:9, 1920x1080, 30 fps, length (default 37.5 s = 15 beats of 2.5 s) | 37.5 s |
| P10 Sound | Voice-over (default none); music (default composed in code to fit); captions (default none unless needed); key and mood | C minor, bold, innovative, emotional |
| P11 Type | Named fonts, or "no generic fonts; the references decide" | Instrument Serif, Geist, Geist Mono |
| P12 Repo | Output folder, decisions file, branch, commit policy, whether the repo is public | `docs/videos/launch/` |

---

## PART 2. The six steps

### Step 1. References (whatships.com)

- **Propose.** Unless P8 names them, propose 6 to 8 films and say why for each. Find them this way:
  - Parse whatships.com's category pages. It answers 200 to a browser user agent; plain curl gets 403.
  - Screen by length (25 to 60 s), 16:9, the product's UI as the hero, and no voice-over (a voice-activity detector such as Silero VAD).
  - Download each candidate's MP4 (the page's JSON-LD `contentUrl`) and measure it with ffmpeg: length, resolution, fps, loudness (`ebur128`), cuts, brightness.
  - Look at a 1 fps contact sheet, then delete every download. Keep only notes, never frames or audio.
- **The owner decides.** They send links or pick: one structure reference (how it moves), one tone reference (light, type, colour), and optional beat references.
- **Measure the picks closely**, at the depth of `examples/tabbit-measured.md` (the Tabbit film, measured):
  - frame-accurate camera tracks and their eases;
  - letter timings and staggers;
  - the tempo grid and bar lines;
  - loudness, LRA and true peak;
  - every sound effect against the action it sits on;
  - whether the music ducks.
- **Write a one-page style sheet**: what is copied from each reference, translated into the product's palette, type and surface. Gate: the owner approves it.

### Step 2. HyperFrames (the renderer)

Pinned and tested here: hyperframes 0.8.112 (Apache-2.0, Node 22 or later), gsap 3.14.2, and a static ffprobe from npm `@ffprobe-installer/linux-x64@5.2.0` (GPL-3.0; a local build tool, never committed). Run every command after `source kit/hyperframes/env.sh`.

- **Install**: `bash kit/hyperframes/setup.sh`. It installs the pinned CLI, GSAP and ffprobe next to itself (git-ignored), checks their hashes and runs `doctor`. 20 s here.
- **New project**: `kit/hyperframes/new-project.sh <dir>`, never a raw `hyperframes init`. The stock scaffold has four problems:
  - it loads GSAP from a CDN;
  - its package.json has a `publish` script;
  - it writes a CLAUDE.md and an AGENTS.md that send agents to HyperFrames' own workflows, including `npm run publish`;
  - its skill tells agents to send feedback (an upload) after every render.
- **Offline, always**:
  - Telemetry is off only with `HYPERFRAMES_NO_TELEMETRY=1` or `DO_NOT_TRACK=1`. `HYPERFRAMES_TELEMETRY_DISABLED`, which older notes use, is read by no version: with it, lint and render still try the network (6 and 10 DNS lookups, counted with strace).
  - Run renders under `$HF_OFFLINE` (no network namespace), so a missing local file fails instead of being fetched.
  - Vendor GSAP at the flat path `assets/vendor/gsap.min.js` and check its sha256 before rendering. Lint does not check the path.
- **Composition contract** (unchanged from 0.8.105):
  - one `index.html`, one stage, one paused `window.__timelines["main"]`;
  - `data-composition-id`, `data-start`, `data-duration` and `class="clip"`;
  - every time-derived state (typing, counts, the shader) driven by one `apply(t)` driver tween, because GSAP's `onUpdate` fires on seek;
  - where HyperFrames' bundled guidance disagrees (a sub-composition per scene), this text wins.
  Accept the two `nested_structure_needs_subcomposition` warnings this triggers.
- **Lint bans**: `left` motion (use `x`), template-literal selectors, `autoAlpha` on a `.clip`, `repeat: -1`, `Math.random` and other clocks, and `<audio>` without an `id`. **Render ignores lint errors unless you pass `--strict`**, so always pass it.
- **Commands**:
  - Lint: `$HF lint`
  - Gate: `$HF check`
  - Stills: `$HF snapshot --at t1,t2 --no-end --timeout 20000 --describe false -o stills`
  - Draft: `$HF_OFFLINE $HF render --strict --fps 30 --workers 4 --quality draft -o renders/draft.mp4`
  - Final: the same with `--quality delivery`
  Always pass `--workers 4`; "auto" picked 2 on 4 cores.
- **Never run** `publish`, `feedback` (including `--file-issue`), `cloud`, `lambda`, `cloudrun`, `auth`, `capture`, `tts`, `transcribe`, `models install`, `catalog --on-device`, `skills update`, or `snapshot` without `--describe false`. They upload or call paid APIs.
- **Measured behaviour**:
  - Output is byte-identical across runs, worker counts and network on or off.
  - About 0.17 s a frame for a light composition with 4 workers.
  - A full-resolution Paper Shaders grain costs about 1.26 s a frame, so about 22 minutes for 37.5 s. Budget for it, or draft with a half-resolution shader (0.39 s a frame; the grain looks different) and keep full resolution for the final.
- **Craft gotchas**:
  - Text with no transform renders with coloured subpixel edges, and a tween that settles at `x: 0` flips to that look and visibly pops. Put `will-change: transform` on the stage.
  - Put sound-synced events on the 30 fps grid (`t = round(t*30)/30`). An event between frames shows on the next frame, up to 33 ms after its sound.
  - Mark deliberate off-canvas layers (light, grain) with `data-layout-allow-overflow`.
- **Audio**: HyperFrames muxes `<audio id="score" src="assets/audio/score.wav" data-start="0" data-duration="...">` itself, in sync within 1 ms (measured). Feed it WAV so there is one AAC encode. Master the score to a true peak of about -2 dBFS, because AAC adds about 1 dB. Measure loudness and true peak on the final MP4.

### Step 3. 21st.dev components

- **Choose on 21st.dev, take the code from the author.**
  - 21st.dev's own registry needs an account: `/r/<author>/<slug>` answers "Authentication required" (HTTP 403) without a key. The free tier allows 2 copies a day and the paid plan removes the limit.
  - So use 21st.dev only to choose a component and confirm its author and licence. Its markdown pages (`https://21st.dev/@<author>/components/<slug>.md`) need no credential.
  - Download the code from the author's public registry: magicui.design/r, kibo-ui.com/r, spell.sh/r, ui.spectrumhq.in/r, vault.hyperiux.com/r, motion-primitives.com/c, ui.shadcn.com/r/styles/new-york-v4, diceui.com/r, or npm.
  - Never use 21st.dev's CDN or private-storage links, which its terms forbid getting around.
  - No sign-ups. Fetch with retry: magicui.design and vault.hyperiux.com sometimes fail TLS through a proxy.
- **Rebuild each part in plain HTML and CSS on the one timeline.** Motion and Framer animations cannot be scrubbed. Recolour every part to the P6 tokens, swap its icons for the product's icon set, and keep the author's source JSON in `reference/components/`. Commit those sources only if the repo is private, or the licence allows redistribution and its LICENSE and NOTICE go with it.
- **Licences come from the author's repo, never 21st.dev's label.** Known mismatches:
  - Spectrum UI is Apache-2.0 (21st.dev says MIT).
  - Motion Primitives is MIT by its README only.
  - Origin UI is AGPL-3.0 at its repo root, with MIT only under `apps/origin`, so skip it.
  - Kibo UI's copyright line is now shadcnblocks.
  - Hyperiux Vault components keep their `// Built using Hyperiux Vault` line.
  - GSAP is under its own standard licence, not MIT.
  - Paper Shaders keeps its LICENSE and NOTICE.
  In `NOTICES.md`, list each part's source URL, licence and 21st.dev listing. The listing link satisfies 21st's link-back clause.
- **The parts** (every source answered 200 without an account on 2026-10-02):

| Part | Component (author) | Licence | Source |
|---|---|---|---|
| Browser window | Safari (Magic UI) | MIT | https://magicui.design/r/safari.json |
| Cursor | Cursor (Kibo UI) | MIT | https://www.kibo-ui.com/r/cursor.json |
| Keys | Kbd (Spell UI) | MIT | https://spell.sh/r/kbd.json |
| "You type" card | Typing Animation (Magic UI) | MIT | https://magicui.design/r/typing-animation.json |
| Headline letters | Text Effect (Motion Primitives) | MIT (README) | https://motion-primitives.com/c/text-effect.json |
| Boxed verbs | Rectangular Text Reveal (Hyperiux Vault) | MIT + Free Core terms | https://vault.hyperiux.com/r/rectangular-text-reveal.json |
| Notices | Sonner (shadcn) | MIT | https://ui.shadcn.com/r/styles/new-york-v4/sonner.json |
| Light and grain | Grain Gradient (Paper Shaders) | Apache-2.0 + NOTICE | npm `@paper-design/shaders@0.0.81` |
| Counts | Number Ticker (Magic UI) | MIT | https://magicui.design/r/number-ticker.json |
| Sidebar, cards, rows, buttons, badges, tabs, avatars, inputs, select, textarea, progress, dialog, sheet | shadcn/ui (Sidebar, Card, Item, Button, Badge, Tabs, Avatar, Input, Select, Textarea, Input Group, Progress, Dialog, Sheet, Separator) | MIT | https://ui.shadcn.com/r/styles/new-york-v4/<name>.json |
| Chips | Pill (Kibo UI) | MIT | https://www.kibo-ui.com/r/pill.json |
| Diff styling | Diff View (Spectrum UI), as a styling reference | Apache-2.0 | https://ui.spectrumhq.in/r/diff-view.json |

  A part the product has no real use for is dropped, not repurposed. Its screen time goes to the nearest real moment, and the storyboard lists it under "Not used".
- **The product's UI, per P5.** In every route, every word of the product's UI comes from the real app. Run it locally with fictional data, script each moment the story needs, and save each moment's visible text (the kit's `reference/appendix1-capture.mjs` does this for web apps).
  - **Route (a)** builds from the app's own values, not stock component defaults: its tokens, font files, radii, paddings and icons. Gate each screen with a pixel diff against its capture (target: 99.9% of pixels within 8/255).
  - **Route (b)** simplifies: fewer elements, larger type, the same words, colours and icons.
  - **Route (c)** shows the captured screens, or replays the captured markup and CSS (`reference/appendix2-ui-to-video.mjs`).
  - **What makes a rebuild read as "not the real app"**: grey or zinc neutrals instead of the product's own; stock radii; a generic font; another icon set; colours or gradients the product doesn't use; invented copy.

### Step 4. Context dump and three storyboards

- **The dump.**
  - Brand (P6).
  - The real app's screens and their visible-text log from the local run (step 3). Never touch production data. If an AI step can't run on fictional data within budget, ask, and disclose whatever is simulated.
  - The braindump: Claude writes the flow from P2's abilities onto the 15-beat skeleton (PART 3).
- **Three storyboards**, each a different angle (for example: the AI first, the quick action first, the collaboration story first). Each is a table: #, seconds, on screen, the exact words on screen, camera and motion, built from, sound. Each also lists what is "Not used" and how every command shown was checked (ran it, or its tests).
- **Explain them to the owner**: what each shows, its trade-offs, and a recommendation. The owner picks or mixes.
- **Then wait. Nothing is built until the owner explicitly says "start".**

### Step 5. Stills before motion

Build the composition for the chosen storyboard and render a still per beat at its key moment, plus a contact sheet. Review with three lenses (product truth, design craft, legibility at 1080p), and have a skeptic re-check every finding. Fix the confirmed ones, then **stop for notes**.

### Step 6. Let it cook, then take notes

- **Motion.**
  - Push-ins of 1.15 to 1.55x on `power3.inOut` over 0.8 to 1.2 s. Moves shorter than 0.7 s read as jerks.
  - Blur dissolves of 8 to 16 px; no hard cuts; letters arrive with a short blur.
- **Score**, composed in code by `kit/audio/compose.py` (seeded, numpy and scipy; its music is the Tabbit film's, measured identical):
  - C minor (or P10's key via `TRANSPOSE`), 96 BPM, one bar per 2.5 s beat.
  - Its parts: heartbeat and arp under the opening; drums from beat 3; a breakdown under the headline; a drop at beat 9; a hit on each verb; bells on the mark.
  - Mastered to -14 LUFS integrated, with true peak at or under -1 dBFS on the final file.
  - The music is measured, never listened to.
- **Effects sit on the timeline's own events.** The composition records each event (`sound(t, kind)`) and exports `assets/audio/events.json`, which `compose.py` reads:
  - a tick per typed letter, 17 to 19 dB under the music;
  - a click per press at about the music's level, with its release 0.11 s later and 9 dB down;
  - ticks on drops, whooshes on sheets, pops on replies, a stutter as the UI arrives, bells on the mark.
  The music never ducks (Tabbit measured: within 0.1 dB).
- **Draft.** Render a draft and send it (a preview under 20 MB if the full file is too big to send).
- **Review the draft** with a multi-agent workflow: motion in beat ranges, every frame; sound and sync, measured; product truth; and reference fidelity. Verify every finding independently, then fix.
- **Final and notes.** Render the final. Then take director's notes in camera words ("slow every zoom to 0.7x", "push in on the button"): change only what each note names, re-render, and keep a changelog.
- **Deliver** to P12's folder: `final.mp4`, a poster frame, `storyboard.md`, `stills/`, the source, `NOTICES.md` and `CHANGELOG.md`. Report length, size, loudness and true peak.

---

## PART 3. The 15-beat skeleton (37.5 s, one bar each at 96 BPM)

The skeleton is the Tabbit film's, measured. The slots change per product; the timing, camera grammar and sound structure stay.

| # | Seconds | Slot | Tabbit (example) |
|---|---|---|---|
| 1 | 0 to 2.5 | Hook: a count of the clutter that equals the world shown, in sentence case with a full stop | "Fourteen tabs, and counting." |
| 2 | 2.5 to 5 | The world forms; the product arrives | 14 tabs drop into the strip; the panel docks |
| 3 | 5 to 7.5 | Quick action: the fastest real input | a voice command with the keys held |
| 4 | 7.5 to 10 | The world reacts; the real reply | "Muted 13 tabs." |
| 5 | 10 to 12.5 | The AI sentence typed, mirrored in a "You type" card | "ditch the youtube tabs and stick the github ones in a work group" |
| 6 | 12.5 to 15 | The AI's real output slides up; confirm | "Do all 2" |
| 7 | 15 to 17.5 | The result lands in the world | tabs regroup under "Work" |
| 8 | 17.5 to 20 | Headline: two short sentences with full stops | "Save a project. Get it back on time." |
| 9 | 20 to 22.5 | The second story begins (typed) | "save Trip and reopen it Saturday at 9 AM" |
| 10 | 22.5 to 25 | Its real preview; confirm | the schedule preview |
| 11 | 25 to 27.5 | What really happens meanwhile | tabs fly into a folder |
| 12 | 27.5 to 30 | The real return | "Trip is back" |
| 13 | 30 to 32.5 | Five one-word verbs in boxed reveals, only real abilities | Mute. Close. Group. Save. Bring back. |
| 14 | 32.5 to 35 | The mark, then the wordmark | the rabbit-ear mark; "Tabbit" |
| 15 | 35 to 37.5 | Tagline and sub-line; fade to black | "Your tabs, a command away." |

With more abilities to show off than beats 3 to 12 hold, two abilities may share a beat. The verbs (13) may then name abilities a beat only glimpsed, as long as each is real.

---

## PART 4. Rules

- Only true claims. Every command on screen works in today's build, and every word of the product's UI comes from the real app.
- No sign-ups, purchases, uploads or API spending without asking. Never touch production. Publish nothing.
- Record every decision the owner makes, in their words, and every deviation from this text with its reason, before acting on it.
- Label every result by how it was checked: measured, ran, fetched, looked, or inferred. Never present an inference as a pass.
- Commercially usable licences only, read on the author's own page.
- Stop at each gate: references, storyboards (then wait for "start"), stills, draft.

## PART 5. Checklist before step 4

- [ ] Every PART 1 slot is filled or `none`.
- [ ] Each ability to show off works in today's build on fictional data, or is swapped for one that does.
- [ ] The hook's count equals the world shown.
- [ ] Text on `--night` passes 4.5:1, and the mark's colour is used only for the mark.
- [ ] The references' pages still exist.
- [ ] `kit/hyperframes/setup.sh` passes on the machine that will render.

## Kit

| Path | What it is |
|---|---|
| `kit/hyperframes/setup.sh`, `env.sh`, `new-project.sh` | The pinned offline HyperFrames toolchain (step 2) |
| `kit/hyperframes/tools/offline.sh` | Runs a command with no network |
| `kit/hyperframes/tools/framehash.sh`, `sync_check.py` | Determinism and A/V sync checks |
| `kit/audio/compose.py` | The score and effects, reading `assets/audio/events.json` |
| `kit/audio/grain.py` | The seeded static grain tile |
| `kit/reference/appendix1-capture.mjs` | Captures a web app's real UI per moment (states, text, boxes) |
| `kit/reference/appendix2-ui-to-video.mjs` | Turns captures into replayable states (route c) |
| `kit/reference/appendix3-compose.py` | The original score script, unchanged |
| `kit/reference/appendix4-index.html` | The Tabbit film's composition, the worked example of the camera, type, cursor, verbs and lockup |
