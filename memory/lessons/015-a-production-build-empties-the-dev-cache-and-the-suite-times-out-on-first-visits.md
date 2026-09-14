# 015 A production build empties the dev cache, and the suite times out on first visits

Summary: `next build` wipes `.next`, including the dev server's compiled routes, so the next Playwright run pays a cold compile of seven to thirteen seconds on the first visit to every route, and every five second wait in the suite fails in a pattern that looks like fifteen unrelated regressions. Warm the server or run the suite twice; do not chase the failures.

## What happened

On 2026-09-08 the full suite lost fifteen specs after a day of clean runs. Each failure was a `toBeVisible` or `toHaveURL` wait of five seconds; the dev server log showed `GET / 200 in 13.5s` and settings pages at ten to twelve seconds on their first hit. Nothing in the tree had changed on those paths. `pnpm build` had run several times that afternoon between suite runs, and each one emptied `.next/dev` along with everything else, so every route compiled from nothing under Turbopack when the suite reached it. A second run on the same, now warm, server passed all but one.

The first attempt that day failed differently: Playwright's own web server timeout of 120 seconds expired before the cold dev server answered at all, so no test ran.

## What to do

- Before a full suite run after a production build, start `pnpm dev --port 3111` yourself, wait for `/` and `/login` to answer, and let the suite reuse it (`reuseExistingServer` is on). Better still, run the suite twice and read the second tally.
- A failure list where every entry is a five second wait on a first visit is this lesson, not a regression. Look at the dev log's request times before reading the specs.
- Rate limits were the other suspect and were nowhere near their caps (four calls per window at most); check `public.rate_limits` before blaming them too.

## The other thing that looks exactly like this (2026-09-11)

Twenty two specs failed at once, every one a five second wait, straight after
a run of production builds. This lesson looked like the answer and it was not:
warming the server and running again reproduced the same twenty two.

The failures were seed state. The suite mutates the seed as it goes, the
reseed in global-setup is refused (403) because only service_role may reseed,
and a run that follows an interrupted one meets a Pot whose sections and notes
an earlier spec already moved. `select public.dev_seed();` as service_role,
then a clean run, gave 65 of 65.

So the two causes wear the same face. Tell them apart before touching code:

- Read the failing test's `error-context.md`. A cold compile shows the right
  page arriving late. Seed drift shows the wrong page, often the 404, or a
  title that is simply not there.
- Check the data. `select * from public.sections where pot_id = ...` answers
  in seconds whether the fixture the spec wants still exists.
- A/B the diff. Stash the working tree, run the one failing spec on the last
  commit, restore, run it again. If both pass, the tree is not the problem and
  the environment is. That is two minutes and it ends the argument.
- `dev_seed()` deletes the seed Pot by class code, so a run that rotated the
  code leaves it orphaned and the next reseed fails on a foreign key. Put the
  code back to 5R22AX first, then reseed.
