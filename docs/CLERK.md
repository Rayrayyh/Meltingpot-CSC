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
| 0. Domain | Live, 2026-09-08 | meltingpots.xyz answers over https on Netlify DNS (dns1 to dns4.p04.nsone.net); registered 2026-09-07 23:37 UTC, expires 2027-09-07, auto renew on. Registrar contact verification email arrives within a week; must be done then. Clerk production records only when the main site moves to Clerk |
| 1. Clerk application and settings | In progress, 2026-09-08 | Application "Meltingpot" exists (Development, Student workspace). Settings 1.2 to 1.7 still to do; menu names corrected against Clerk's docs on 2026-09-08. The owner has Clerk Pro through the student plan and asked for the production path: finish the development settings so the clone carries them, create the production instance on meltingpots.xyz (0a.4), check it on trial.meltingpots.xyz (a second Netlify site on the same database, production keys) before the main site switches. Ten real accounts exist on the database beside the seed and must be imported (step 4) before the switch |
| 1.6 Keys sent back | Waiting | Publishable key may be pasted here; the secret key goes straight into Netlify and .env.local |
| 2. Production instance | Created 2026-09-08 | Cloned from development, domain meltingpots.xyz; its checklist shows keys (pk_live_ seen), Google sign in (later), and Add DNS records (next) |
| 3. DNS records and certificates | Done 2026-09-08 | Five CNAMEs on Netlify DNS (accounts, clerk, clk._domainkey, clk2._domainkey, clkmail, targets on 72va09v0hzx7.clerk.services and clerk.services), verified by Clerk; https://clerk.meltingpots.xyz/v1/environment answers over https with instance_environment_type production, so the certificates deployed on their own and no button was needed. Google was removed from SSO connections; it comes back with custom credentials when the button is built. Passkeys stay off until the app has a screen for them |
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
- Clerk refuses a password change or a factor change ten minutes after sign in
  until the person proves themselves again. The seam runs that reverification
  itself and the settings panels ask for the one thing that clears it (the
  password before setup, a code before turning off or changing a password
  with a factor on). Under Supabase the question never appears.
- The sign in and sign up pages send a signed in person to the same place the
  form's own finish would, because under Clerk opening a session refreshes the
  page mid form and the two navigations must agree.

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
4. Clerk production, only when the main site moves to Clerk. Everything in
   steps 1 to 3 is per instance, and a production instance starts empty.
   In the Clerk dashboard select the Development button at the top, choose
   Create production instance, and in the modal clone the development
   settings (Clerk says SSO connections, Integrations and Paths do not copy).
   Enter meltingpots.xyz. The Domains page then lists the DNS records; add
   each to Netlify DNS exactly as shown (expect about five CNAMEs: the
   Frontend API at clerk.meltingpots.xyz, the account portal, and email).
   Propagation can take up to 48 hours. When every check passes a Deploy
   certificates button appears on the dashboard home; select it. If
   issuance stalls, the apex must carry no CAA record that shuts out Let's
   Encrypt or Google Trust Services. Then, with the selector on Production:
   redo step 1.5 (the Supabase integration is not cloned), check that the
   step 1.6 claims survived the clone, and in Supabase edit the Clerk entry's
   domain from `<slug>.clerk.accounts.dev` to `clerk.meltingpots.xyz` (up to
   30 minutes to be honoured). Before pasting the `pk_live_` and `sk_live_`
   keys on the main site, clear the development trial's traces from the
   database, since a development user id never exists on production:
   `delete from public.profiles where clerk_id is not null and id = public.clerk_uuid(clerk_id);`
   (a Pot such a profile owns blocks it until `owner_id` moves), then
   `update public.profiles set clerk_id = null where clerk_id is not null;`.
   Then step 4, against production only, then the keys and a deploy.

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
6. Configure, Sessions, Customize session token, claims editor. Paste and
   Save:

   ```json
   {
     "email": "{{user.primary_email_address}}",
     "two_factor": "{{user.two_factor_enabled}}"
   }
   ```

   Both are shortcodes the claims editor offers in its own "Insert
   shortcodes" list (`user.two_factor_enabled` sits there even though the
   docs page of shortcodes leaves it out, which is why an earlier draft of
   this step went through metadata instead). `email` saves the server a
   Backend API call on every page. `two_factor` is how the edge proxy and
   `has_required_aal()` in Postgres tell an enrolled account from one that
   is not; without it the database's second factor boundary
   (`docs/ARCHITECTURE.md`) does not exist for Clerk sessions. Step 5
   checks the token carries both.
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

Production instance only, after 0a.4. Clerk user ids are per instance and
Clerk does not move users from development to production, so anything mapped
against a development id goes stale at the switch. On the development instance
sign the seed and test accounts up fresh and let them be thrown away.

Clerk's Backend API imports users with their bcrypt hashes, so nobody has to
reset a password. For each `auth.users` row call `clerkClient().users.createUser`
(POST /users) with `emailAddress`, `passwordDigest` (the `encrypted_password`
column; pgcrypto's `$2a$` hashes are the shape Clerk expects),
`passwordHasher: "bcrypt"`, `externalId` set to the profile uuid (Clerk then
carries the mapping too, and its `user.deleted` event names it),
`unsafeMetadata: { displayName }` from `profiles.display_name`, `createdAt`,
and `totpSecret` from `auth.mfa_factors.secret` for anyone with a verified
factor, or they arrive without one and enrol again. Addresses are created
verified; no email is sent. The endpoint shares the Backend API limit (1000
requests per 10 seconds on production), so pace the loop. Then set
`profiles.clerk_id` to the returned user id so the person keeps their uuid and
everything attached to it, before that person signs in through Clerk for the
first time:

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

`docs/CLASSWORK_VERIFICATION.md` has the habit; the same applies here. In order:

1. Token first. Sign in with a test account and read the session token
   (decode the `__session` cookie, or log `sessionClaims` from `auth()` in a
   server component): `role` must be `authenticated`, `email` an address,
   `two_factor` present (`false` for an account without a factor; never
   null). A null means step 1.6 did not take.
2. Sign up from a class code and land in the Pot, which proves the profile
   row exists before the membership is written. Watch for a flash of
   `/join/<code>` or `/home` on the way; a flash is the page and the form
   racing, and both must end in the Pot. Then sign in with `?next=` on the
   sign in URL and land there.
3. Sign out, sign in. Change the password (the panel asks for the current
   one) and confirm the other session ended. Wait ten minutes and change it
   again: the panel asks for the password once more and then succeeds.
4. Turn the second factor on. The next protected page either asks for a code
   once or lets you through; both are correct, and the doc should record
   which happened. Sign out and in: the code is asked for. Read the token
   again: `two_factor` is `true`. Turn the factor off after ten minutes: the
   panel asks for a code and then succeeds.
5. Open a Pot and share a note, which proves the token reaches Postgres and
   `current_uid()` resolved it. Attach a picture to a note and upload a
   profile picture, which prove the storage policies from 0056.
6. Five quick sign ins from one machine inside ten seconds show the "Too many
   attempts from this network" sentence once; that is Clerk's per address
   limit doing its job, not a fault.

The end to end suite's login helper still speaks Supabase; moving it to
`@clerk/testing` tokens is part of the switch, not the groundwork.

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
- Sign in and sign up limits move to Clerk, and the numbers change: 5 sign
  ins or sign ups and 3 code attempts per 10 seconds per IP address, and a
  429 blocks that endpoint for the Retry-After period. A class signing in
  together behind one school address can see the "Too many attempts from this
  network" sentence; the copy is in place, and staggering the class is the
  answer. Clerk's lockout rule (Protect, Rules, Lockout) is on by default and
  pauses an account for an hour after ten wrong passwords; the form says so.
- A person who loses their authenticator cannot get back in on their own:
  backup codes are off and Clerk has no end user reset. You unlock them in
  the Clerk dashboard (Users, the person, Two step verifications, the menu
  next to Authenticator app, Remove method). Clerk then disables the factor
  for that account, and it is password only until they enrol again. The
  `two_factor` claim catches up at their next sign in.
- Supabase counts people who reach Postgres with a Clerk token as third-party
  monthly active users: 50,000 are included on the Free plan, and the rest
  are priced per user. A class will not get near it.
- When the deletion webhook is built: a public route handler calling
  `verifyWebhook` from `@clerk/nextjs/webhooks` with
  `CLERK_WEBHOOK_SIGNING_SECRET` in Netlify, deleting the profile by
  `data.external_id` (the profile uuid set at import) or by `data.id` through
  a definer function, registered on the Webhooks page of each instance
  separately.
- The custom flow doc Clerk shows first describes its newer signals API. The
  code uses the resource API (`signUp.create`, `signIn.create`), which the
  installed SDK still types without deprecation; compare against the legacy
  email and password page when in doubt.
