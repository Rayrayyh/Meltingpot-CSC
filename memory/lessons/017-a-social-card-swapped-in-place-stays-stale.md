# 017 A social card swapped in place stays stale, however many times you deploy

Summary: Replacing `public/og.png` and redeploying does not change what Discord, Slack or X show, because every platform caches the embed against the image URL and the URL never moved. Put the card at `app/opengraph-image.png` instead: Next serves it at `/opengraph-image.png?<hash of the file>`, so the URL changes whenever the art does and every cache misses at once. Found 2026-09-08 when the owner's Discord kept drawing the previous card after two correct deploys.

## What happened

The card was replaced, deployed, and verified: the bytes at
https://meltingpots.xyz/og.png were byte-identical to the repo's file, and
seven crawlers fetched it. Discord still drew the old one. Nothing was wrong
with the deploy. Discord had cached the embed for the page and the image
behind its own proxy, keyed on `/og.png`, and had no reason to look again.

## What to do

- Keep the card at `web/app/opengraph-image.png`, its alt text beside it in
  `web/app/opengraph-image.alt.txt`. Next emits og:image, its type, width,
  height and alt, and appends a content hash to the URL.
- Do not also list `openGraph.images` in the metadata: a manual entry wins
  over the file convention and takes the hash away.
- Leave `twitter.images` unset. X falls back to og:image, which carries the
  hash; a second copy of the file would only go stale on its own schedule.
- The header rules that let the card be embedded follow the path, so they
  name `/opengraph-image.png` in both `next.config.ts` and `netlify.toml`.

## Forcing a refresh before the cache expires

Nothing server side clears another company's cache. Posting the link once
with a throwaway query (`https://meltingpots.xyz/?2`) makes the platform
treat it as a new page and scrape it again, which is the quickest way to see
a new card without waiting. Facebook and LinkedIn also publish scraper
debuggers that re-fetch on demand.
