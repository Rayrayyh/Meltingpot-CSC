# React preloads every eager image, and Next preloads every font you declare

Learned 2026-09-11, measuring the landing before touching it.

React 19 hoists a `<link rel="preload">` into the document for every eager
`<img>` it renders on the server. `next/font` does the same for every family
declared, whether or not the page renders a word in it. Neither asks whether
the thing is above the fold, and both put their links ahead of everything the
page actually needs first.

On the landing that meant five image preloads and seven font preloads before
the hero had a chance:

- `/brand/pot-logo.png`, 165KB, a 610px square drawn at 28px in the header.
- Four maker faces from the footer, which nobody sees without scrolling the
  whole page.
- Bricolage Grotesque, 41KB, which only the 404 and the root error boundary
  use. `app/global-error.tsx` is a client module in the shared bundle, so its
  own font declarations reached every page in the site.
- Figtree twice, 20KB each, identical bytes at two URLs, because the layout
  declared it preloaded and the error boundary declared it not. `preload` is
  part of the descriptor next/font hashes, so the two did not dedupe.
- Source Serif 4 and Silkscreen, both genuinely on the page but both far
  below the fold.

The same trap had already been found once, for the 404 artwork, and the fix
recorded in `melt-frame.tsx`: `loading="lazy"` opts an image out of the hoist.
It was never generalised, so the footer kept doing it.

## What to check

- Read the served HTML, not the component: `curl <url> | grep 'rel="preload"'`
  says exactly what the page asks for first.
- Any `<img>` below the fold wants `loading="lazy"`, and that is a
  performance fix rather than a nicety.
- Any font not used above the fold on most pages wants `preload: false`.
- Two declarations of one family must agree on every option, `preload`
  included, or the same bytes ship twice.
- An asset's file size should be read against the size it renders at. A 610px
  master for a 28px mark is 150KB of nothing.
