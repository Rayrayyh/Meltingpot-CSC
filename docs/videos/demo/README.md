# The CSC demo video

A 97.5 second walk through MeltingPot for the CSC Back-to-School Hackathon, built as a HyperFrames composition
(`index.html`) over screenshots of the real app. Decision 054 in `memory/decisions/` records what it shows and why.

- The screens in `assets/shots/` are run 4: the production build of this repository on a local database with
  made-up classmates. The model replies in that recording were prepared in advance, and the film says so.
- The music is `tools/bed.py` (FluidSynth with the MIT FluidR3 GM soundfont, `tools/LICENSE-FluidR3_GM.txt`).
  Run `python3 tools/bed.py` from this folder to write `assets/audio/bed.wav` before rendering.
- Fonts in `assets/fonts/` are under the SIL Open Font License (`assets/fonts/OFL.txt`).
- Render with the template's kit: source `docs/videos/template/kit/hyperframes/env.sh`, then
  `$HF_OFFLINE $HF render --strict --fps 30 --workers 1 --quality looks -o renders/final.mp4`.
