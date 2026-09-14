# How kolejain.com collapses its sidebar card

Measured from the owner's screen recording on 2026-09-05 and read out of the live site's
stylesheet, because the owner asked for "the same animation and method", and an approximation
of a motion is not the same thing as the motion.

## The markup

From the served HTML at https://www.kolejain.com/ , the card is a single anchor:

```html
<a href="/submit"
   class="announcement overflow-hidden flex-shrink-0 flex-vert gap-xs padding-xxs
          border-thin border-radius-md bg-1 svelte-s19pjz show">
  <img class="border-radius-sm" src="/images/Frame 1814106577.webp" alt="announcement">
  <div class="text-box flex-vert gap-xxxs svelte-s19pjz">
    <h4 class="nowrap">Got a website or SaaS?</h4>
    <h6 class="text-sub nowrap">Have it redesigned free, on youtube!</h6>
  </div>
</a>
```

## The whole stylesheet for it

From `_app/immutable/assets/0.p-mS5E0n.css`:

```css
.announcement.svelte-s19pjz      { padding-bottom: var(--sm); opacity: 0%; transition: opacity .1s }
.announcement.svelte-s19pjz.show { opacity: 100% }
.text-box.svelte-s19pjz          { padding: 0 var(--xxs) }
@media screen and (max-width:930px) { .announcement.svelte-s19pjz { display: none } }
```

That is all of it. There is no transform, no scale, no translate, no spring, and no
transition-delay.

## The method, which is the part that matters

The card does not animate itself. It is a plain block inside the rail, and the rail is what
moves:

```css
.sidebar-cont { width: 192px; transition: width 1s var(--transition) }
.sidebar-collapsed { width: 39px }
```

So the shrink you see is not a `scale()`. It is the card being reflowed by a container whose
width is animating over a second. The image is width-relative, so it scales; the two text lines
are `nowrap` inside an `overflow-hidden` card, so they are clipped by the moving edge rather
than rewrapping into a taller box; `flex-shrink-0` stops the card being squeezed vertically
while that happens. The only thing the card animates is opacity, and it does that in a tenth of
a second.

## Measured timings

Per-frame mean luminance of the card region, 30fps, from the recording:

| Event | Frames | Reading |
| --- | --- | --- |
| Collapse | t=0.900 to t=0.967 | 173.7 to 242.9, gone in about 67ms |
| Expand, opacity | t=2.400 to t=2.500 | 245.6 to 219.5, a fast step |
| Expand, geometry | t=2.500 to t=3.133 | 219.5 to 173.7, a smooth ramp |

The second cycle repeats it: collapse at t=3.567, expand at t=4.933 to t=5.600.

Read that table carefully, because the obvious reading of it is wrong. The card does not fade
out quickly and fade in slowly. Opacity moves in 0.1s in BOTH directions with no delay. The long
ramp on the way back is not a fade at all, it is the rail's one second width transition letting
more of the card back into frame. Anything that reproduces the slow return as an opacity or
scale curve has copied the appearance and missed the method.

## What this repository had instead

`web/app/globals.css` carried a transform and a long delayed reveal:

```css
.mp-nav-alerts { transition: opacity .35s <ease> .55s, transform .35s <ease> .55s }
html[data-nav="collapsed"] .mp-side .mp-nav-alerts {
  opacity: 0; transform: translateY(6px) scale(.97);
  transition-delay: 0s; transition-duration: .15s;
}
```

Two faults against the reference. The `translateY(6px) scale(.97)` is a motion the reference
does not have, and it fights the reflow that produces the real effect. The 0.55s delay on the
way in means the card arrives after the rail has finished opening, so it lands rather than pops.
