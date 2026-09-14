# 006 E2e suites need automatic reseeding, and debounced creators need in-flight guards

Summary: Tests inheriting data from earlier runs produced three different "flaky" failures before the suite got a guarded reseed in global setup; and the composer's autosave + attach could race two contribution rows into existence.

## Test isolation

Accumulated shares and accepted corrections from prior runs broke exact counts, duplicated titles, and even changed sentence text mid-suite (a previously accepted correction made the target sentence different on the next run). Manual reseeding between runs kept being forgotten. The durable fix: `dev_reseed()` (migration 0009, guarded to signed-in @meltingpot.dev dev users, dropped before production) called from Playwright `globalSetup`, which signs in as a seed user over the direct Supabase origin since the dev server rewrite is not up yet. Assertions on shared fixtures still prefer floors and `.first()` where cross-spec writes are legitimate.

## Reseeding by hand (2026-09-05)

`dev_reseed` is refused over the API now (0034), so global setup checks the seed instead and stops when a run left it dirty (a renamed class, a regenerated code, decided proposals). The reset is `select public.dev_seed();` as the service role, and on this database it failed twice before it worked: it deletes the four seed users in one statement, and a seed user's shared note inside a Pot that statement had not yet reached tripped `shared_notes_contributor_id_fkey`. Delete the seed users' own Pots first, in the same DO block, then call `dev_seed()`; the seed rebuilds them. Residue Pots owned by throwaway `e2e.*` accounts are worth removing in the same breath. Real people's Pots on this database are never touched by either step.

## The ensureContribution race

The composer creates its contribution row lazily. Autosave (debounced) and attach-link could both call the creator while `contributionId` was still null, inserting two rows; the attachment landed on the orphan and vanished from the shared note. Fix: a `useRef`-held in-flight promise so concurrent callers await the same insert. Any lazily-created resource with multiple triggers needs this guard.
