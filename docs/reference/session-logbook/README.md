# The MeltingPot logbook

One-line summary: a forensic record of the 21-day session that built this
project, rebuilt from the transcript after seventeen compactions had already
thrown the running account away.

Open `logbook.html` in a browser. It is self-contained apart from webfonts.

## Why it exists

Claude Code's own `/insights` command reads only the current context window.
Run after the seventeenth compaction, it described a two-hour afternoon spent
on a sign-in mockup and presented that as the whole project: 9 messages, 92
minutes, 1 commit. The real session was 21 days, 341 messages and 229 commits.

It was also wrong in a second, unrelated way. Its `files_modified` counter
watches the Edit and Write tools, and this session runs in auto mode where most
edits go through Bash heredocs and `sed`, so it reported zero files changed on a
day that rewrote documentation and committed a new script.

## What is in it

The correction above, the session in numbers, a per-day activity chart, the six
phases with what landed beside what was torn back out, a ledger accounting for
the gap between 65,345 lines written and 48,215 standing, the two failure modes
that most of `memory/lessons/` collapses into, how the owner works measured
across every message, and what is still open.

## How it was built

From primary sources only, in this order:

1. The session transcript, 44,451 JSONL lines, filtered to the messages the
   owner actually typed. Tool results, command invocations, system reminders
   and task notifications all arrive in the user role and inflate that count by
   about a third if left in.
2. 229 commits from `melting-pot` and `Meltingpot-CSC`. The first attempt read
   the wrong checkout and missed eight days of history entirely.
3. The 65 notes in `memory/decisions` and `memory/lessons`.

Eight agents then read the six phase digests, the decision index and the full
message spine, and returned structured findings that were checked against the
commit record before anything went in the page.

Two figures were corrected while building it, both recorded in the page footer:
the commit corpus, and a first message count of 437 that was inflated by system
notifications. The true figure is 341.

## Regenerating the numbers

`node scripts/session-stats.mjs` from the repo root refreshes
`docs/SESSION_STATS.md` with the current counts. The page itself is a
point-in-time record and is not regenerated; write a new one rather than
editing this to say something the session did not do.

## A note on scope

This describes the session, not the product. For what the product is, read
`docs/SPEC.md`. For why things were decided, read `memory/decisions/`.
