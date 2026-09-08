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
| Verify the registry contact email (yellow banner, 14 days) | Owner | Open |
| Netlify: site meltingpot-csc, Domain management, Add a domain, choose Netlify DNS | Owner | Done 2026-09-06; Netlify lists meltingpots.xyz as the primary address |
| Registry: Manage, Manage Nameservers, paste Netlify's four nameservers | Owner | Done 2026-09-06 (dns1 to dns4.p04.nsone.net) |
| Wait for the certificate, then say so | Owner | Waiting; the .xyz registry had not published the delegation at 2026-09-06 (NXDOMAIN) |
| Supabase: Authentication, URL Configuration, Site URL and redirect list on the new domain | Owner | Open |
| security.txt canonical, README links, redeploy; then a migration moving the hourly cron's URL to the domain, since the netlify.app address will redirect and the cron does not follow redirects | Claude | Files changed in commit; deploy and cron migration once the domain answers over https |

## 2. Clerk (docs/CLERK.md)

| Task | Who | State |
|---|---|---|
| Create the application: Consumer, name MeltingPot, Email and Password on, Google, phone and username off | Owner | In progress |
| Email address settings: Verify at sign-up off | Owner | Open |
| Password rules: 8 characters, upper, lower, number, symbol; reject compromised | Owner | Open |
| Multi-factor: Authenticator application on, nothing else | Owner | Open |
| Attack protection: Bot sign-up protection off | Owner | Open |
| Sessions, Customize session token: `{ "two_factor": "{{user.two_factor_enabled}}" }` | Owner | Open |
| Integrations, Supabase: Activate; note the Clerk domain it shows | Owner | Open |
| Developers, API keys: send the publishable key and the Clerk domain here; keep the secret key | Owner | Open |
| Supabase: Authentication, Sign In / Providers, Third Party Auth, Add Clerk, paste the Clerk domain | Owner | Open |
| Trial Netlify site with the three Clerk variables (owner pastes CLERK_SECRET_KEY) and a deploy | Claude, owner for the secret | Open |
| Walk docs/CLERK.md step 5 on the trial site | Both | Open |
| Google sign in: a Google Cloud OAuth client (separate project from Classroom, consent screen External and published) pasted into Clerk, SSO connections, Google; the button and callback page in the app | Owner the client, Claude the app | Later, after step 5 passes |
| Production instance on meltingpots.xyz: DNS records from the Clerk dashboard into Netlify DNS, live keys on the main site | Owner | Only when the main site moves to Clerk |

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
