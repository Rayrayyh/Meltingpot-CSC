# Classwork verification

The checks to run on the deployed site before a classwork phase is called done. Setup is in
`docs/CLASSWORK.md`; this file is only the walk. Tick each line with a date.

## Before the first walk

- [ ] Google Cloud: project, Classroom API on, consent screen External and in Testing, the test
      accounts added (the demo account, the pilot class, anyone who will judge), scopes as
      listed in CLASSWORK.md, a Web application client with both redirect URIs.
- [ ] Netlify: `APP_ORIGIN`, `CLASSWORK_STATE_SECRET`, `CLASSWORK_SERVER_KEY`,
      `CLASSROOM_OAUTH_CLIENT_ID`, `CLASSROOM_OAUTH_CLIENT_SECRET`. No `CLASSWORK_PROVIDER_MODE`
      (that is the stub, for local runs only).
- [ ] Vault: `classwork_server_key` rotated to the same value as Netlify's.
- [ ] A test Google account that is a student in at least one Classroom course with an
      assignment due in the next seven days and one material with a Drive file.

## Phase 1, Google Classroom for one person

Sign in as the test account.

- [ ] Settings shows Connected classes with "Connect Google Classroom". Canvas reads "Not
      available on this site" until its key lands.
- [ ] Connect: Google's consent screen names MeltingPot and only read-only Classroom scopes
      plus email. After consent, settings says "Google Classroom connected." and lists the
      courses with "You are enrolled" or "You teach this".
- [ ] Decline on Google's screen instead: settings says "No problem. Nothing was connected."
- [ ] "Show in my calendar" on a course flips to "In my calendar" within a few seconds.
- [ ] Calendar: the header reads "What your classes shared, and what is due." The month shows
      "1 due" on the right day in your own zone (an 11:59 pm deadline sits on its own day, not
      the next), and the list carries a Google Classroom pill and a "Due ..." label. A past
      deadline says "Was due", never "Overdue".
- [ ] Home: "Due soon" lists the next seven days, with "Open calendar" beside it.
- [ ] Open the item's link: it lands in Google Classroom, not in MeltingPot.
- [ ] Change a due date in Classroom, open the Calendar again after fifteen minutes (or open a
      Pot and come back): the entry has moved.
- [ ] Refresh list after joining a new course in Classroom: the course appears.
- [ ] Disconnect: the confirm names what goes; afterwards the Calendar holds no due dates and
      settings reads "Not connected".
- [ ] Seven days after connecting (Testing status): Home and settings show "Google Classroom
      needs reconnecting" in a warning tone with a Reconnect button; Reconnect returns to
      "connected" and the calendar fills again without re-linking courses.
- [ ] Sign in as a classmate who never connected: nothing about classwork appears anywhere.

## Phase 2, a course linked to a Pot

Sign in as a maintainer of a Pot whose class matches one of the test account's courses.

- [ ] Pot settings shows a Classwork card. With no account connected it points at account
      settings; with one connected it offers the courses not yet linked.
- [ ] Link a course: the card lists it as "Linked by you", the first sync runs, and the
      Classwork tab appears after Feed. The Pot's ledger (admin page) records
      classwork_linked.
- [ ] The Pot feed shows a Classwork strip under the vitals with the next fortnight's due
      dates and "See all classwork".
- [ ] Classwork tab: groups Due soon, Later, No date, Past; each row carries a kind pill, a
      due label, the materials as links, "Open in Google Classroom" and "Start a note from
      this". The top line says who linked it and when it last synced, with Sync now for
      maintainers.
- [ ] Sign in as a plain member: the tab and strip are there, Sync now is not, and Pot
      settings shows the linked course with nothing to press.
- [ ] Start a note from an assignment: the composer opens with the assignment's words as the
      raw text and its materials attached as links. Organize, review and share as usual. The
      shared note shows the links, and the assignment's row now says "1 note started from
      this". The private record counts the share, not the import.
- [ ] Unlink from Pot settings: the confirm names what goes; the tab and strip leave; the note
      stays; the ledger records classwork_unlinked.
- [ ] Remove the linker from the Pot (or have them leave): their link goes with them.
- [ ] Archive the Pot: Sync now is refused with "pot_archived" and linking is impossible until
      it is unarchived.

## Phase 3, Canvas

Runs the day the school's developer key lands. Until then the Canvas half is exercised against
the stub only (the third e2e test), and settings reads "Not available on this site".

- [ ] Netlify: `CANVAS_OAUTH_CLIENT_ID`, `CANVAS_OAUTH_CLIENT_SECRET`, `CANVAS_INSTANCE_URL`
      (the school's host, https, no path). The key is On and its redirect URI matches.
- [ ] Settings shows "Connect Canvas". The school's sign in page appears, names the app, and
      lists only read scopes if the key enforces scopes.
- [ ] After consent, settings says "Canvas connected." with the Canvas display name, and lists
      the active courses with their course codes. Completed courses are not offered.
- [ ] "Show in my calendar": assignments, quizzes and discussions carry due dates; calendar
      events appear on their day; announcements and modules show on the Classwork tab once a
      Pot is linked, with a module's files and pages as links.
- [ ] Assignment descriptions read as plain text, and the links inside them are materials.
- [ ] Open an assignment link: it lands in the school's Canvas, signed in as the person.
- [ ] Revoke the key (or the person's token) in Canvas: the next sync marks the connection as
      needing reconnecting, Home and settings say so, and Reconnect works once access is back.
- [ ] A course with more than fifty assignments pages through cleanly; a long course syncs
      across two opens rather than failing.
- [ ] Disconnect: Canvas shows the app's token revoked under the person's approved
      integrations.

## Phase 4, the hour

- [ ] Netlify carries `CLASSWORK_SYNC_TRIGGER_SECRET`, and Vault's `classwork_sync_trigger` is
      the same value.
- [ ] `select jobname, schedule, active from cron.job` lists `classwork-sync-due` at
      `17 * * * *`, active.
- [ ] `curl -X POST https://meltingpot-csc.netlify.app/api/classwork/sync-due` with no bearer
      answers 401; with the bearer it answers 200 and `{"claimed": n, ...}`.
- [ ] Link a course, then in the SQL editor set its `sync_finished_at` two hours back and call
      the job's command by hand (`select net.http_post(...)` as written in 0052). Within a
      minute `net._http_response` shows a 200 whose body names the link, and the link's
      `sync_finished_at` is fresh.
- [ ] Move a due date in Classroom in the evening and look at nothing; next morning the Calendar
      has it without anyone opening a Pot first.
- [ ] Lapse a connection (Testing status will do this on its own after seven days): the hour
      skips its links and nothing errors in `net._http_response`.

## Record

| Date | Phase | Who | Outcome |
|---|---|---|---|
| | | | |
