# 006 E2e suites need automatic reseeding, and debounced creators need in-flight guards

Summary: Tests inheriting data from earlier runs produced three different "flaky" failures before the suite got a guarded reseed in global setup; and the composer's autosave + attach could race two contribution rows into existence.

## Test isolation

Accumulated shares and accepted corrections from prior runs broke exact counts, duplicated titles, and even changed sentence text mid-suite (a previously accepted correction made the target sentence different on the next run). Manual reseeding between runs kept being forgotten. The durable fix: `dev_reseed()` (migration 0009, guarded to signed-in @meltingpot.dev dev users, dropped before production) called from Playwright `globalSetup`, which signs in as a seed user over the direct Supabase origin since the dev server rewrite is not up yet. Assertions on shared fixtures still prefer floors and `.first()` where cross-spec writes are legitimate.

## Reseeding by hand (2026-09-05)

`dev_reseed` is refused over the API now (0034), so global setup checks the seed instead and stops when a run left it dirty (a renamed class, a regenerated code, decided proposals). The reset is `select public.dev_seed();` as the service role, and on this database it failed twice before it worked: it deletes the four seed users in one statement, and a seed user's shared note inside a Pot that statement had not yet reached tripped `shared_notes_contributor_id_fkey`. Delete the seed users' own Pots first, in the same DO block, then call `dev_seed()`; the seed rebuilds them. Residue Pots owned by throwaway `e2e.*` accounts are worth removing in the same breath. Real people's Pots on this database are never touched by either step.

## The dirty-seed check that never ran (2026-09-15)

The check above was written and then never executed once. It took the Pot's id
from `lookup_pot_by_code`, which is the pre-auth preview and deliberately
returns a title and some counts and never an id, precisely so that a stranger
holding a class code cannot get one. The helper fell through to a `"present"`
placeholder, and `seedLooksUsed` opened with `if (potId === "present") return
null`, so every run printed "seed is present and pristine, continuing" having
verified only that the class code answered.

The symptom was the correction spec failing at test 19 of 66 in a full run and
passing on its own: the previous run had accepted the correction, so the
sentence its first click looks for no longer existed. Two full runs and a
manual reseed between them is what it took to see that the first run was what
broke the second.

Two things to take from it. A guard that can silently degrade to "everything
is fine" is worse than no guard, because it also prints a sentence saying it
checked. And when a spec fails in a full run and passes alone, the cause is
almost always the run before it, not the machine.

The id now comes from an authenticated read of `pots` by title as
maya@meltingpot.dev, who owns Biology 101, so RLS hands it over with no new
function. The class code drifting off 5R22AX, which `settings.spec.ts` causes
and which was being repaired by hand every time somebody noticed, is now one
of the dirtiness checks.

## The ensureContribution race

The composer creates its contribution row lazily. Autosave (debounced) and attach-link could both call the creator while `contributionId` was still null, inserting two rows; the attachment landed on the orphan and vanished from the shared note. Fix: a `useRef`-held in-flight promise so concurrent callers await the same insert. Any lazily-created resource with multiple triggers needs this guard.
