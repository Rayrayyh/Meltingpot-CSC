# Section two is the bento reference sheet, reproduced

Chosen 2026-09-10 by the owner, in two steps.

First they asked for a bento to replace the three doors decision 028 built,
from nine reference sheets they put on `main` at `68d6448`: one overall layout
and one per tile. The first build translated those sheets into the house
system, and the owner rejected the translation: "add the gradients exactly, as
well as the contribution and collaboration cards. it should be a 1:1 copy of
the grids and meltingpot-bento.png". Then: keep the sheet's ratio, and its
exact dimensions if possible.

So section two is now a reproduction, not an interpretation.

## What that lifts

Two rules in `CLAUDE.md` gave way, both on the owner's explicit instruction
after the conflict was put to them.

**No gradients.** Every tile in the references is gradient washed. The rule
allowed exactly one gradient, inside the brand mark. It now allows a second
place: this block. Nothing else on the site gained one.

**Nothing keeps score across people.** The contribution card is headlined
"Contributions make progress visible.", with a class total of 128 and a growth
figure of +24%. That is a class-wide comparison, which the private-record rule
would otherwise refuse. It is drawn chrome inside an illustration, not a real
readout, and no such screen exists in the product.

## How the reproduction is built

The frame is the sheet: 1672 by 941, the exact pixel size of
`meltingpot-bento.png`, with the sheet's own 45px side margins, 30px top, 36px
bottom and 14px gutters. The tile rectangles are the ones the sheet actually
draws, measured off the PNG rather than snapped to an even twelve column grid:
456 / 752 / 343 across, 282 / 320 / 245 down, with the middle band splitting
752 into 421 and 317 for Collaboration and Shared notes. Rows are
`minmax(0, Nfr)` so a row holds its proportion instead of growing to fit
content.

`--u: calc(100cqw / 1672)` is one reference pixel, and every dimension in the
component is a multiple of it, so the grid scales as one picture at any width
and keeps the sheet's 1.7768 aspect ratio exactly. Below 1100px it stops being
a picture and stacks, because a legible phone beats a faithful thumbnail.

Colours were sampled out of the artwork, not guessed. The orange cards are the
one thing worth recording: they are not a top to bottom ramp but a ground that
is darkest in the core and lifts towards every edge, with a specular bloom off
the top left corner, a bright hairline rim, and soft lighter wedges cut into
the bottom corners.

## The one thing that is not 1:1

The reference's Collaboration and Shared notes tiles use photographs of people.
There are no such assets in the repo, and putting synthetic photorealistic
faces on a shipped page as if they were classmates is a different decision from
copying a layout. The circles, their sizes, their overlap and the "+3" chip are
reproduced; the faces are the app's own avatars. If the owner wants
photographs, they need to supply them.

## The heading over it, and where the ways in went

Chosen 2026-09-11, after the owner asked what professional bento grids carry
above them. An audit of around thirty shipping pages plus NN/g's layer-cake
scanning work says the same thing: a heading that summarises what sits under
it, a line of support, and an eyebrow only where a section needs a label the
heading cannot carry. Roughly half the audited grids carry an eyebrow; a few
(Supabase among them) carry no heading at all.

The old header described the problem ("The part you need is in someone else's
handwriting.") over a grid that shows eight features, so it summarised nothing
below it. It now names the grid in the product's own words, "Everything your
class knows, in one Pot.", over one line of support. The eyebrow is gone: it
was saying what the heading already said.

The three doors under the grid are gone too, on the owner's instruction, along
with the "See how the melt works" link below them. That strip held the only
code field a signed-out visitor could reach, so `/join` became it: the header
pill, the hero and the closing band all point there, and a dead invite link
that used to report itself under the landing's own field is forwarded there
with its reason (`/home` for a signed-in visitor, which has a field of its
own). `/join` left the proxy's protected list to make that work. Gating it
would have put a sign in ahead of seeing the Pot, which is the one thing the
join flow does not do; the page shows a code field and nothing else, and the
join itself still asks for an account.

Moving those strings also fixed a bug they had been sitting on. They lived in
`join-card.tsx`, a client component, and an export of one of those reaches a
server component as a module reference rather than the value: `/home` had been
reading `INVALID_CODE_MESSAGE` and getting nothing. They live in
`lib/join-messages.ts` now.

The lift is per tile rather than one wrapper around the grid: framer starts a
`whileInView` animation only once the fraction of the element named by `amount`
is on screen, and the grid is taller than a laptop viewport, so a single
wrapper never reached its threshold and left the whole section at opacity zero.
`tests/e2e/landing.spec.ts` holds the resting opacity of all eight tiles, and
the grid's aspect ratio, to a test.

## What happened next

On 2026-09-11 the block stopped being only a picture: it gained a hover
lift, a pointer light, a link on every tile, and a cap that fits the grid
to the window. `memory/decisions/047` records that and the landing's wider
motion layer.
