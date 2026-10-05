# Walkthrough film: notices

What the film is made of, and where each part comes from.

## On screen

- **Product screens** are recreated in HTML from MeltingPot's own interface: its light theme tokens, fonts, Phosphor
  icons and words (`notes/UI-SPEC.md`). The class, people and notes are the repository's fictional seed data (Biology
  101). The organized note, the Worth checking panel, the flashcards, the practice test and the teaching readout show
  the text run 4 recorded on a local copy of the app, where the model's replies were prepared in advance
  (`docs/videos/launch/NOTICES.md`). The film's last card says the screens are recreated with example class data.
- **Fonts**: Inter, Fraunces, Baloo 2 and Source Serif 4 (SIL Open Font License, `assets/fonts/OFL.txt`); Liberation
  Mono Bold for the class code (SIL Open Font License).
- **Icons**: Phosphor Icons (MIT), exported from the app's own `@phosphor-icons/react` by `tools/icons.mjs`.
- **Motion parts**: ported to one paused GSAP timeline in `assets/parts.js` from Magic UI, Kibo UI, Motion Primitives
  and Watermelon UI (MIT). Sources and licence texts: `reference/components/` and `notes/COMPONENTS.md`.
- **GSAP** 3.14.2 under its own standard licence (`assets/vendor/gsap.min.js`).

## Sound

- **Music**: `tools/score.py`, written for this film and played by FluidSynth from the FluidR3 GM soundfont (MIT,
  `tools/LICENSE-FluidR3_GM.txt`).
- **Typing and click sounds**: cut from the Tabbit launch film at the owner's direction ("Lift the exact samples",
  2026-10-05; `notes/DECISIONS.md`). They are Tabbit's audio, not ours: credit Tabbit if the film is published, and
  replace them with recreated sounds if Tabbit objects. The samples are not committed (`*.wav` is git-ignored);
  `tools/cut_sfx.py` rebuilds them from the two Tabbit cuts, and `assets/audio/sfx/catalog.json` lists each one and its
  source time.

## References (looked at, not copied)

Motionfly V2 for Notion AI and Cua Spaces (whatships.com), for motion grammar; the owner's landing film for the story.
