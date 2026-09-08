# 043 A second bug pass closes the old door, and names the rest

Summary: The 8 September bug pass ran twenty-seven agents over the tree and the live database with a skeptic per finding; fifteen confirmed findings and the cheap low ones were fixed the same day (migrations 0057 and 0058 plus the app), the accounts that moved to Clerk lost their Supabase Auth door, and the larger lows are listed here so nobody rediscovers them.

## How the pass ran

The owner asked for a deep bug pass of at least twenty minutes; the workflow ran for sixty-seven. Nine finder lenses (Clerk's browser half, Clerk's server half, the database, the data layer, the API routes, front end state, classwork, study, copy and product rules, configuration and build, tests), a dedup in code, then one skeptic per finding reading the code and, read only, the live database. Fifteen findings survived, forty-seven lows were reported without a skeptic, one claim was refuted (the router cache does not show a stale feed after a write: every write path refreshes).

## What changed

Database (0057): the ten people who moved to Clerk on 2026-09-08 still had their Supabase Auth rows, passwords and twenty-one live sessions, a second door beside Clerk's second factor. The rows are banned and every session and refresh token revoked; the rows themselves stay because the delete trigger used to take the profile with them, and that trigger now leaves a profile Clerk owns alone. `sign_up_student` admits only the test domain the dev seed trusts, so nobody mints a Supabase account around Clerk while local runs and the suite keep working. A lapsed classwork connection now marks every sibling link `reconnect`, not only the one that noticed. `save_study_set` refuses an empty deck, test or summary. Study sets carry a generation that counts up on a rebuild, and a practice hand-in names the generation it took, so a rebuild under someone mid-test is refused instead of marked against a different test's keys. `study_set_removed_for` lets the route ask, before spending a generation, whether a maintainer took the set down.

Database (0058): the hourly classwork job knocks on the domain, not the netlify.app alias.

App: the proxy matcher covers every API route, so image and text attachments load under Clerk (they ended in an extension the first pattern skips, and a route the middleware never saw cannot read the session); the netlify.app alias redirects to the domain, since a Clerk session only lives there. Joining a closed Pot says so rather than "not found". A flashcard or practice run claims the page's bare keys even when focus is on the body. Leaving the composer by Cancel, Save draft or the sidebar flushes the autosave the debounce was holding. A rebuilt deck is a new session. A practice question whose answer names no choice is dropped rather than marked with the first choice right. The sign in form keeps its diagnostics in the console and says which door is shut. And the cheap lows: search terms are literal in LIKE patterns, the Continue link skips removed notes, the teaching route tells a quota from an outage, Pot settings and attachment removal prove their rows changed, the classwork prefill fits the column and a cut never splits an emoji, a course another maintainer already linked is not offered twice, the flashcard button counts what it deals, another tab's theme change repaints this one, the two-factor panel and gate name their failures, the wait for clerk-js gives up quickly after the first miss, and the copy and docs say what is true (MeltingPot, Sign out, Raw notes, light default, Clerk live, the domain everywhere).

## Left on purpose

1. `study-workspace` rescues a failed rebuild by opening the older set even for an explicit refusal (rate limit, closed generation). Fixing it means separating a lost reply from a refusal in `generate`; the refusal messages exist and the rescue should be narrowed to lost replies. A morning's work, not a patch.
2. The feed query has no page size and counts attachments in the browser. Paging the feed is a design change to the Pot page.
3. The private record counts an attachment added to a draft as a day with a share. The right date is the contribution's shared_at; mirror it in `own_standing` when done.
4. A summary in search says "newest notes" now; the fifty note cap itself stays and a Pot past it gets a summary of its newest fifty.
5. The footer still credits the Prometheus entry while the project is entered in CSC. Which credit the footer, terms page, README and the spec carry is the owner's call (decision 021's pattern).
6. Global setup misnames two dirty seed states (a regenerated class code, a leftover factor). The two-factor spec now cleans up after itself, and the feed spec's locators are scoped to the main region so the sidebar's new notes card cannot make them ambiguous on a fresh seed; the setup's wording is next.
7. The Study and Pots pages run the dashboard's per Pot counts to list titles; `getUserPots` would do.
8. Opening a saved set without stored options describes the form's settings as the set's.
9. A refused save after `study_set_removed` leaves a Save button that does nothing; with the route now refusing before it builds, only a race reaches it.
