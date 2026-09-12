# The hero headline rolls, and the hero stops waiting on things it does not need

Chosen 2026-09-11 by the owner: make the landing load fast, put skiper-ui's
skiper27 on the hero headline, and raise the headline five pixels.

## The component is not theirs, and could not be

skiper27's source is behind that project's Pro licence. Its registry endpoint
answers 401, "Missing license key. Add your Skiper UI Pro license to
components.json / .env.local", and the install line on its page is for Pro
subscribers. So `components/landing/rolling-text.tsx` is not their code. It is
the behaviour their page documents and their recording shows, which the owner
supplied: letters rolling over vertically, staggered outwards from the middle
of the line, triggered when the line is reached. Their prop names are kept
(`text`, `speed`, `duration`, `className`) so a licensed copy could replace it
without touching a call site.

Their demo cycles between two phrases, letters rolling from one onto the
other. The component takes a phrase list and does that. The hero ships with
one phrase, so each letter turns over onto itself: cycling needs a second
headline, and writing hero copy is the owner's call, not a side effect of
installing a component.

Five pixels went on inside the clamp rather than on its ends, so the whole
size curve moves: `clamp(calc(2.1rem + 5px), calc(3.4vw + 5px), calc(3.4rem + 5px))`.

## Why the letters are readable before they move

The headline is the largest text on the page, so it is what a browser measures
for the largest contentful paint, and text that animates in from nothing is
not painted until it arrives. Every letter therefore rests on the real phrase
and rolls from there, and only the resting phrase is a document text node:
the faces under it are painted by CSS from an attribute, so the page's copy is
the headline once rather than every letter repeated once per phrase.

## What was actually slow

Measured first, which changed the plan. Nothing in the hero's own code was the
problem; the problem was what the page asked for before it.

React hoists a preload for every eager image and next/font preloads every
declared family, so the landing opened five image preloads and seven font
preloads, most of them for things below the fold or on other pages entirely.
`memory/lessons/019` has the full account. The fixes: the brand mark is a
192px WebP (15KB) instead of a 610px PNG (165KB) drawn at 28px; the footer's
four maker faces are lazy; Bricolage, Silkscreen, Source Serif and Figtree are
declared `preload: false`; and the root error boundary's font declarations now
match the layout's exactly, which stopped Figtree shipping twice.

Measured on the production build, same machine, before and after:

| | before | after |
|---|---|---|
| Image bytes | 215KB over 7 requests | 35KB over 3 |
| Font bytes | 236KB over 7 requests | 194KB over 6 |
| Preloaded ahead of the hero | 5 images, 7 fonts | 1 image, 3 fonts |
| First contentful paint | 411ms | ~350ms |

The three fonts still preloaded are the three the hero is set in. Source Serif
still loads, because the melt section's note bodies are genuinely set in it,
but it no longer competes for the first connections.
