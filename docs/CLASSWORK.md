# Classwork from Canvas and Google Classroom

How the import works, what it needs from the people who run it, and how to check it. The
decision behind it is `memory/decisions/038`. The approved plan of 2026-09-05 is the source
this document follows; where they disagree, this file is what shipped.

## What it is

A person connects their Google Classroom or Canvas account in account settings. Their courses
are listed. A course can be shown in their own calendar (a private link, nobody else sees it),
and a Pot maintainer can link a course to a Pot so every member sees what it brings:
assignments, quizzes, discussions, announcements, materials and calendar events, with due
dates and links to the materials. Nothing is written back. Nothing imported is a note. "Start a
note from this" opens the ordinary composer with the item's text as raw text and its links
attached, and sharing that note is the same act as sharing any other.

Materials are links, never bytes. Linking to a Drive file needs no Drive scope; reading one
would need a restricted scope and a security assessment.

## What the owner sets up

### Google Cloud

1. A Google Cloud project with the Google Classroom API enabled.
2. OAuth consent screen: user type External, publishing status Testing. Add every account that
   will connect as a test user (the demo account, the pilot class, the judges' accounts if they
   will try it). Up to 100. In Testing, each person's consent lapses seven days after it was
   given and the product asks them to reconnect; that is expected until verification.
3. Scopes on the consent screen: `openid`, `email`, and the five read-only Classroom scopes
   `classroom.courses.readonly`, `classroom.coursework.me.readonly`,
   `classroom.courseworkmaterials.readonly`, `classroom.announcements.readonly`,
   `classroom.topics.readonly`.
4. An OAuth client of type Web application with these authorised redirect URIs:
   `https://meltingpot-csc.netlify.app/api/classwork/callback/google_classroom` and
   `http://localhost:3111/api/classwork/callback/google_classroom`.
5. Its client id and secret go into Netlify as `CLASSROOM_OAUTH_CLIENT_ID` and
   `CLASSROOM_OAUTH_CLIENT_SECRET`.

### Canvas

Canvas's API policy forbids asking users for manually generated tokens; a multi-user app must
use OAuth, and OAuth needs a developer key that only the school's Canvas admin can issue.

1. Ask the admin for a developer key of type API Key with the redirect URI
   `https://meltingpot-csc.netlify.app/api/classwork/callback/canvas` (and the localhost one
   above for development), and either scope enforcement off or exactly these scopes allowed:
   `url:GET|/api/v1/courses`, `url:GET|/api/v1/courses/:course_id/assignments`,
   `url:GET|/api/v1/courses/:course_id/modules`, `url:GET|/api/v1/announcements`,
   `url:GET|/api/v1/calendar_events`, `url:GET|/api/v1/users/self`. The key must be turned On.
2. The key's id and secret go into Netlify as `CANVAS_OAUTH_CLIENT_ID` and
   `CANVAS_OAUTH_CLIENT_SECRET`; the school's Canvas host as `CANVAS_INSTANCE_URL`
   (for example `https://school.instructure.com`).

Until the key lands, Canvas is exercised against the stub server only.

### Secrets

Generate two random values, 32 bytes each, base64: for example `openssl rand -base64 32`,
twice. One is `CLASSWORK_STATE_SECRET` (signs the OAuth state). The other is
`CLASSWORK_SERVER_KEY`, and the same value must sit in Supabase Vault under the name
`classwork_server_key`.

A key is already there: one was created on 2026-09-05 so the end to end suite could run against
the stub, and its value lives only in that container's `.env.local`. Rotate it to your own value
from the SQL editor, and put the same value in Netlify:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'classwork_server_key'),
  '<the server key>'
);
```

(If `select name from vault.secrets` ever shows no such row, create it instead:
`select vault.create_secret('<the server key>', 'classwork_server_key', 'Classwork server key');`.)

The database refuses every token read and every import write without it. A wrong key is
refused outright; the defence is the key's randomness, not a counter, and the compare is hashed
on both sides. If it ever leaks, the same rotation is the response.

A third value, `CLASSWORK_SYNC_TRIGGER_SECRET`, is the bearer the hourly cron sends. It is
stored in Vault as `classwork_sync_trigger` by the cron migration when that phase lands.

### Netlify

`APP_ORIGIN=https://meltingpot-csc.netlify.app` plus the variables above. Nothing carries a
`NEXT_PUBLIC_` prefix. With any of `APP_ORIGIN`, `CLASSWORK_STATE_SECRET` or
`CLASSWORK_SERVER_KEY` unset, the feature reads as "not set up on this site" everywhere and
every connect button says so; nothing breaks.

## How it holds together

- Tables `lms_connections`, `lms_course_links`, `lms_items` (migration 0049): read-only from
  the client, written only by the definer functions in 0050. Row level security: a person reads
  their own rows; Pot members read rows whose `pot_id` they belong to. The Vault id and the raw
  scope list on connections, and the pass cursor on links, are outside the column grants, so
  the app's readers name their columns: `select=*` fails on both tables.
- Refresh tokens live in Vault and nowhere else. `lms_sync_begin` and `lms_disconnect` are the
  only functions that return one, and only with the server key. Every keyed function also
  checks who is calling and that the link is theirs or a Pot they belong to. Access tokens live
  in route memory for one run. A deleted account takes its Vault secret with it by trigger; the
  provider is not told, since no account deletion flow exists yet.
- When a membership ends, the person's links into that Pot are deleted by trigger and the Pot's
  ledger shows `classwork_unlinked`. Deleting a Pot removes its links and items by cascade.
- `sync_error` holds only phrases this codebase wrote, never a provider's own error text, since
  every member of a linked Pot can read it.
- A sync pass is three calls: `lms_sync_begin` claims the link, `lms_sync_apply` lands one page
  and stores the cursor or closes the pass, `lms_sync_finish` records an outcome the pass could
  not record itself. Removal is decided only when a pass completes, against the moment it
  started, so a run cut short by the 26 second ceiling never marks anything gone. The logic sits
  in three internal functions (`classwork_open_pass`, `classwork_apply_page`,
  `classwork_finish_pass`) that nobody can call directly, so the hourly job can reuse them.
- Refreshing a person's course list needs an access token too. `lms_connection_token` (0051)
  returns the caller's own refresh token behind the same three questions (a person, the key,
  their own row), and `lms_connection_needs_reconnect` lets the route mark a refused refresh
  so the reconnect notice shows at once.
- The routes, all under `/api/classwork/`: `connect/[provider]` (signed state, nonce cookie,
  redirect to consent), `callback/[provider]` (verify, exchange, list courses, `lms_connect`),
  `sync` (one pass under a 22 second budget), `courses` (refresh the cached list),
  `disconnect` (`lms_disconnect`, then a best effort revoke at the provider). Every one checks
  the session itself; `proxy.ts` never gates `/api`.
- Sync runs when someone opens a Pot, the Calendar or Home: the page lists the links the server
  considers stale (never synced, finished over fifteen minutes ago, or stuck running), and a
  small client component posts for up to three of them after paint, remembering in the tab what
  it just synced for four minutes. The database has the last word on too soon and in progress.
  Hourly from Supabase cron through pg_net comes in phase 4.

## Local development and the stub

`CLASSWORK_PROVIDER_MODE=stub` with `CLASSWORK_STUB_ORIGIN=http://localhost:3112` points both
providers at `web/tests/stub-lms/server.mjs`, which plays a consent page, a token endpoint, a
revoke endpoint and enough of both APIs to page through fixtures. The e2e suite starts it; by
hand it is `node tests/stub-lms/server.mjs` from `web/` (`STUB_PORT` to move it). The browser in
this container cannot reach real providers over TLS (memory/lessons/004), so the stub is also
the only way to walk the full flow here.

The stub has moods, set with `POST /__control` and a JSON body, read back with `GET /__control`:
`invalidGrant: true` makes every refresh fail the way a lapsed consent does; `throttle: N`
answers the next N API calls with 429; `slowMs: N` delays every answer; `dueDay: N` moves each
fixture due date to day N of its month, which is how the e2e suite makes a due date change
between two syncs. The Google fixtures live in `web/lib/classwork/fixtures/google.json` and are
shared with the unit tests, so the two suites cannot drift apart.

## Verification

`docs/CLASSWORK_VERIFICATION.md` is the checklist run on the deployed site with the owner's
test accounts before each phase is called done.
