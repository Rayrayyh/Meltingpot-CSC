# meltingpot: the template filled in

The first fill-in of `../PROMPT.md`. Each answer cites the owner's decision in meltingpot's `docs/videos/launch/DECISIONS.md` (numbers in brackets). "Open" marks what is still to be answered.

| Slot | meltingpot |
|---|---|
| P1 Product | **meltingpot**. Tagline "Everything your class knows, in one Pot." Sub-line "Turn scattered notes, resources, and explanations into one shared course space your whole class can explore." One line: "MeltingPot is a web app where the students in a class build one shared vault of knowledge." Audience: students, and the people who run a class [15] |
| P2 Remember | "Everyone takes notes. MeltingPot brings them together." [15] Abilities to show off [35]: the idea of collaboration; joining with a class code; the AI organizing rough notes, which the student approves before anything is shared; corrections, approved by the person who runs the class; studying from the vault (flashcards and practice tests built from the shared notes); the teacher readout (what the class keeps missing) |
| P3 Claims | Each ability is shown only as today's build does it, proven by a real local run (step 4). Must not claim: any speed for an AI step (the AI replies are simulated [28]); a live model name the repo can't prove (the screen prints the product's FAST_MODEL, documented as gemini-3.6-flash in README.md and web/.env.example, not read from the live site [33]); anything outside the shipped app |
| P4 Surface | A web app in one browser tab, at meltingpots.xyz [13]. Run locally on a Supabase copy with the repo's fictional seed, renamed, plus a production build with the same-origin rewrite. Never production [2, D1 to D5; `docs/videos/launch/notes/CAPTURE.md`]. Dark theme [4]. AI: the product's routes run for real, and only the outgoing model request is answered by a simulated reply that passes the product's normalizer [28]. The same for the study route (flashcards, practice tests) and the teaching route (readout) [37]. The readout's evidence is real: fictional classmates take a practice test in the local run until the class has at least 20 first-pass answers from at least 2 students, counted across the whole Pot (`web/app/api/ai/teaching/route.ts:62`) |
| P5 UI route | **(b) Simplified and stylised** [35]. Screens are built from components, cleaner and with fewer elements, reading like motion graphics. Every word comes from the real app's visible text in the local run |
| P6 Brand | Mark: `web/public/brand/pot-logo.png` [10]. Wordmark: lowercase "meltingpot" as `web/components/shell/wordmark.tsx` draws it (Baloo 2 semibold) [31]. Palette [12]: `--night` #0c0a09, `--ink` #faf7f2, `--ink-2` #bdb5ad, `--accent` #f19a44 (the product's dark primary), `--deep` #c2410c, light stops #7c2d12, #c2410c, #f19a44. Icons: Phosphor. Product fonts: Inter (UI), Fraunces (display), Source Serif 4 (note bodies), Baloo 2 (wordmark). The repo's copy rules hold on screen: sentence case, no emojis, no em dashes, no purple AI branding, no chatbot look, no likes or leaderboards |
| P7 People | Amy, Rayyan, Ibrahim, Adam, Ahmad and Paul, the repo's fictional seed users renamed [9, 14] |
| P8 References | Tone: **Mercury Books**, https://whatships.com/videos/mercury-books/ [36]. Structure: **open**, the owner is sending links [36]. Beat references: none [36]. Also in hand: the Tabbit film, measured (`examples/tabbit-measured.md`) |
| P9 Format | 16:9, 1920x1080, 30 fps, **37.5 s = 15 beats of 2.5 s** [29, 36] |
| P10 Sound | No voice-over; music composed in code to fit; no captions unless needed [34]. C minor, 96 BPM; "bold, innovative, emotional" [5] |
| P11 Type | "No generic fonts, let the references inspire and influence, and potentially decide" [34]. **Open** until the structure reference is chosen; shortlist only fonts with an open licence that can be bundled locally |
| P12 Repo | `Rayrayyh/meltingpot-csc`, branch `claude/csc-back-to-school`. The film's folder `docs/videos/launch/` stays uncommitted until the owner says [7]. This template and this file are committed [35]. Decisions: `docs/videos/launch/DECISIONS.md` |

## Where the earlier attempt stands

A first film was built without the thread's tools (decision 27), from captured screens, through stills and a draft. The owner chose to remake it with HyperFrames and 21st.dev components [34], so that draft is dropped. Its notes stay useful:

- the measured Tabbit study (`examples/tabbit-measured.md`);
- the local capture setup (`docs/videos/launch/notes/CAPTURE.md`);
- the score composer (`../kit/audio/compose.py`), whose music is the Tabbit film's own.
