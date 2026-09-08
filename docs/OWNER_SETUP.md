# What the owner sets up

One list of everything that needs a dashboard, an account or a secret that only
the owner holds, across every feature. Written 2026-09-06 when the owner asked
for it in one place. Each section names its long form doc. Keep the state
column current; a fresh session reads this before asking anything.

Order matters where it is numbered: the domain comes before the OAuth redirect
URIs, the Clerk application before the Supabase setting, every variable before
the deploy that reads it.

## 1. The domain, meltingpots.xyz (docs/CLERK.md, section 0a)

| Task | Who | State |
|---|---|---|
| Verify the registry contact email when it arrives (the registry sends it within a week of 2026-09-08) | Owner | Open, waiting for the email |
| Netlify: site meltingpot-csc, Domain management, Add a domain, choose Netlify DNS | Owner | Done 2026-09-06; Netlify lists meltingpots.xyz as the primary address |
| Registry: Manage, Manage Nameservers, paste Netlify's four nameservers | Owner | Done 2026-09-06 (dns1 to dns4.p04.nsone.net) |
| Wait for the certificate, then say so | Owner | Done 2026-09-08; https answers |
| Supabase: Authentication, URL Configuration, Site URL and redirect list on the new domain | Owner | Open |
| security.txt canonical, README links, redeploy; then a migration moving the hourly cron's URL to the domain | Claude | Deployed 2026-09-08 (deploy 6a9f5d99c7c197773fc5ca2d, commit 60c3e46); the cron still calls the netlify.app address, which answers without a redirect, and moves with the classwork variables |

## 2. Clerk (docs/CLERK.md)

| Task | Who | State |
|---|---|---|
| Create the application: Consumer, name MeltingPot, Email and Password on, Google, phone and username off | Owner | Done 2026-09-08 |
| Email address settings: Verify at sign-up off | Owner | Done 2026-09-08 |
| Password tab, Update password requirements: minimum length 8; leave Reject compromised passwords off | Owner | Done 2026-09-08 |
| Multi-factor: Authenticator application on; SMS, Backup codes and Require multi-factor authentication off | Owner | Done 2026-09-08 |
| Protect, Rules: Bot sign-up protection off and Device Trust off (Manage, Enable off, Save) | Owner | Done 2026-09-08 |
| Sessions, Customize session token: the two claims in docs/CLERK.md step 1.6 (email from primary_email_address, two_factor from two_factor_enabled) | Owner | Done 2026-09-08 on the development instance; check the clone carries it |
| dashboard.clerk.com/setup/supabase: Activate Supabase integration; note the Clerk domain it reveals | Owner | Done 2026-09-08 on production |
| Configure, API keys: send the publishable key and the Clerk domain here; keep the secret key | Owner | Done 2026-09-08 (production keys) |
| Supabase: Authentication, Sign In / Providers, Third Party Auth, Add Clerk, paste the Clerk domain | Owner | Done 2026-09-08 (clerk.meltingpots.xyz) |
| Switch the main site: meltingpot-csc holds the three public variables; owner pastes CLERK_SECRET_KEY (Project configuration, Environment variables, secret, all scopes), runs the account import (docs/CLERK.md step 4), then Claude deploys and both walk step 5 | Owner the secret and the import, Claude the deploy | Variables set 2026-09-08; the trial site was skipped at the owner's choice and `meltingpot-trial` should be deleted in Netlify |
| Walk docs/CLERK.md step 5 on the trial site | Both | Open |
| Google sign in: a Google Cloud OAuth client (separate project from Classroom, consent screen External and published) pasted into Clerk, SSO connections, Google; the button and callback page in the app | Owner the client, Claude the app | Later, after step 5 passes |
| Passkeys (Face ID, Touch ID, Windows Hello on the web): the two toggles under User & authentication, Passkeys, plus a sign in button and a settings panel in the app; the Biometric tab is for native iOS and Android apps only and does not apply | Owner the toggles, Claude the app | Later, after the switch; the owner asked on 2026-09-08 |
| Production instance on meltingpots.xyz: create it cloning the development settings, DNS records from its Domains page into Netlify DNS, Deploy certificates, redo the Supabase integration and update the Supabase third-party domain, clear the trial's profiles, import accounts, live keys on the main site (docs/CLERK.md 0a.4 and 4) | Owner, Claude the SQL and the import script | Only when the main site moves to Clerk |

## 3. Google Classroom (docs/CLASSWORK.md)

| Task | Who | State |
|---|---|---|
| Google Cloud project with the Google Classroom API enabled | Owner | Open |
| OAuth consent screen: External, Testing; add every test user (demo account, pilot class, judges); scopes openid, email and the five read-only Classroom scopes | Owner | Open |
| OAuth client, Web application, redirect URIs `https://meltingpots.xyz/api/classwork/callback/google_classroom`, the same on meltingpot-csc.netlify.app, and `http://localhost:3111/api/classwork/callback/google_classroom` | Owner | Open, after the domain |
| Netlify: CLASSROOM_OAUTH_CLIENT_ID and CLASSROOM_OAUTH_CLIENT_SECRET | Owner | Open |

## 4. Canvas (docs/CLASSWORK.md)

| Task | Who | State |
|---|---|---|
| Developer key from the school's Canvas admin, type API Key, redirect URI `https://meltingpots.xyz/api/classwork/callback/canvas` (and the netlify.app and localhost ones) | Owner, waiting on the admin | Open |
| Netlify: CANVAS_OAUTH_CLIENT_ID, CANVAS_OAUTH_CLIENT_SECRET, CANVAS_INSTANCE_URL | Owner | Open |

## 5. Classwork secrets and variables (docs/CLASSWORK.md, Secrets and Netlify)

| Task | Who | State |
|---|---|---|
| Generate three random values (`openssl rand -base64 32`, three times): CLASSWORK_STATE_SECRET, CLASSWORK_SERVER_KEY, CLASSWORK_SYNC_TRIGGER_SECRET | Owner | Open |
| Supabase SQL editor: `vault.update_secret` on `classwork_server_key` with the server key and on `classwork_sync_trigger` with the trigger secret (the values from the stub run are still there) | Owner, or Claude on request | Open |
| Netlify: APP_ORIGIN=`https://meltingpots.xyz` and the three values above | Owner | Open, after the domain |
| Redeploy, then walk docs/CLASSWORK_VERIFICATION.md phase 1 on the live site | Claude the deploy, both the walk | Open |

## Already done

- MODEL_API_KEY on meltingpot-csc (2026-09-05). FAST_MODEL and REASONING_MODEL default from web/.env.example; three Gemini named variables sit unused beside them.
- Migrations 0054 to 0056 applied; the database accepts a Clerk session the day the switch is thrown.
- The Netlify site itself, its deploy path (memory/decisions/008) and the hourly cron pointing at it.
