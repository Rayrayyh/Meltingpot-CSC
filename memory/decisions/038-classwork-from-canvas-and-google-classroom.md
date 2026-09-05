# Classwork from Canvas and Google Classroom

A person's courses come in read-only, assignments and due dates and announcements and links to materials, kept in sync; a Pot maintainer can link a course for the whole class, a student for themselves; nothing is ever written back and nothing imported becomes a note or counts for anyone until a person starts a note from it and shares it.

## The decision (2026-09-05)

The owner asked for Canvas LMS and Google Classroom, "so that students can import assignments, due dates, materials, resources, etc", with sync, both platforms live by 5 October. This lifts two items from the SPEC's do-not-build list at once: "Google Classroom or Canvas integration (add only the framework hook, not functionality)" and "calendars and assignments". SPEC line 235 records the lift. The Integrations block that docs/PLAN.md and docs/BUILDLOG.md said had shipped never existed in this tree; both are corrected.

The owner's answers, which fix the design:

- Canvas is a real school instance whose admin is issuing a developer key this month. That is the only route Canvas allows: its API policy forbids asking users to paste manually generated tokens and requires OAuth for multi-user apps. Canvas is built against a stub and verified against the school the day the key lands.
- Google's Cloud project stays in Testing for the hackathon. Only named test users can connect, and every consent lapses seven days after it was given. The product treats that as a state to reconnect from, in a warning tone, not as an error. Verification is filed after.
- Teachers and students can both link. A maintainer linking a course to a Pot makes what it brings readable by every member of the Pot, including the assignment text. A student linking privately keeps it to themselves. Who linked decides who reads, and the two can coexist for one course.
- Import now, write back later. The adapter interface reserves a publish method that throws not_configured in both adapters, and every item keeps the provider ids a later post would need.
- The Calendar becomes a planner and a record in one, and moves to the reader's zone for notes and due dates alike, which ends the split between it and the private record.
- Sync runs when someone opens a Pot, the Calendar or Home, at most every fifteen minutes per course, under the 26 second function ceiling with partial progress persisted; and once an hour from Supabase cron through pg_net, so due dates stay fresh overnight. Not Render Workflows: it would move hosting for a prize whose terms bar anyone under sixteen, for a job a scheduled request does.
- Imported material feeds flashcards and practice only through a note a person shares.
- No points on items. An assignment's worth is the teacher's design and not anyone's grade, and the owner still read it as a number on a person.

## What holds it together

Materials are links, never bytes. Linking to a Drive file needs no Drive scope; reading one would need drive.readonly, which Google classes as restricted and gates behind a security assessment.

Refresh tokens live in Vault and nowhere else. Every definer function granted to authenticated is callable from a browser console with the person's own JWT, so any function that returns a token or writes imported rows also takes a server key: thirty two random bytes held in Netlify and in Vault, compared in the database through sha256 on both sides. The defence is the key's entropy, not a counter: a wrong key raises, and a raise rolls back anything the same call counted, so a probe limit would record nothing (the first draft had one and it throttled honest syncs instead). The key is not the whole boundary either: every keyed function also asks who is calling and whether the link is theirs or a Pot they belong to, now rather than when the link was made. A member can read their own rows; they cannot fetch a token or forge classwork into a Pot.

Nothing imported is a note. "Start a note from this" opens the ordinary composer with the item's text as raw text and its links attached through the ordinary attachments insert, and share_contribution is the only way a shared note is born. The record of days and the class standing count the share, which is a real act. The import itself touches neither.

Neither provider tells us whether a student submitted, and submissions are out of scope with grades and rosters. So an item is never "Overdue"; it "Was due 2 days ago".

The Calendar cut days in UTC while the private record cut them where the reader is. Due dates make UTC untenable, since an 11:59 pm deadline would land on the next day, so the Calendar moves to the reader's zone for everything it draws.

## Recorded from the migration review (2026-09-05)

Two lenses read 0049 and 0050 before they were applied. Their blocking findings are fixed in the files; what follows is what they asked to have written down.

- Any member's request, through the sync route, receives the linker's refresh token from lms_sync_begin, because the route syncs on behalf of whoever opened the Pot. One key holder acting on any member's JWT can therefore reach every linker's token. Inherent to a design with no service role, and accepted: the route never echoes begin's result to a browser, holds the token only in request memory for one run, and the rotation in docs/CLASSWORK.md is the response to any suspected leak.
- The hourly job carries no person's JWT and cannot call lms_sync_begin, whose guards stay as they are. It gets its own door in phase 4: a route holding CLASSWORK_SYNC_TRIGGER_SECRET and a definer function keyed on the server key with its own limits, reusing the internal classwork_open_pass, classwork_apply_page and classwork_finish_pass rather than re-emitting them.
- A Pot link tells members when it last synced, how many items it holds, and the enrollment the provider reports for the linker. Against decision 033: a sync is started by whoever opened the Pot or by the hourly job, so those timestamps are not the linker's activity, and enrollment is a fact about a maintainer's own administrative act. The pass cursor is outside the column grant. sync_error carries only phrases this codebase wrote, never provider output.
- A maintainer can store any course name and https URL on a Pot link, and the course id is not checked against their cached course list. Within the authority they already hold over sections and corrections; accepted. A plain member can only affect their own private list.
- When a membership ends, that person's links into the Pot are deleted by trigger, and the ledger shows classwork_unlinked. A class never keeps syncing from the account of somebody who left.
- A deleted account takes its Vault secrets with it by trigger. Revoking the token at the provider on account deletion is not done and belongs to whatever account deletion flow arrives.
- A pass resumes only while fresh: a forced sync, or a cursor older than an hour, starts again, so a dead provider page token has an exit. Reconnecting also clears the cursor.
- The review found that 0045's membership ledger trigger had made every Pot undeletable since it went live. 0048 fixes the shared writer; memory/lessons/013 records it.

## What this rules out

- Any write path from the browser to the three classwork tables. Reads only; writes through the functions in 0050.
- A token, an access token, or a Vault id reaching a browser.
- An import creating a contribution, a shared note, an attachment, or a counted day.
- Grades, submissions, rosters, student lists, or a "Turn in" action.
- A new entry in the main navigation. Calendar and Home carry it.

Full plan: the approved plan of 2026-09-05, mirrored in docs/CLASSWORK.md as it lands.
