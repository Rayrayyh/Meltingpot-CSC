# 041 Clerk groundwork, without switching

Summary: On the owner's word, everything Clerk needs that does not need Clerk's dashboard was built on 2026-09-05 and left inert: the seam's Clerk halves, token plumbing into Supabase, a proxy branch, the content security policy, and migration 0054, which puts `public.current_uid()` in front of every policy and function so a non-uuid subject can be a person. The live site still signs in with Supabase Auth; `NEXT_PUBLIC_AUTH_PROVIDER=clerk` is the switch, and `docs/CLERK.md` is the owner's list.

## The choice that mattered

Two routes could make Postgres trust a Clerk session. Minting a Supabase session after Clerk signs someone in keeps every policy untouched, but it needs a signing secret in Netlify that can produce any person's token, and the architecture's whole claim (`docs/ARCHITECTURE.md`, boundary 2) is that the deployed app holds no such power. Supabase's third-party auth keeps that claim: Postgres verifies Clerk's token itself. Its price is that `auth.uid()` fails on a Clerk subject, so the 25 policies and 40 functions that used it had to change.

They changed mechanically, not by hand. Migration 0054 rewrites them from their live definitions in one DO block with a single substitution, which is lesson 011 applied at scale: nothing that was not looked at could be lost, because nothing was retyped. `has_required_aal()` is the one hand-written body, since it needed to read a different claim. The loop looked in one schema, though, and the adversarial review found the six storage policies it had missed; 0056 rewrites those by hand, and drops the one clause that cast storage's `owner_id` to uuid, since the contribution's author already proves ownership.

## Identity is the profile id

`AuthUser.id` stays the profile uuid under both providers. A Clerk subject maps to it through `profiles.clerk_id` (imported accounts keep their uuid) or, for someone new, a version 5 uuid derived from the subject under a fixed namespace, which `ensure_profile()` also uses for their row. Nothing above the seam learns which provider signed the person in, and no table changes type.

## What follows from profiles no longer mirroring auth.users

The foreign key from `profiles.id` to `auth.users` is dropped, because a Clerk profile has no `auth.users` row. A trigger on `auth.users` deletion does what the cascade did, so `dev_seed()` and any future account deletion behave as before for Supabase accounts. Deleting a Clerk user is a dashboard act Postgres never hears about, so for Clerk profiles deletion is a line of SQL the owner runs (`docs/CLERK.md`) until a webhook is built.

## What the review changed

Three lenses read the migration, the provider halves and the wiring, read only against the live database. Besides the storage policies: the ssr wrapper's server client cannot carry a token supplier (it subscribes to auth events as it constructs, which supabase-js forbids once `accessToken` is set; the browser client spreads the option through untouched), so the Clerk server client is built from supabase-js directly and a unit test holds the fact; the browser's token supplier now waits for clerk-js, since a query on mount went out as anon before; the profile row is made from the browser the moment a Clerk session opens, because the sign in form's next act is a class code join that writes against profiles before any server render has run; a wrong password read as a weak one, from a prefix test shadowing the exact code; Clerk wants the current password for a change, so the panel asks for it under Clerk only; a session that enrolled its factor is sent to the verify step, where Clerk's session reverification stamps the factor's age into the token for the database and the server to read; and a Supabase refusal of a Clerk token now fails a page loudly, naming the setup step, instead of signing nobody in and looping between the form and Home. The `two_factor` session claim moved from optional to required, so the edge, the server and the database agree on who is enrolled.

## Left deliberately

- The switch itself, and a domain: Clerk production needs DNS records the netlify.app subdomain cannot carry. Until meltingpot.io or another owned domain points at Netlify, Clerk is a development instance.
- The end to end login helper still speaks Supabase; `@clerk/testing` tokens come with the switch.
- Email verification at sign up has no step in the product; the browser half refuses with `not_configured` if Clerk asks for it, and the doc says which switch to turn off.
- The recommendation stands (given the same day): not before 5 October. The groundwork means the switch is an afternoon plus a domain, not a rewrite.

## The second review, against the vendors' own pages

On 2026-09-08, with the owner at the Clerk dashboard, six lenses read Clerk's and Supabase's documentation and the installed SDKs against the code and the owner's steps, and thirty one skeptics tried to refute what they found; sixteen claims held. Three changed the code. Opening a Clerk session refreshes the current route from the server (the provider's own hook), so the sign in and sign up pages now send a signed in person exactly where the form's finish would, and the race cannot matter. Clerk refuses password and factor changes ten minutes after sign in until the person proves themselves again; the seam runs that reverification and the settings panels ask for the password or the code that clears it. And an `email` claim spares every page a Backend API call (100 per 10 seconds on a development instance, which a class online at once would exceed). One finding did not survive the dashboard: the review read Clerk's shortcode docs and concluded `{{user.two_factor_enabled}}` was not a shortcode, and a metadata mirror was built in its place; the claims editor's own list offers `user.two_factor_enabled`, the owner's screenshot showed it, and the mirror was removed the same day in favor of the field itself. The rest corrected the owner's steps: bot protection lives under Protect, the Supabase integration is its own setup page, "Require multi-factor authentication" must stay off or every session is pending forever, development instances cap at 100 users who never move to production, and going to production repeats the integration, the claims and the Supabase domain.
