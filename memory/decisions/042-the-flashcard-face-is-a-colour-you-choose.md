# 042 The flashcard face is a colour you choose

Summary: The card art from decision 040 is gone from the flashcard face. Its paper is now one of six colours picked in settings, a light orange by default, white among the rest, and only colours that keep every ink on the face at body text contrast made the list; the owner asked for it on 2026-09-08.

## What changed and why

The owner had asked for the pot art as the flashcard background three days earlier and then, seeing it in use, asked instead for a plain colour the person can choose: a lighter orange to start, white when needed, and a few more as long as the text stays readable. The art is deleted rather than kept as an option; a card that is sometimes a picture and sometimes a colour is two designs.

## Which colours, and how they were chosen

Peach (the default, `#f7dfc6`), white, cream, butter, sage and sky. Thirteen candidates were measured against the four inks the face paints: the ink itself, the muted and faint inks, and the primary. Only white and cream cleared 4.5 to 1 for all four with the page's own faint and primary tokens, because `#756f5e` and `#ab5a14` sit at the edge of legibility on any tint. Rather than keep two colours, the face's own faint and primary inks were deepened one shade (`#665f50`, `#964d10`), after which every tint on the list clears 4.5 to 1 for every ink, and the ones that still did not (lilac, rose, sand, mint, a warmer apricot) were left out. `lib/card-face.test.ts` measures every listed colour against every ink on each run, so a colour that fails cannot be added by accident.

## How it is kept

The same way as the theme: in this browser (`mp-card-face` in localStorage), applied before first paint by the script in `app/layout.tsx` as a `data-card-face` attribute, read by CSS alone (`--card-face` in `app/globals.css`), so the card never flashes the default. The default carries no attribute. A person who signs in on another device chooses again there, as they do the theme. The picker is `components/settings/card-face-choice.tsx`, under Appearance in account settings, six swatches and a small card that shows the choice in the ink the face always uses.

## What stays from 040

The face keeps the light theme's ink in both themes: a pale card on a dark desk is what a card looks like.
