# 051 A standby mixer, for the study route only

Summary: The study route puts a capacity refusal from the primary model to a second provider on OpenAI, paying a cut to the primary's budget and retries to make room; every other route is unchanged.

## What was decided (2026-09-14)

The owner reported the model overloaded error on flashcards and practice
tests. That is a 503 from the primary, which is capacity and not our request,
so a second provider genuinely answers it where a retry often does not.

Three shapes were put to the owner: OpenAI primary with the current provider as
backup, OpenAI only for study, or the current provider first with OpenAI on
overload. The owner chose the third. It was flagged at the time as the fragile
one and chosen anyway, so this note records the cost rather than relitigating
it.

## The cost, written down

Asking the busy provider first means paying for its refusal before every
rescue. Against the study route's 22 second budget inside a 26 second function:

- The primary is capped at 45 percent of the remaining budget, about ten
  seconds, and two attempts instead of four.
- The standby gets what is left, about twelve seconds, and the usual four.
- Both stay above the six second floor a real call needs.

In the case this exists for the bill is small, because capacity refusals come
back in a few hundred milliseconds and the standby inherits almost the whole
budget. The expensive case is the primary accepting and then stalling, which is
why the share is a ceiling rather than a target.

## What fails over and what does not

The test is the same one used for retrying: a 503, a 429 or a dropped
connection is somebody else's to answer. A rejected key or a malformed body is
ours and would fail identically over there, so failing over on it would hide
our mistake behind a second bill.

A reply that arrived and was unusable does not fail over either. The mixer
worked and the content did not, which the deterministic organizer handles
better than another generation.

## Scope

Only `app/api/ai/study/route.ts` opts in, through `allowFallback: true`.
Organizing and the teaching readout stay on the primary alone, because neither
was reported failing and the teaching readout has no rule-based fallback to
land on.

With `FALLBACK_MODEL_API_KEY` and `FALLBACK_FAST_MODEL` unset there is no
failover and no budget split: the primary keeps the whole budget and all four
attempts, exactly as before. That is the state every environment starts in.

## Why the standby is asked for JSON rather than bound to a schema

Strict schema mode constrains what a schema may look like and is not offered by
every model, so binding the rescue path to it would mean it failing on the day
it is needed. The standby gets JSON mode with the schema in the instruction
instead. Nothing is lost: `lib/mix/contracts.ts` re-checks the shape whichever
provider answered.

## Files

`lib/mix/providers.ts` holds both wire formats and nothing else.
`lib/mix/server.ts` holds retries, budget and failover, which are policy and
the same either way. `lib/mix/failover.test.ts` pins the rules above.
