# 053 The demo film sits after the bento, in a player we drew

Summary: The two minute demo goes in its own section directly after the bento grid, self hosted rather than embedded because the CSP refuses an iframe, behind a hand built player after ramp.com/view-demo; the section and the hero link that points at it only exist when public/demo.mp4 is actually in the repo, decided at build time.

## What was decided (2026-09-18)

The owner has a demo film and asked where it belongs. I recommended below the
three steps section; the owner placed it directly after the bento grid
instead, and that is where it is. Their reasoning holds up better than mine:
the bento has just listed eight capabilities as separate tiles, so the honest
next beat is proof that the list is one working thing, before the page starts
arguing about why a Pot should exist at all. Lower down it would also have
followed `NamesOnTheNote`, which is already an interactive demonstration, and
two demonstrations back to back is one too many.

The hero's second call to action changed from "Learn more" to "Watch the
demo" with a filled play triangle, at the owner's request. The mark leads
rather than trails: an arrow after the words means "onwards", a play triangle
means "press me", and that sits left of its label everywhere else a person
has met it.

## Self hosted, not embedded

`next.config.ts` sets `frame-src 'self'` plus Clerk, so a YouTube or Vimeo
iframe is refused outright, and widening `frame-src` to carry one file is not
a trade worth making on a site whose whole security posture is that policy.

There is no `media-src` directive, so an mp4 in `public/` falls back to
`default-src 'self'` and needs no policy change at all. Verified against a
production server rather than assumed: the file comes back `200 video/mp4`
with `Accept-Ranges: bytes`, a range request returns `206`, and the blanket
`Cross-Origin-Resource-Policy: same-origin` is right for it because a
same-origin `<video>` is exactly what this is.

## A player we drew

Native controls cannot be styled, so on a cream page they arrive as a slab of
somebody else's design language, and they differ between Safari, Chrome and
Firefox, which makes the one piece of the page every visitor is asked to
touch the one piece nobody designed. So: a resting state with one pill over
the poster, and on press a floating dark bar with play and pause, elapsed
time, a scrubber, captions, mute, playback speed and fullscreen.

The cost is that every affordance has to be rebuilt honestly, which is what
the aria labels, the real `<input type="range">` and the keyboard handling are
for. Three things came out of building it that are worth keeping:

- The bar, the pill and the speed menu take fixed colors and a dark shadow
  rather than theme tokens. They sit over film, not over the page, so they
  have to hold up against whatever frame is behind them in either theme.
  `--shadow-raised` is `rgba(36,34,44,0.08)`, tuned for cream paper, and it
  is invisible behind a dark bar.
- The bar hides after 2.6 seconds of no pointer. On a pointer device the move
  in wakes it before any click, but a phone has no move, so a tap while the
  bar is resting has to be the one that brings it back rather than one that
  silently pauses a film somebody just started.
- A focus ring keyed to `group-focus-visible/player` never rendered, because
  `group/player` is the frame div and a div is not focusable. It belongs on
  the button.

## The film is not code, so the page copes without it

`public/demo.mp4` is media the owner supplies, not something the repo can
promise. A section that renders a dead frame, and a hero that sends people to
it, is worse than a page that never offered.

`next.config.ts` therefore resolves what is in `public/` and inlines the
answer as `process.env.DEMO_MEDIA`; `lib/landing/demo-media.ts` parses it.

The film is found rather than named. `demo.mp4` wins if it is there, and
otherwise a single mp4 in `public/` is taken to be it. The owner's export is
`Meltingpot-v3-web-1080p60.mp4`, and a version in the filename would mean a
code change on every re-export. Several mp4s with no `demo.mp4` is genuinely
ambiguous, so it picks none and the build log says to rename one. Without the
film the section returns null and the hero link reverts to "Learn more"
pointing at `#explore`. Both paths were checked against a real production
server, not reasoned about.

The check runs in `next.config.ts` on purpose rather than in the server
component. The config runs on the build machine, where `public/` certainly
exists. A serverless function only reliably gets what the tracer put in its
bundle, and `public/` is deployed as static assets rather than as code, so
`existsSync` there could answer wrongly and would fail silently by hiding a
section that should be showing.

Only the film is required. The poster, the captions and the ambient preview
loop each switch on a feature when they appear, so the owner can commit the
film alone and add the rest later with no code change.

Without a poster the resting frame would be an empty box, so the film is
asked for its own first frame instead: `src` carries a `#t=0.1` media
fragment and `preload` becomes `metadata`, which makes the browser seek there
and paint it while fetching only the moov atom and the frames around it. A
real `demo-poster.png` is still better, because it costs no request at all
and can be a frame somebody chose rather than whatever sits at 0.1s.

A note for anyone verifying this in the dev container: the film is H.264 with
AAC audio, which is the right choice for the web and plays everywhere, but
the container's Chromium is the open source build with no proprietary codecs.
`canPlayType` returns nothing for every avc1 and mp4a variant there, so the
film cannot be decoded, screenshotted or played locally. The player's own
behavior was verified against a VP8 placeholder, which exercises the same
code paths.

## The heading

"From what you typed to what the class studies." Two earlier drafts were
dropped for reasons worth not repeating. "Two minutes, start to finish" sells
a runtime, which is a cost rather than a reason, and repeats the eyebrow
`/how-it-works` already carries. "One note, all the way through" would have
been the third one-something heading in the first four: the hero ends "in one
Pot" and the bento above it ends "in one place". The word "watch" is
deliberately absent from the heading, because the hero link and the pill on
the frame both say it already.
