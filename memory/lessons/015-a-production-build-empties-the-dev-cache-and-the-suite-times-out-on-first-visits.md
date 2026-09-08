# 015 A production build empties the dev cache, and the suite times out on first visits

Summary: `next build` wipes `.next`, including the dev server's compiled routes, so the next Playwright run pays a cold compile of seven to thirteen seconds on the first visit to every route, and every five second wait in the suite fails in a pattern that looks like fifteen unrelated regressions. Warm the server or run the suite twice; do not chase the failures.

## What happened

On 2026-09-08 the full suite lost fifteen specs after a day of clean runs. Each failure was a `toBeVisible` or `toHaveURL` wait of five seconds; the dev server log showed `GET / 200 in 13.5s` and settings pages at ten to twelve seconds on their first hit. Nothing in the tree had changed on those paths. `pnpm build` had run several times that afternoon between suite runs, and each one emptied `.next/dev` along with everything else, so every route compiled from nothing under Turbopack when the suite reached it. A second run on the same, now warm, server passed all but one.

The first attempt that day failed differently: Playwright's own web server timeout of 120 seconds expired before the cold dev server answered at all, so no test ran.

## What to do

- Before a full suite run after a production build, start `pnpm dev --port 3111` yourself, wait for `/` and `/login` to answer, and let the suite reuse it (`reuseExistingServer` is on). Better still, run the suite twice and read the second tally.
- A failure list where every entry is a five second wait on a first visit is this lesson, not a regression. Look at the dev log's request times before reading the specs.
- Rate limits were the other suspect and were nowhere near their caps (four calls per window at most); check `public.rate_limits` before blaming them too.
