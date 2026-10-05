# Walkthrough film: decisions

## 1. The brief (owner, 2026-10-05, about 02:00 UTC)

In the owner's words: "Make a light mode version. Reduce the zoom motion, and use other browsing animations. Use the
typing and clicking sound effect from this video [tabbit.mp4]. Show more of that too. Redo with the new references,
completely brand new: https://whatships.com/videos/motionfly-v2/, https://whatships.com/videos/cua-spaces/. Ensure that
you use the correct color palette. Take the demo video on https://meltingpots.xyz/#demo, and apply the ui changes and
conform to references."

Answers to the clarifying questions, in the owner's words:

- What it is for: "2 minute video covering everything".
- Which UI: "Follow the references, use components with free licenses from 21st.dev, magic ui, skiper-ui,
  watermelon-ui, reactbits.dev, etc."
- The Tabbit sounds: "Lift the exact samples" (offered against recreating them, with the note that they are another
  company's audio in a public submission).
- What it covers: "Landing beats plus AI": the landing film's storyline (write, correct, history, calendar, flashcards,
  search) plus the AI organizing step and the teaching readout.

## 2. How the sounds were lifted (measured)

The two Tabbit uploads, `2b591a98-tabbit.mp4` and `d42db48f-tabbit1.mp4`, carry the same music, sample aligned (gain
0.99 to 0.995, best lag 0; residual -38 to -50 dB in passages with no effects). Subtracting the second from the first
leaves the effects alone, so the samples in `assets/audio/sfx/` have no music under them. `catalog.json` lists each
sample with its source time: keystrokes from the two typing passages (10.3 to 12.0 s and 20.5 to 21.8 s), the
shortcut keys at 5.35 s, the two cursor clicks on buttons (14.3 s and 24.35 s), the two submit presses, the soft
ticks at 2.6 to 3.9 s, and the four transition hits.

## 3. The class and its data: Biology 101 (2026-10-05)

The landing film tells its story with an AP Calculus BC class ("Improper integrals"). The UI inventory found that no
organizer output, Worth checking panel, correction, flashcard, practice test or readout exists for that data anywhere in
the app or its captures, while run 4 recorded every one of those screens for the seed class Biology 101 (UI-SPEC
section 1). The film keeps the landing film's storyline and chapter lines and shows Biology 101, so every word inside
the window is the app's own. Swapping to calculus later means writing every AI output fresh, as example data.

## 4. How the film is built (2026-10-05)

- Rebuilt UI, not screenshots: the owner asked to follow the references, which rebuild crisp UI and drive it with a
  cursor. Each screen is HTML on the app's light tokens (`assets/ui-light.css`), shown at 1.5x in a centred window, with
  a slim top bar, the collapsed nav rail and the content column (the app's "focused view"; inferred, not a real app
  mode). The film's last card says the screens are recreated with example class data.
- Four chunks built in parallel against one kit (`assets/film.js`): A hook, brand, close and end; B join, write,
  organize, share; C correct, review, history, sync; D practice, readout, search. Hand-off rules are in STORYBOARD.md.
- Motion rules from STYLE.md: no zoom transitions; the only camera moves are one pull back to 0.89x for "Keep the class
  in sync." and no push over 1.06x. Movement comes from the cursor, typing, scrolling, page swaps, word builds and props.
- Music: `tools/score.py`, a new 96 BPM score in F major on the storyboard's chapters (lift at 5.0, breakdown about
  6 dB down for the readout at 85 to 95, lifts at 95 and 105, end hit at 112.5). `tools/mix.py` lays the Tabbit samples
  on the composition's own events and masters to -14 LUFS.
