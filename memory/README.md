# Memory

This directory is the project's knowledge base. It makes the repo, not chat history, the durable memory across build sessions.

## Rules

- One lesson or decision per file, with a one-line summary as the first line after the title.
- Record corrections and confirmed approaches alike, and always say why they mattered.
- Do not save what the repo or chat history already records. Specs live in `docs/SPEC.md`; the plan lives in `docs/PLAN.md`. Memory holds the things those files do not: decisions with their reasoning, and lessons learned the hard way.
- Update an existing note rather than creating a duplicate.
- Delete notes that turn out to be wrong.
- File naming: `NNN-short-slug.md`, numbered in creation order. Numbers are never reused after deletion.

## Layout

- `decisions/` - choices that were made, by whom, and why. Read these before changing architecture, scope, or design direction.
- `lessons/` - things learned during the build (environment quirks, failed approaches, confirmed techniques). Read these before debugging something that feels environment-shaped.

## Index

Every note on disk is listed: 51 decisions and 19 lessons, regenerated 2026-09-12.

Some numbers are shared by two files, from days when two notes were written in parallel. They are not renumbered, because other documents cite them by number:

- 012: 012-google-sign-in-and-landing-motion.md, 012-maintainers-see-study-results.md
- 017: 017-mixing-not-a-model-name.md, 017-the-stir-loading-mark.md
- 018: 018-a-setting-is-not-a-page-load.md, 018-admin-page-and-recoverable-material.md
- 019: 019-the-card-turns-over.md, 019-the-organizer-may-disagree.md

### Decisions

- 001 Source of truth precedence
- 002 Stack and hosting
- 003 AI organizer strategy
- 004 Auth and join flow
- 005 Dashboard-first, landing secondary, and brand directives
- 006 Process directives from the owner
- 007 body_text joins blocks with newlines so selections never span blocks
- 008 Production lives at meltingpot-io.netlify.app
- 009 Rate limiting and endpoint closure live in the database
- 010 The brand is orange on cream, with the pot-and-m mark
- 011 Account surface and two-step sign in
- 012 Google sign in without Firebase, plus landing motion
- 012 Maintainers see study results, by owner decision
- 013 Auth seam, Google sign in removed
- 014 Generated study material is stored per Pot; removal is not deletion
- 015 The light-mode brand orange had to darken to be readable
- 016 A correction is organized before it is sent, not when it is accepted
- 017 The product says mixing; it never says the model's name
- 017 The loading mark is the pot, stirring
- 018 Changing a setting looks things up quietly; it never rebuilds the page
- 018 The maintainer's page is the Pot's record, not just its queue
- 019 A flashcard is one card with two faces, not two cards crossfading
- 019 The organizer may disagree with the note, but never edit it
- 020 Light is the default theme, and one stored choice covers every surface
- 021 The project is entered in the Prometheus August AI Challenge
- 022 The teacher gets a readout, and the model never touches the numbers
- 023 A demo Pot and a guided walkthrough for brand new accounts
- 024 The landing hero shows the product, not the pot
- 025 The landing scrolls natively; the Lenis wheel hijack is gone
- 026 An outside scan set the header work, and the CSP ships permissive on purpose
- 027 Two interactions borrowed from other sites, translated rather than copied
- 028 Section two names the problem and opens three doors
- 029 The sidebar folds, and the controls are ours
- 030 The record is quiet
- 031 Where you stand, said as what you are ahead of
- 032 The moment comes back, as the stir
- 033 Your sidebar lives in two private tables
- 034 The caret is drawn on one line only
- 035 The notification card collapses the way kolejain.com does
- 036 One pill slides between Original and Organized
- 038 Classwork from Canvas and Google Classroom
- 039 A bug pass fixes what it confirms, and names what it leaves
- 040 The flashcard face is a printed card
- 041 Clerk groundwork, without switching
- 042 The flashcard face is a color you choose
- 043 A second bug pass closes the old door, and names the rest
- 044 A broken page wears the 404's face, and a refused session reads as signed out
- 045 A class code is what the generator makes
- 046 Section two is the bento reference sheet, reproduced
- 047 The landing fits the screen, and moves on purpose
- 048 The hero headline rolls, and the hero stops waiting on things it does not need

### Lessons

- 001 Reading the spec PDFs in this container requires poppler, not pypdf
- 002 Next 16 conventions and Playwright setup in this container
- 003 Supabase hosted-project auth defaults and function grant gotchas
- 004 Browser TLS is blocked by the egress proxy; route browser Supabase calls through a Next rewrite
- 005 RLS is authorization, not a query filter
- 006 E2e suites need automatic reseeding, and debounced creators need in-flight guards
- 007 Re-check authorization at time of use, not time of grant
- 008 One flag driving two buttons takes the way out away
- 009 An identity transform still captures position: fixed
- 010 The left of X-Forwarded-For belongs to the caller, not to you
- 011 Re-emitting a function body discards everything you did not look at
- 012 A rebuild under a running server looks exactly like an app bug
- 013 A ledger entry about a vanishing parent fails its own foreign key
- 014 On Netlify's Next runtime a route handler does not know its own host
- 015 A production build empties the dev cache, and the suite times out on first visits
- 016 The sandbox browser reaches the live site once TLS 1.3's post-quantum hello is off
- 017 A social card swapped in place stays stale, however many times you deploy
- 018 A vendor's own component can be rendered on the live origin
- 019 React preloads every eager image, and Next preloads every font you declare
