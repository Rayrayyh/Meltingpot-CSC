# Section two is a bento of what the product does

Chosen 2026-09-10 by the owner, who produced nine reference sheets on `main`
(`68d6448`): one overall layout and one per tile.

Decision 028 made section two three doors: open the demo Pot, enter a class
code, create a Pot. That fixed a conversion problem and left a persuasion one,
because a visitor who had not yet decided anything was handed three buttons and
no reason to press one. The bento answers the reason: eight tiles, one per
thing the product actually does, in the layout the owner drew. The three doors
are not gone, they are one strip under the grid carrying `id="join"`, which is
where the hero, the header and the closing band all land. Deleting them would
have broken those three anchors and left the landing with no entry point above
the footer.

Four translations from the reference sheets are deliberate.

The reference washes every tile in a gradient. The house rule allows exactly
one gradient, inside the brand mark, so the tiles are flat token fills and the
variety comes from `paper`, `primary-soft`, `clay-soft`, `primary` and `clay`.
The two solid orange tiles in the reference become `primary` and `clay`, which
reads as the same rhythm without repeating one colour.

The reference headlines the contribution graph "Contributions make progress
visible", with a group total of 128 and a growth figure of 24 percent. In this
product that graph is a private record of one person's own days, never compared
to anyone (`CLAUDE.md`, "Product rules that are easy to violate"), so the tile
says so: "Your record is your own", and the footer line is "There is no
leaderboard anywhere in the product." A tile that advertised a class total
would have advertised a feature the product refuses to have.

The reference "Collaboration" tile is a comment feed with photographic
headshots. There is no chat in MeltingPot and avatars are a person icon in one
of six tints, so the tile is the correction loop instead: a classmate proposes
a fix with a source, a maintainer decides. Same shape, real feature.

The reference "Study tools" tile lists formula flashcards, practice problem
sets and study guides. The shipped study kinds are summary, flashcards and
practice, so the tile lists those three.

Every inner panel is fabricated demo chrome and `aria-hidden`, the convention
`HeroDashboard` already set, so only the tile headings, the copy and the two
real links reach assistive tech.

Two layout facts worth keeping. The twelve column grid starts at `xl`, not
`lg`: at 1024 the three column tiles broke words mid-syllable ("Correcti on
merged"), and the six column layout is roomier there. And the lift lives on
each tile rather than on the grid, because framer only starts a `whileInView`
animation once the fraction of the element named by `amount` is on screen, and
the whole grid is taller than a laptop viewport, so a single wrapper around all
eight never reached its threshold and left the section at opacity zero for
good. `tests/e2e/landing.spec.ts` holds the resting opacity of all eight tiles
to a test so that cannot come back quietly.
