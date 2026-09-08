# Clerk behind the seam

How to move sign in from Supabase Auth to Clerk, what is already built, and what
is left for the person with the dashboards. Written 2026-09-05 after the owner
asked for the groundwork; decision 041 holds the reasoning. Nothing here is
switched on: the live site runs Supabase Auth until `NEXT_PUBLIC_AUTH_PROVIDER`
says otherwise.

## Where this stands

The owner asked on 2026-09-06 to go through this first, Google Classroom after.
This list is the walk-through's memory: update it at every exchange, since a
session that starts fresh reads it before anything else.

| Step | State | Notes |
|---|---|---|
| Code and migrations 0054 to 0056 | Done, commit bdb6b4d | Reviewed adversarially; nothing switched on |
| 0. Domain | In progress, 2026-09-06 | Owner registered meltingpots.xyz at the .xyz registry (auto renew on, expires 2027-09-07). Registrar contact verification pending (14 day window). Plan: Netlify DNS for the main site first, Clerk production records later; see "The domain" below |
| 1. Clerk application and settings | In progress, 2026-09-08 | Application "Meltingpot" exists (Development, Student workspace). Settings 1.2 to 1.7 still to do; menu names corrected against Clerk's docs on 2026-09-08 |
| 1.6 Keys sent back | Waiting | Publishable key may be pasted here; the secret key goes straight into Netlify and .env.local |
| 2. Supabase third-party auth | Not started | Needs the Clerk domain from step 1.4 |
| 3. Netlify variables and redeploy | Not started | Three variables, then a deploy |
| 4. Existing accounts | Not started | Only the seed and test accounts exist on meltingpot-csc; decide whether to import or recreate |
| 5. Checks on the live site | Not started | The list under step 5 |

## What is already in place

- `web/lib/auth/clerk-client.ts` and `clerk-server.ts` implement the seam
  (`docs/AUTH.md`) against Clerk's SDK: sign in, sign up, sign out, password
  change, and the authenticator app second factor through Clerk's TOTP. The
  method names are the product's, so no call site changes.
- `web/lib/supabase/client.ts` and `server.ts` hand Clerk's session token to
  Supabase when Clerk is the provider. Supabase verifies it through third-party
  auth (step 2 below). The browser client waits for clerk-js before its first
  query; the server client is built from supabase-js directly, since the ssr
  wrapper cannot carry a token supplier.
- Migrations `0054_identity_behind_the_seam.sql` and
  `0056_storage_asks_current_uid_too.sql`, applied. Every policy, in the public
  schema and on storage, and every definer function asks `public.current_uid()`
  instead of `auth.uid()`. For a Supabase token that is the same uuid; for a
  Clerk token it is the profile carrying that subject as `clerk_id`, or a uuid
  derived from the subject for someone new. `ensure_profile()` makes the row on
  first arrival, called from the browser the moment a Clerk session opens and
  from the server on the first render, whichever comes first.
  `has_required_aal()` reads Clerk's `two_factor` and `fva` claims. The
  foreign key from profiles to `auth.users` is gone (a Clerk profile has no
  such row) and a trigger on `auth.users` deletion does what its cascade did.
- `web/proxy.ts` runs `clerkMiddleware()` over the same protected prefixes when
  Clerk is the provider, and sends a session that enrolled its second factor
  without clearing it to the verify step; `app/layout.tsx` mounts
  `ClerkProvider` with telemetry off; the content security policy in
  `next.config.ts` allows Clerk's Frontend API host (read off the publishable
  key), its avatar host, its bot check and protection hosts, and the blob
  worker that keeps the token fresh.
- Seven route handlers and one component that read the user straight from
  Supabase now read it from the seam, which under Clerk is the only way.

## What the owner does

### 0. A domain, before production

A Clerk production instance needs DNS records (CNAMEs for its Frontend API
and account portal) on a domain you control. `meltingpot-csc.netlify.app` cannot
carry them. Until meltingpots.xyz answers on Netlify (section 0a), Clerk runs
as a development instance: it works on any address with the `pk_test` and
`sk_test` keys, the site itself looks the same (the product uses its own
forms, not Clerk's components, so no development mark appears; the Clerk
dashboard carries the banner), session state travels in a `__clerk_db_jwt`
query parameter instead of a cookie, and it is capped at 100 users whose
accounts cannot be moved to production. So no real class enrols on the
development instance; test accounts made there are thrown away at the switch.
Everything below works on either.

### 0a. The domain, step by step

meltingpots.xyz, registered 2026-09-06. Two jobs, in this order.

1. At the registry (gen.xyz, Manage Domains): verify the contact email from
   the yellow banner first; an unverified .xyz domain is suspended after the
   window. Then Manage, Manage Nameservers.
2. On Netlify (app.netlify.com, site meltingpot-csc, Domain management, Add a
   domain): enter meltingpots.xyz and choose Netlify DNS. Netlify shows four
   nameservers of the form dns1.p0N.nsone.net; paste those four at the
   registry. Netlify then issues the certificate itself once the nameservers
   have propagated (minutes to a day) and serves www.meltingpots.xyz as a
   redirect to the apex. Nothing on the site changes.
3. After it resolves, in the repo: Canonical in
   web/public/.well-known/security.txt, the README links, APP_ORIGIN when the
   classwork variables are set, and Supabase Authentication, URL Configuration
   (Site URL and the redirect list) so the password reset email lands on the
   new domain. A deploy after the security.txt change.
4. Clerk production, only when the main site moves to Clerk: in the Clerk
   dashboard switch the instance selector to Production, give it
   meltingpots.xyz, and it lists the DNS records it needs (CNAMEs for
   clerk.meltingpots.xyz to Clerk's Frontend API, accounts. for the account
   portal, clkmail. and two _domainkey records for email). Each goes into
   Netlify DNS as a CNAME. Production keys start pk_live_ and sk_live_ and
   replace the test ones on the main site only.

### 1. Clerk dashboard

Menu names checked against Clerk's docs on 2026-09-08. The instance selector
is top left (Development until step 0 is done). Skip the Overview page's
"Agent setup" prompt: the app already speaks to Clerk, nothing is left to
install.

1. Create the application: Consumer, name MeltingPot, Email and Password on;
   Google, phone and username off.
2. Configure, User & authentication. Under Email address keep "Require email
   address" on and turn "Verify at sign-up" off; the product has no
   verification step and sign up refuses loudly if Clerk asks for one. On the
   Password tab, "Update password requirements": minimum length 8; leave
   "Reject compromised passwords" off, since that path stops a sign in at a
   status (needs_new_password) the product has no screen for.
3. Configure, User & authentication, Multi-factor: Authenticator application
   on. SMS verification code off, Backup codes off, and "Require multi-factor
   authentication" off. That last switch would give every new session a
   pending setup task the app cannot show, and the proxy would send everyone
   back to sign in forever. Save.
4. Configure, Protect, Rules: on the Bot sign-up protection row, Manage,
   toggle off Enable, Save; the product's own sign up form has no slot for the
   captcha. On the Device Trust row the same: Manage, Enable off, Save; it adds
   a mid sign in check the product does not handle.
5. dashboard.clerk.com/setup/supabase: choose the options offered and select
   "Activate Supabase integration". This adds the `role: authenticated` claim
   Supabase requires and reveals the Clerk domain to paste into Supabase in
   step 2 (on a development instance it looks like `<slug>.clerk.accounts.dev`,
   the same host the publishable key encodes).
6. Configure, Sessions, Customize session token, claims editor:
   `{ "two_factor": "{{user.two_factor_enabled}}" }`, Save. The edge proxy and
   `has_required_aal()` in Postgres read this claim to tell an enrolled
   account from one that is not; without it the database's second factor
   boundary (`docs/ARCHITECTURE.md`) does not exist for Clerk sessions.
7. Configure, API keys: the publishable key (`pk_test_`) and the secret key
   (`sk_test_`). Send the first one and the Clerk domain from step 5 here;
   the secret key goes into Netlify and `.env.local` by your own hand.

### 2. Supabase dashboard

Authentication, Sign In / Providers, Third-party auth, Add provider, Clerk,
paste the Clerk domain from step 1.5. Postgres then accepts Clerk session
tokens, and `current_uid()` turns their subject into a profile id. The Free
plan covers it (50,000 third-party monthly active users included); a changed
domain or rotated keys can take up to 30 minutes to be honoured, since
Supabase caches the signing keys.

### 3. Variables

Netlify (all scopes, production context), and `.env.local` for development:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_AUTH_PROVIDER` | `clerk` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | from step 1.6 |
| `CLERK_SECRET_KEY` | from step 1.6 |

Then redeploy: the functions read variables at deploy time, and the content
security policy is computed from the publishable key at build time.

### 4. Existing accounts

Clerk's Backend API imports users with their bcrypt hashes, so nobody has to
reset a password. For each imported account, set `profiles.clerk_id` to the
Clerk user id so the person keeps their uuid and everything attached to it,
and do it before that person signs in through Clerk for the first time:

```sql
update public.profiles set clerk_id = '<clerk user id>' where id = '<profile uuid>';
```

An account that is not mapped when it first signs in gets a fresh profile,
derived from its Clerk id, carrying that `clerk_id`, and sees an empty vault.
The update above then fails on `profiles_clerk_id_key`, because the id is
taken. Recovery, in one transaction: move anything the person made in the
meantime from the derived profile to the old one (memberships, contributions,
study attempts, preferences; a Pot they created blocks the delete until its
`owner_id` is moved too), then
`delete from public.profiles where clerk_id = '<clerk user id>';` and run the
update. Mapping first is the easy order.

### 5. Check

`docs/CLASSWORK_VERIFICATION.md` has the habit; the same applies here. Sign up
from a class code and land in the Pot, which proves the profile row exists
before the membership is written; sign in, sign out; change a password (the
panel asks for the current one under Clerk) and confirm the other session
ended; turn the second factor on, expect one code ask on the next protected
page, sign in with a code, turn it off; open a Pot and share a note, which
proves the token reaches Postgres and `current_uid()` resolved it; attach a
picture to a note and upload a profile picture, which prove the storage
policies from 0056. The end to end suite's login helper still speaks Supabase;
moving it to `@clerk/testing` tokens is part of the switch, not the groundwork.

## Things to know

- `auth.uid()` is now wrong to write anywhere in this project. Policies and
  functions ask `public.current_uid()`, storage policies included. A new
  migration that says `auth.uid()` works for Supabase sessions and silently
  fails for Clerk ones.
- Turning on two step sign in does not clear the factor for the session that
  did it: Clerk stamps the second factor's age at sign in and at
  reverification, not at enrolment. So the next protected page asks for a code
  once, through the same verify step a fresh sign in uses, and that
  reverification is what makes the database's gate agree. Under Supabase the
  enrolment itself upgraded the session; this is the one visible difference.
- Deleting a user in the Clerk dashboard tells Postgres nothing. The trigger
  from 0054 covers `auth.users` rows, which a Clerk profile does not have, so
  after deleting a Clerk user run
  `delete from public.profiles where clerk_id = '<clerk user id>';` yourself
  (a Pot they own blocks it until `owner_id` moves). A Clerk webhook for
  `user.deleted` could do this later; it is not built.
- If Supabase refuses a Clerk token (step 2 not done, or the Supabase
  integration in step 1.4 not activated), protected pages fail with a message
  naming the step rather than signing nobody in, which would have looped
  between the sign in form and Home.
- Identity in the app is the profile uuid, never Clerk's user id. `AuthUser.id`
  is the profile id under both providers.
- With Clerk as the provider, supabase-js refuses its own `auth.*` methods; the
  seam is the only way to ask who is signed in, which is what `docs/AUTH.md`
  already required.
- Clerk's `fva` claim carries the age of each factor. `getAssuranceLevel()`
  reads it; `has_required_aal()` reads it in Postgres.
- Rate limiting of sign in and sign up moves to Clerk. `sign_up_student` and
  its per address limit stay for the Supabase path.
