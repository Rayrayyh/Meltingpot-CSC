# Walkthrough film: motion components

Every part below is a vanilla port in `assets/parts.js`, driven only by the main paused timeline (contract at the top
of that file). Original sources sit in `reference/components/` with their licence texts in
`reference/components/licences/` and an index in `reference/components/urls.txt`. `reference/parts-demo.html` (12 s; copy it next to index.html to run it) exercises
every helper. Labels: fetched (downloaded from the author), looked (seen in a snapshot), measured (computed from
pixels or files), inferred (reasoned, not checked).

## Parts

| # | Technique | Reference moment | Helper | Source (author's own) | Licence, where read | 21st.dev listing |
|---|---|---|---|---|---|---|
| 1 | Headline word-by-word blur reveal | Motionfly "Docs and agents in one workspace." | `MP.blurWords` | Magic UI Text Animate, `blurInUp` by word: https://magicui.design/r/text-animate.json | MIT, magicuidesign/magicui LICENSE.md (fetched) | none found (inferred from a 404 on `@dillionverma/components/text-animate.md`) |
| 2 | Typewriter with caret, per-key events | headlines; typing into the composer and search | `MP.typeText` | Magic UI Typing Animation: https://magicui.design/r/typing-animation.json | MIT, as above (fetched) | https://21st.dev/@dillionverma/components/typing-animation |
| 3 | Cursor: move, click press 0.95, hover | every "browsing" beat | `MP.cursor.create / moveTo / click / hover / show` | Kibo UI Cursor (pointer path, name tag): https://www.kibo-ui.com/r/cursor.json; motion idea from Magic UI Pointer: https://magicui.design/r/pointer.json | MIT, Kibo LICENSE (copyright shadcnblocks) and Magic UI LICENSE.md (fetched) | https://21st.dev/@haydenbleasel/components/cursor, https://21st.dev/@dillionverma/components/pointer |
| 4 | Dot grid, static or drifting, soft halftone | Motionfly ground | `MP.dotGrid` | Magic UI Dot Pattern: https://magicui.design/r/dot-pattern.json | MIT (fetched) | https://21st.dev/@dillionverma/components/dot-pattern |
| 5 | Floating cards drifting in 3D with depth of field | Cua keycaps around the centred window | `MP.floaters` | written here; no free component does seeded 3D drift with blur by depth | ours (repo MIT) | none |
| 6 | Orbiting icons around a card | Motionfly 56 s | `MP.orbit` | Magic UI Orbiting Circles: https://magicui.design/r/orbiting-circles.json | MIT (fetched) | https://21st.dev/@dillionverma/components/orbiting-circles |
| 7 | Animated list (newest on top) and a stack that fans out | organizer output arriving; notices | `MP.stackList` (`mode: "arrive"` / `"fan"`) | Magic UI Animated List: https://magicui.design/r/animated-list.json; Watermelon UI List Stack: https://ui.watermelon.sh/r/list-stack.json | MIT both: Magic UI LICENSE.md; WatermelonCorp/watermelon-platform LICENSE (fetched) | https://21st.dev/@dillionverma/components/animated-list; Watermelon none found |
| 8 | Shimmer "thinking" text | the AI organizing step | `MP.shimmer` | Motion Primitives Text Shimmer: https://motion-primitives.com/c/text-shimmer.json | MIT by its README only (README copied from the launch film's fetch) | https://21st.dev/@ibelick/components/text-shimmer |
| 9 | Marker sweep over a corrected sentence | correction accepted | `MP.markerSweep` | Magic UI Highlighter, `highlight` action, 600 ms: https://magicui.design/r/highlighter.json | MIT (fetched); its rough-notation dependency (MIT) is not used | none found (inferred from a 404) |
| 10 | Browser window and phone mockup | the app window; the phone beat | `MP.frames.safari`, `MP.frames.iphone` | Magic UI Safari: https://magicui.design/r/safari.json; Magic UI iPhone: https://magicui.design/r/iphone.json | MIT (fetched) | https://21st.dev/@dillionverma/components/safari; iPhone none found |
| 11 | Zoom-out to a grid of many windows, as a layout move | Cua 24 s | `MP.gridZoomOut` | written here (FLIP of the hero into its cell, tiles land outward in seeded order) | ours | none |
| 12 | Word rotate; morphing text | one headline | `MP.wordRotate`, `MP.morphText` | Magic UI Word Rotate: https://magicui.design/r/word-rotate.json; Magic UI Morphing Text: https://magicui.design/r/morphing-text.json | MIT (fetched) | https://21st.dev/@dillionverma/components/word-rotate, https://21st.dev/@dillionverma/components/morphing-text |
| + | Scroll inside a window | browsing | `MP.scrollTo` | written here | ours | none |

Core: `MP.rand(seed)` (mulberry32), `MP.hash`, `MP.event(kind, t, data)` into `window.__events` on the 30 fps grid,
`MP.drivers` and `MP.applyAll(t)`, `MP.driverTween(tl, duration)` (the single apply driver plus a render at t=0),
`MP.pointOf(el, space)` for cursor targets read at build time.

## How each port departs from its source

- Timing: every source loops on timers (`setInterval`, `setTimeout`, `Date`, Motion springs). The ports use explicit
  start times on the timeline; springs became eases (Animated List's 350/40 spring is critically damped, so
  `expo.out` 0.5 s; inferred from damping ratio 40 / (2 * sqrt(350)) = 1.07).
- Brand: no gradients. Text Shimmer's moving gradient fill became a per-letter opacity wave; the marker sweep is a flat
  single-colour fill (its background image has the same colour at both stops); Safari's toolbar dots are
  `--edge-strong`, not traffic-light colours; the iPhone frame uses `--edge-strong`, `--surface-raised` and `--ink`.
- Highlighter: the flat block replaces rough-notation's hand-drawn stroke to match the flat card style. It fills all
  lines of a wrapped sentence at once (looked, 8.4 s).

## Licence decisions

- Magic UI, Kibo UI, Watermelon UI: MIT, read on the author's repo or site; keep the licence text with the sources.
- Motion Primitives: MIT by README only, as the template already records.
- React Bits (reactbits.dev, DavidHDev/react-bits): its LICENSE.md is "MIT + Commons Clause" (fetched). It allows use
  "as part of an application, website, or product" but forbids redistributing "the components themselves, whether
  alone, in a bundle, or as a ported version". A rendered video only shows the output, which the licence allows
  (inferred). But this repo is public on GitHub (origin `Rayrayyh/meltingpot-csc`) and `parts.js` is a ported
  version committed in source form, which is redistribution. So no React Bits code or source is used or saved here.
- skiper-ui: the site sells most components and states no licence for the free ones on a page we found (fetched:
  /docs/license is 404; no public repo found). Not used.
- 21st.dev: used only to confirm listings via its `.md` pages; no registry, CDN or private links were touched.

## Determinism (measured on parts-demo.html)

- Snapshot at 0.5, 2.6, 3.6, 6.6, 7.4, 8.4, 9.4, 10.2 and 11.5 s, then the same times in a shuffled order
  (11.5 first, so every later frame is a backward seek): 5 frames pixel identical, 4 frames within 1 to 7 / 255 on a
  few pixels, 0 pixels over 8 / 255.
- Same order twice: pixel identical at every time.
- Before the fix, the shuffled order left text antialiasing differences up to 144 / 255 (headline words, list items,
  the clicked button). Cause: `will-change` and GSAP's `force3D: "auto"` kept composited layers whose text raster
  depended on which frame was drawn before. Fixed by dropping `will-change`, passing `force3D: false` on 2D tweens, and
  giving click targets an identity transform at build time. Builders should do the same in their own tweens, or a
  render with several workers (each starts mid-film) can show a flicker at chunk boundaries (inferred).
- `hyperframes lint` on the demo: 0 errors, 1 warning (nested elements inside a timeline clip, same as any single-file
  composition here).
