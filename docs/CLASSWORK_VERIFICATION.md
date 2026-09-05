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

To be written with the phase.

## Phase 3, Canvas

To be written the day the school's developer key lands.

## Record

| Date | Phase | Who | Outcome |
|---|---|---|---|
| | | | |
