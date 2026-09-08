# 044 A broken page wears the 404's face, and a refused session reads as signed out

Summary: The error boundaries (error.tsx and global-error.tsx) render the 404 design with "5 pot 0" and "Something boiled over", through one shared frame; a Clerk session Postgres refuses now reads as signed out with the reason in the server log, so the sign in form says sign in is unavailable instead of every page crashing; and the public pages carry the metadata, robots, sitemap, llms.txt and structured data a crawler or a model needs. Owner's asks on 2026-09-08 after a friend's new account hit "Something went wrong".

## What happened

A friend created an account on meltingpots.xyz and every page after that showed the generic error boundary. The logs said why: PostgREST answered PGRST301, "No suitable key was found to decode the JWT", for the new account's Clerk session, browser and server alike. Clerk signs with the key at clerk.meltingpots.xyz/.well-known/jwks.json; Supabase's third-party auth entry does not hold it, so it has to be removed and added again in the dashboard, which only the owner can reach. No Clerk token had ever been accepted since the switch; the morning's checks were made from outside.

The same logs showed a second fault of our own: 0057 banned the moved accounts with `banned_until = 'infinity'`, which GoTrue's Go driver cannot scan, so a password sign in for one of those addresses answered 500 rather than a refusal. 0059 gives the same ban a date.

## What changed

- `clerkServerAuth.getUser` catches the seam's not_configured refusal, logs it, and answers nobody. The protected page sends the person to sign in; the form, meeting the same refusal on submit, says "Sign in is not available on this site right now". True, and no vendor named. The refused helper's comment used to argue the opposite (nobody would loop); it does not, because the sign in page signs nobody in by itself.
- `components/errors/melt-frame.tsx` holds the 404 design; `not-found.tsx`, `error.tsx` and the new `global-error.tsx` render it with their own digits, words and actions. The error pages print the digest as a reference line and to the console.
- Sign up asks for the password twice. The owner remembered a confirm field that never existed; it does now, and the specs fill it.
- SEO: `metadataBase`, description, Open Graph and Twitter cards with a rendered `og.png`, a canonical per page, `app/robots.ts` (all crawlers welcome on the public pages, private paths disallowed, sitemap named), `app/sitemap.ts`, `public/llms.txt` in the llmstxt.org shape, schema.org WebSite and SoftwareApplication data on the landing, `X-Robots-Tag: noindex` on every private path, and noindex on the sign in doors.

## Left on purpose

The custom 404 was already live on meltingpots.xyz (Bricolage digits, "This page melted away"); the owner asked whether it was, and it is. A signed in walk of the live site waits on the owner re-saving the Supabase entry; the probe account probe.mtsttlzz@meltingpots.xyz created for the reproduction can be deleted in the Clerk dashboard.
