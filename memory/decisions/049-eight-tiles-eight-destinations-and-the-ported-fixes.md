# Eight tiles, eight destinations, and the fixes the older repository already had

Chosen 2026-09-12 by the owner, in one instruction: point each bento tile at
the part of a page that describes it, and bring across the commits this
repository was forked before.

## Which repository

`Rayrayyh/Melting-Pot`, with the hyphen. Four repositories share the name and
three of them are live, so it is worth writing down:

| Repository | What it is |
|---|---|
| `Rayrayyh/Melting-Pot` | The August build carried on into September. Holds the commits below. Last pushed 2026-09-04. |
| `Rayrayyh/Meltingpot-CSC` | This one. Cloned from that repository at `f2cab37`, 2026-09-03. |
| `Rayrayyh/Meltingpot` | The Prometheus August entry, frozen at 2026-08-23. |
| `Rayrayyh/MeltingPot-Closed` | Private, also frozen at 2026-08-23. |

`docs/CSC_HACKATHON.md` said four commits were missing. There are five: it
missed `68c4998`, which is a real bug fix.

## What came across, and what did not

**Ported, because the bugs are here.**

`e1491ea` the practice test. Two faults. The reasoning model cannot write a
five question test inside Netlify's 26 second ceiling at any Pot size this
class has: measured on the live site, every run died at about 25.5 seconds and
only a three note Pot finished. Study material is written by the fast model
throughout now, and the reasoning tier is reserved for the teaching readout,
which is the one call with no rule-based fallback. Underneath that, the mixing
budget counted from the moment mixing began, several seconds after the request
arrived, so the total overran 26 and the platform severed the call: the route
deadlines the model call from the start of the request instead, which turns a
gateway error into the sentence the route always meant to send.

`68c4998` the prompt's own label. Source notes are numbered "SOURCE NOTE 1:
<title>" so a question can point at one, and the fast model copies the whole
label back into `sourceNoteTitle` where the reasoning model did not. Swapping
the model made this visible, which is why the two commits arrived five minutes
apart. Stripped in the normalizer, the layer that already refuses to trust
what comes back, with a test for the strip and a test that a real title
beginning with the word Sources survives.

`dd17658` the documents. Four of the five files it corrected are wrong here in
the same way. `CLAUDE.md` still said the AI organizer was deterministic with
no live model calls, which stopped being true on 2026-08-31 and matters more
here than there: this hackathon requires an AI-use disclosure and it is written
from that file. `UI_CHECKLIST.md` read as a current score for an audit of
2026-08-24 that nothing since has been run against. `SPEC.md` and
`DESIGN-DIRECTION.md` still specified Lucide icons and a forest green primary,
both superseded in August; the lines stay, because a spec is a record, and
each now carries a note. `memory/README.md` indexed none of the 51 decisions
and 19 lessons, and is regenerated from the files on disk, including the four
numbers two notes share.

**Not ported, because it is already here.** `f49e4d2` put the class's own
names into the landing mockups and the styleguide. This repository already
carries Rayyan, Ibrahim, Adam and Ahmad in both.

**Not ported, because it would be wrong.** `61062c8` corrected a README
against what shipped and replaced six screenshots. This README was rewritten
for this hackathon and its test counts are its own; copying 2026-09-03
screenshots from another repository would put older artwork under newer copy.
The screenshots here are stale for a different reason, which is that the
landing changed today, and they want re-shooting rather than importing.

## Eight tiles, eight destinations

Every tile in section two has been clickable since `a825810`, but five went to
`/how-it-works`, two to `/classes` and one to `/contributions`, all landing at
the top. Clicking Calendar and clicking Version history put a reader in the
same place with nothing to say which feature they had asked about.

Each tile now links at the section that describes that one feature:

| Tile | Lands on |
|---|---|
| Contributions | `/contributions#how` |
| Version history | `/classes#history` |
| Calendar | `/classes#calendar` |
| Collaboration | `/classes#roles` |
| Shared notes | `/classes#shared-notes` |
| Study tools | `/classes#study` |
| AI summaries | `/how-it-works#organizing` |
| Search | `/classes#search` |

The calendar had no destination: it is a shipped surface and no public page
said so. Rather than send that tile somewhere that merely mentions it, the
"Everything a course collects" list gained a fifth card for the calendar as
planner and record. Anchors carry `scroll-mt-24` so a heading does not arrive
hard against the top of the window.
