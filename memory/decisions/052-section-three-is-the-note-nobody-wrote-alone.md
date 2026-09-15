# 052 Section three is the note nobody wrote alone

Summary: The melt, a pinned before and after costing 1700px of scroll to claim that a tool tidies text, is replaced by a single reframe and one shared note with three names and an open question on it; one screen, no pin, server rendered, and the only motion is a hover that lifts the raw scrap.

## What was decided (2026-09-15)

The owner asked what section three should be, since the melt was "a generic
scroll stopper that doesn't convey much". Research across Raycast, Obsidian and
Readwise, and a five lens critic panel on six headline treatments, produced
this. It is a design decision with a product claim inside it, so it is written
down rather than left in the diff.

## What was wrong with the melt

Six things, all visible in one screenshot of it:

1. A before and after diptych, which is the most templated section on an AI
   product landing.
2. Four green ticks in the corner. Green is reserved for success states in the
   token file, and a feature checklist is stock furniture.
3. An eyebrow, "The melt", above a heading that said the same thing. Section
   two had already dropped its eyebrow for that reason.
4. Half the section was empty: the left column ran out after four lines of
   mono while the right column ran on for another 560px.
5. The headline described the mechanism, and the mechanism is the claim every
   AI notes tool makes. Nothing in the picture was something a competitor
   could not screenshot.
6. It spent `calc(100dvh + 1700px)` of layout and a scrubbed GSAP timeline to
   say it, which made it the longest section on the page.

## What replaced it

One reframe on the left, one artifact on the right.

> Nobody in that room took a complete set of notes. **Together, they did.**

The artifact is a single shared note with three names on it and the raw scrap
it came from still lying behind it. The line that does the persuading is the
last one on the card: a question Dev asked that nobody has answered, left on
the note. That is the product rule made visible rather than asserted, and no
competitor puts an open question on their landing page.

Deliberately not the correction story. `NamesOnTheNote` further down the page
is about a sentence being challenged, reviewed and kept in version one; this
one is about the gap, meaning what no single person in the room wrote down.
Different claims, different evidence, no overlap in names.

The clay tinted block inside the card uses clay rather than the diff tokens:
nothing there was added to an existing note, so `added` and `removed` would be
saying something untrue about its state.

## The headline, and why it is two signals

Four of five critics picked the treatment where the payoff is both orange and a
step up in size, over the plain orange payoff, a rule above the headline, a
single orange word, and a uniformly larger headline.

The size step is not decoration. Orange alone puts the whole emphasis on hue,
which goes soft in grayscale, in forced colors, and in dark mode where the
light ink and the lighter orange land close in luminance. With the size step
the emphasis is encoded twice and survives all three. The concession stays at
full size in full ink, so nothing is demoted and the whole heading still reads
as one heading to a screen reader.

Three constraints came out of this and are worth keeping:

- The payoff is `1.18em` of the heading, not a second pixel size, so the ratio
  holds at every breakpoint and at 200 percent zoom.
- It is held to one line. A payoff that wraps to leave "did." alone is a widow
  where the crescendo should be. Below `sm` the heading is therefore sized from
  the viewport, `clamp(1.5rem, calc((100vw - 3rem) / 10.6), 2.125rem)`: holding
  one line is a constraint on width and only a width can satisfy it. A fixed
  32px heading put the payoff ten pixels past a 320px screen and the whole page
  scrolled sideways.
- The heading keeps a measure of its own, `lg:w-[25rem]`, wider than its column
  and wider than the paragraph under it. At the column's own width the first
  sentence broke into four short lines and outweighed its own payoff four to
  one. Widening the column instead is what spoiled the uniformly larger
  variant: it squeezed the card until its title wrapped.

Orange stays `--primary` (#ab5a14, 4.55:1 on cream) everywhere in this section,
including the small label inside the card. `--clay` measures 3.69:1 there,
which clears the large text bar and nothing else.

## What it costs and what it saves

Nothing on the page got slower. GSAP and ScrollTrigger stay in the bundle for
the hero roll and the bento, so this buys no kilobytes. What it buys is 1700px
of scroll, a scrubbed timeline, a sticky viewport, a client component, and
about 190 lines of code, for a server rendered section and one CSS hover.

The hover is the only motion left: the raw scrap lifts, tilts and gains
elevation under the pointer, which is how the finished note says where it came
from. It is a `group-hover` on plain CSS, gated behind `motion-safe`, so a
reader who asked for stillness gets the composition and nothing moves. Note
that Tailwind v4 writes `rotate`, `translate` and `scale` as their own CSS
properties: a transition list naming `transform` animates none of them and the
lift snaps. The list has to name them.
