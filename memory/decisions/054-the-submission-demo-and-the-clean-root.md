# 054 The CSC demo video, and a repository a judge can read

Summary: For the CSC deadline (2026-10-05, 07:00 UTC) the submission demo is a 97.5 second film built from run 4's real screenshots of the local copy, with an on-screen line saying the model replies were prepared in advance; the repository root was cleared, the README corrected and given team, AI-use and before-the-hackathon sections, and the README screenshots that showed the owner's email address were replaced or redacted.

## What was decided (2026-10-05)

- **The demo video.** `docs/videos/demo/` is a HyperFrames composition over 30
  screenshots from run 4, the recorded walk of the production build against a
  local database with made-up classmates. Eight steps (join, write, organize,
  share, correct, review, study, readout), a "How it is built" card and an end
  card with the live address and the repository. Every caption was checked
  against the product code and the screenshots before the final render. Two
  changes came out of that check: the AI "drafts" rather than "turns into"
  (the writer edits and approves), and the card says a person approves every
  note and every correction, not every share, because generated decks and
  tests are saved to the Pot without an approval step. The readout step uses
  only the readout itself, not the study record above it, so the caption about
  the class as a whole does not sit over named scores.
- **The disclosure is on screen.** All four model outputs in the recording
  were answered by the run's stand-in for Gemini. The app still prints the
  configured model name, so the "How it is built" card carries "The model
  replies in this recording were prepared in advance." The Devpost AI-use
  field says the same at more length.
- **The music** is `tools/bed.py`, a piano bed played by FluidSynth from the
  MIT FluidR3 GM soundfont and mastered to -14 LUFS. The wav is regenerated
  rather than committed.
- **The root.** Brand concepts and the palette moved to
  `docs/reference/brand/` (the ChatGPT images keep "chatgpt" in their names so
  the AI disclosure can point at them), the rules text to
  `docs/reference/hackathon/`, and `404 Page.dc.html` was deleted. Unused
  create-next-app SVGs left `web/public/`.
- **The README** now says what is true on 2026-10-05: no melt on the landing,
  classwork not switched on live, one anonymous function the app uses, the
  study route's optional standby, no test count that can drift, 0013 skipped on
  a development database. It gained "Before and during this hackathon", "Team"
  and "How we used AI", which the Devpost rules require.
- **Screenshots.** The dashboard and review shots are now run 4 captures (seed
  accounts, production build, no dev badge). In the two settings shots the
  owner's address was replaced: the sidebar chip of the dark one with run 4's
  seed chip, and the light one's address with you@example.com. The old images
  stay in history.
- **The landing's GitHub link** now points at `Rayrayyh/Meltingpot-CSC`
  instead of the older Prometheus repository. It reaches the live site only
  with the next deploy, which is the owner's call.

## What stays with the owner

Making the repository public, whether `main` or this branch is what judges
see, the team's names, eligibility, the Gemini age clause in
`docs/CSC_HACKATHON.md`, the seed accounts' password before going public, and
uploading the video to YouTube or Vimeo for the Devpost link.
