# A class code is what the generator makes

One-line summary: the column now enforces the same 31 character alphabet
`generate_class_code()` draws from, and the seeded demo Pot was moved onto a
generated code rather than being excused from the rule.

Decided 2026-09-09, at the owner's instruction.

## What was wrong

`generate_class_code()` has always drawn six characters from
`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, which leaves out `0`, `1`, `I`, `L` and `O`
because a class code gets read off a whiteboard and typed by hand. The column
check was the full `^[A-Z0-9]{6}$`. So the rule the generator kept was never
enforced, and the two could drift apart without anything failing.

Nothing user facing sets a code: `create_pot` and `regenerate_class_code` both
call the generator. So this was latent, not live. It would have become live the
first time someone added a "choose your own code" feature.

## What changed

`0061` tightened the check but had to name one exception, because the seeded
demo Pot was `BIO101`, which carries three look alikes. `0062` retired that
exception by moving the fixture to `5R22AX`, a code that came out of
`generate_class_code()` itself.

The check is now plain:

    check (class_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$')

## Two things that were nearly done the wrong way

**`NOT VALID` would have been worse than doing nothing.** It skips the scan of
existing rows, which sounds like exactly what a legacy row needs, but Postgres
still evaluates the constraint on every later *update* of that row. Editing the
demo Pot's title would have started failing with a message about its class code.
A latent trap traded for a live one.

**`dev_seed()` names the code twice and its body is 18,805 characters.**
Retyping it to change one literal is what `memory/lessons/011` records: a
function re-emitted from memory silently dropped guards that three later
migrations had to restore. So `0062` reads the live definition, asserts it names
the old code exactly twice, replaces, and re-executes. Verified afterwards by
the body's length being unchanged, which is only true if nothing but the two six
character literals moved.

## What this cost

The demo class code is no longer `BIO101`. Anything that quotes it as a live
code is now stale: `docs/BUILDLOG.md` and the step 5 row in `docs/CLERK.md` both
mention it, and were deliberately left alone because they are records of what
was true on the day, not instructions.

`web/lib/validation/inputs.ts` keeps `^[A-Z0-9]{6}$` on purpose. That regex
validates what a person types into the join box, and it has to accept whatever
code they were handed, including codes issued before this rule.
