# 040 The flashcard face is a printed card

Superseded by 042 on 2026-09-08: the art is gone and the face is a color chosen in settings. The theme call in point 2 still stands.

Summary: The flashcard's two faces carry the brand's cream card art (the pot, the blobs) instead of a plain surface, with the light theme's ink on them in either theme, and a soft paper veil under the words so long answers stay readable; the owner asked for the art on 2026-09-05, and the theme call is the reason a cream card sits on the dark desk unchanged.

The owner supplied the art (the ChatGPT image of 4 September at the repo root) and asked for it as the background of the "boring white" card. Three calls were made in placing it:

1. The art's own painted frame is cropped out of the served file, so `background-size: cover` never shows a stray edge whatever the card's aspect ratio; the card draws its own border. The file is a 62 KB JPEG at `web/public/brand/flashcard-face.jpg`.
2. The face keeps the light theme's ink and primary tokens in dark mode too. A card is a physical object on the desk; darkening the paper would hide the art the card is for, and light ink on cream is what a card looks like in any room. The tokens are overridden on the face's class alone, so nothing else on the page changes.
3. A radial paper veil sits under the words. The centre of the art is plain, but a long answer reaches the blobs at the right; the veil keeps it legible without flattening the art.

The class lives in `app/globals.css` as `.mp-flashcard-face`, on `CardFace` in `components/study/flashcard-session.tsx`. Recorded in both themes before it was committed; the stills and the clip went to the owner first.
