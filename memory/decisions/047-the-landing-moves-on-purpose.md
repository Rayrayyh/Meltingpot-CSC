# The landing fits the screen, and moves on purpose

Chosen 2026-09-11 by the owner, in three asks over one sitting: fit more of
the page on screen, make the bento feel interactive and premium and give it
buttons to explore, and add smooth micro animations with GSAP.

## Fitting the screen

The owner asked whether the site could be zoomed out. Measured first, because
the literal answer is wrong. At 1920 by 1000 the hero was 1007px tall and
section two 1308px; at 1440 by 900 they were 990 and 1132. A browser style
`zoom: 0.85` on `main` brought section two only to 1112px and shrank every
word on the way: the bento is width driven, so zooming out widens the viewport
and the grid simply grows back to its 1672px cap.

What works is a second ceiling. `.bento-frame` is now
`max-width: clamp(1100px, calc((100svh - 280px) * 1.7768), 1672px)`. 1.7768 is
1672/941, so the cap is whatever width yields a height that fits once the
section's own chrome is paid for; 280px covers the two 64px pads, the heading
block and the gap under it. The floor is where the tiles stop being a picture
and stack anyway. With the rhythm tightened (py-24 to py-16, and 56px to 40px
under the heading) section two is 975px at 1920 by 1000 and 875px at 1440 by
900: heading, subhead and all eight tiles in one screen at both.

This is smaller than the sheet only on large monitors. A 1440 laptop was
already rendering the grid at 1360px wide.

## The bento stops being only a picture

Decision 046 built section two as a reproduction. It read as a poster. Three
additions give it a surface without moving a tile off the reference geometry:
a lift and shadow on hover, a soft light that follows the pointer across the
tile under it, and a link.

The light is `.bento-tile::before`, painted above the tile's own content so it
reads as light on glass, resting at zero opacity so an untouched tile looks
exactly as the sheet draws it. `BentoPointer` writes `--mx` and `--my` from one
listener on the grid. It is deliberately not the React Bits Magic Bento the
owner looked at on 2026-09-10: no tilt, no magnetism, no particles, because
those move tiles off the alignment 046 exists to keep.

Four tiles already carried a drawn button the sheet puts in their header. The
other four are too narrow for one, so they take a whole tile link whose chip
rests hidden and comes up on hover or keyboard focus, and simply stays for a
pointer that cannot hover. Open: all eight still resolve to only three public
pages, because `/how-it-works`, `/classes` and `/contributions` carry no
section anchors. Eight distinct destinations needs anchors on those pages.

## Micro animations

GSAP was already the stack's timeline library and already drove the scroll
stopper. `@gsap/react` was added for `useGSAP()`, which runs in a layout
effect, so start states land before first paint and there is no flash of the
finished hero, and which reverts cleanly under React 19.

Four landed. The three headline lines rise out of their own masks on an 85ms
stagger with the supporting copy and buttons following into the gap. The
product shot arrives last and then drifts to `yPercent: -7` on a scrubbed
ScrollTrigger, riding `yPercent` so it never fights the `y` its entrance used.
The Get started pill leans toward the pointer through `gsap.quickTo`, which
re-aims one tween per axis instead of starting an animation per event, capped
at 7px so the hit area never leaves the label. And the bento's two numbers
count up while the contribution heatmap fills January to June, each once, the
first time it scrolls in.

Every one sits inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`,
so the preference gets the static page rather than a faster animation. The
magnet also requires a fine pointer. The counters write zero in the same
layout effect that schedules them, so the real figure in the markup never
flashes on the way down, and all of it is inside aria-hidden chrome.

## Flagged, not decided

Animating "128 total contributions" makes a fabricated illustration number
read more like live class data. That is the tension 046 already recorded about
that tile, now sharper. The owner kept it.
