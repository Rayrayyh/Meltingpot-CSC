# MeltingPot

meltingpot.io is a responsive desktop-first web app where students in a class collaboratively build a shared vault of knowledge. A class space is a Pot. Students join with a six-character class code, write completely unformatted notes, an organizer structures them, and the student approves before anything is shared. Corrections to shared notes go through maintainer review. Entered in the CSC Back-to-School Hackathon, which asks for something that "helps students, teachers, or schools solve a real school-life problem". It was built for, and won, the Pixel Forge hackathon, and was then entered in the Prometheus August AI Challenge; `docs/CSC_HACKATHON.md` holds the current entry's rules and `memory/decisions/021` records the earlier move.

**Submission deadline: 2026-10-05, 12:00am PDT.** Far enough out that nothing needs rushing, which is a different footing from the previous two entries. Eligibility is ages 13 to 18 and students only, which is pass or fail before any judging.

Judging is five criteria with **no published point values**: Learning, Design, Creativity, Functionality, and Impact. Do not assume a 100 point scale; the previous entry's four-by-25 rubric does not apply here. A 1 to 2 minute demo video is optional but encouraged. The submission also requires an AI-use disclosure explaining how AI was used, which `memory/decisions/` and `docs/BUILDLOG.md` already hold the raw material for. Full rules in `docs/CSC_HACKATHON.md`.

## Read these first

1. `docs/CSC_HACKATHON.md` - the current hackathon's rules, criteria and deadline, and what this repository is missing.
2. `docs/SPEC.md` - the authoritative product spec. It wins every conflict.
3. `docs/PLAN.md` - the step-by-step execution plan with per-step verification and status. Keep its status column current as steps land.
4. `memory/` - the knowledge base: `decisions/` (what was chosen and why) and `lessons/` (what was learned the hard way). Follow `memory/README.md` rules: one note per file, one-line summary at top, update instead of duplicating, delete wrong notes.
5. `docs/reference/REFERENCE_CAPTIONS.md` + the 16 PNGs - UX structure references. Captions say per image what to use and ignore.

The four historical vision PDFs and the pasted rules text were removed from the repo root before submission; `memory/decisions/001-source-of-truth.md` records why they were never the source of truth.

## Stack

Next.js (App Router, TypeScript, Tailwind) in `web/`, Supabase (Postgres + Auth + Storage) with RLS enabled on every table, Netlify for hosting, Framer Motion (+ GSAP where a timeline helps) for restrained animation. The AI organizer is a deterministic provider behind an interface (`memory/decisions/003-ai-organizer.md`); no live model calls in the MVP.

## Commands

Run these from `web/`:

- `pnpm dev` - dev server (Turbopack)
- `pnpm build` - production build; must pass before every push
- `pnpm lint` and `pnpm typecheck` - fast checks; run before every commit
- `pnpm test:unit` - vitest unit tests
- `pnpm test:e2e` - Playwright end-to-end flows on port 3111 (launches the container Chromium via launchOptions.executablePath; never run `playwright install`)

Next is v16: `proxy.ts` instead of `middleware.ts`, `params`/`searchParams` are async, docs bundled at `web/node_modules/next/dist/docs/`. See `memory/lessons/002`.

Screen recordings and demo videos shared with the owner are always mp4 (H.264, yuv420p), never webm (owner's standing instruction). Convert with ffmpeg before sending.

Deploys go to https://meltingpot-prometheus.netlify.app only (owner's standing instruction, 2026-08-29). Never deploy to meltingpotworks.netlify.app or meltingpot-io.netlify.app; those are earlier sites. Deploy the committed tree from a detached worktree via the Netlify MCP zip deploy with web/ as the package root, so uncommitted work never ships.

Database changes go through Supabase MCP migrations (`apply_migration`), one migration per schema change, mirrored into `supabase/migrations/` in the repo.

## Product rules that are easy to violate

- No login wall before showing the Pot: code -> Pot preview -> auth -> membership finalized.
- Never publish anything automatically. The contributor approves contributions; a maintainer approves corrections.
- Always store and show both raw and organized content. The original is never deleted or overwritten.
- Pot titles may duplicate; Pot IDs and class codes are unique; never use titles as identifiers.
- No Git terminology, no schools/organizations, no likes or leaderboards, no purple AI branding, no gradients, no chatbot UI.
- Two of these rules were lifted by the owner on 2026-08-19 and 2026-08-20. Flashcards and practice tests are real features now, built from shared notes. A private record of one person's own days exists (a day counts for a share, a study run, a correction accepted or reviewed, or a resource attached), and it is quiet by decision 030: nothing opens on its own, and its one celebration (decision 032, the stirring pot card) fires only on a completion screen, on the first action that counts that day, and a quiet stretch shows the run they already managed rather than a zero. On 2026-09-02 the owner also lifted the comparison rule (decision 031): a person sees where they stand in each class, rank and the share of classmates they are ahead of, always said as what they are ahead of and never as what they are behind. It is theirs alone: no named list, and nobody sees anyone else's standing or counts. The interface never says streak. Nothing else keeps score.
- Copy style: sentence case, natural language ("Share with class", "Send to maintainer"). No emojis. No em dashes, in UI copy and in this repo's docs alike.
- Everything a person reads must sound human, not AI generated (owner's standing instruction, 2026-08-30). That covers the README, docs, scripts, demo narration and website text. Write it in the owner's own plain voice and typography: short natural sentences, contractions are fine, no em dashes (use a comma or a period, at most one dash where a person would really put one). Skip the usual AI tells: "seamless", "dive in", "empower", "elevate", tidy three-part parallel clauses, bullet essays. Read it back; if it sounds like a model wrote it, rewrite it until it sounds like the owner did.

## Sidebar, caret and card motion (2026-09-05 round)

- The sidebar is arrangeable per person from Settings: link order, hidden links, and class order. The collapsed My Pots icon navigates by `web/lib/pot-destination.ts` (one class, else the arranged first slot, else a favourite, else last opened). Favourites are the star on a class row. State lives in `sidebar_preferences` and `pot_preferences`, owner-only rows by design (`memory/decisions/033`); never move it onto memberships or profiles.
- Every single-line field draws the gliding caret; textareas keep the native caret in the brand colour, on purpose (`memory/decisions/034`).
- The notification card collapses on opacity alone and lets the rail reflow it, measured off kolejain.com (`docs/KOLEJAIN_NOTIFICATION_MOTION.md`). The nav scroller draws no bar but still scrolls.
- The note view toggle reads Original then Organized, opens on Organized, and uses `components/ui/pill-tabs.tsx` for the sliding pill.
- Classwork from Canvas and Google Classroom is being built (decision 038, `docs/CLASSWORK.md`). It is read-only import: an imported item is never a note and never counts for anyone until a person starts a note from it and shares it; refresh tokens live in Vault behind a server key and never reach a browser; the three `lms_*` tables are read-only from the client and written only by the definer functions in migration 0050.

## Design tokens (digest)

Cream paper background (#faf4e6), warm white surfaces, near-black ink, brand orange primary actions (#ab5a14 light, #f19a44 dark), deeper orange accents. Dark is the default theme for everyone who has not chosen one (owner's call, 2026-08-30, superseding the earlier light default), stamped before first paint; the landing header carries a one tap light/dark icon, settings holds the three way picker, and both write the same stored choice so a preference set on the landing carries into the dashboard (`memory/decisions/020`). The brand mark is an orange pot with a lowercase m knockout and liquid blobs (web/components/brand/pot-mark.tsx, web/app/icon.svg); the gradient inside those SVGs is the one sanctioned gradient use. The mark carries no tile or background: the mouth and the m are masked holes, so it sits on any surface. Icons come from two sources, because a tab and a home screen want different artwork: web/app/icon.png is the tileless mark and feeds favicon.ico, and web/public/brand/app-icon-tile.png is the square cream tile and feeds apple-icon.png. After editing either, run `node scripts/build-icons.mjs` from `web/`. Avatars are a person icon in one of six decorative `--avatar-N` tints hashed from the display name, deliberately separate from the functional colors. Inter for UI, Fraunces for display headlines, Baloo 2 for the lowercase wordmark, Source Serif 4 for long-form note bodies. Phosphor icons. Flat cards, subtle borders, restrained shadows, rounded corners, pill buttons, generous whitespace. Functional color only for success, warning, error, additions, removals, pending review. Honor prefers-reduced-motion. The owner replaced the original forest-green palette on 2026-08-19; see memory/decisions/010.

## Working agreements

- Each change ends with lint + typecheck + build green before a commit, and a push to `claude/csc-back-to-school`.
- Work stays on `claude/csc-back-to-school`. Do not merge it into `main` and do not open a pull request without being asked: the owner decides when it moves. `main` being behind is expected, not a problem to solve.
- **Hosting: `meltingpot-csc` on Netlify, not `meltingpot-prometheus`.** That older deploy belongs to the previous entry and is no longer the target. The deploy shape is unchanged: `web/` is the package root and `@netlify/plugin-nextjs` must be declared explicitly, or every route 404s.
- This repository was copied from the older one at `f2cab37` and is missing four fixes made there on 2026-09-04, one of which is a real bug. `docs/CSC_HACKATHON.md` lists them.
- Do not schedule recurring pull request check-ins or any other self-firing routine. Report on a PR when the owner asks, or when a GitHub event actually needs a decision.
- When something breaks, check `memory/lessons/` first, and record any new lesson worth keeping.
- Log every architectural or scope decision in `memory/decisions/` at the moment it is made.
