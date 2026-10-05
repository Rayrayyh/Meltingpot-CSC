# Meeting claims, checked against the code

`docs/MEETING_BACKLOG.md` records what a room said. This records what the
repository actually contains, checked 2026-09-22 by five read-only audits over
`web/`, `supabase/migrations/` and `docs/`, with every estimate of "one
evening" handed to a second reader told to disagree with it.

That second pass matters. **Thirteen of the fourteen one-evening estimates
were revised upwards.** The one that survived came back with "I set out to
disagree and could not justify it." Take any small-sounding item below as
larger than it sounds until somebody has read the code for it.

Effort scale: `evening` is one focused sitting; `days` is multi-sitting but
self-contained; `weeks` touches schema plus UI plus tests; `blocked` needs
something outside the code, such as an API key, an OAuth app, a model
capability, or a decision from the owner.

## Where the meeting overstated what exists

These were described as Existing. They are partly built, and the missing part
is the part the meeting was describing.

- **Attachments: only images are read.** PDFs, Office documents, text files
  and links are stored, listed and downloadable, but nothing extracts their
  text, so they contribute nothing to organizing a note or to study material.
  Search matches an attachment's file name only. The meeting listed PDFs,
  videos, links and textbook material as working sources.
- **Student maintainers have no pre-publication queue.** A member's note is
  visible to the class the moment they approve it; maintainer power over it is
  retroactive removal. The meeting described maintainers reviewing submitted
  material.
- **There is no automated checking layer.** "Automated check, then human
  approval" is half built: the human half exists, the automated half does not.
- **Nothing assigns practice to anyone.** No assigned-to, due date or required
  set on `study_sets`, no student-facing assigned list, and the LMS
  integration is read-only by design (decision 038).
- **The class summary does not fill gaps.** One pooled summary across every
  shared note exists, but the model is never told that different students
  captured different parts, and the source blocks carry no author. The
  gap-filling the teacher described is the part that is missing.
- **Favorite Pots are recorded but not surfaced.** Marked Pots do not rise in
  the sidebar, get no separator, and appear nowhere else.
- **Moderation has no flag path, no warnings and no suspension.** Removal is
  the only lever, and a removed student can rejoin with the class code.

## Where the meeting was right

Ownership-based, Pot-specific permissions; the owner, maintainer and member
hierarchy; maintainer limits enforced in the database rather than only the UI;
suggesting corrections; original note and version history visibility; the
teacher view; regenerating a class code; light and dark mode.

## The one thing that is not a feature gap

`shared_notes_select` on the live database is `is_pot_member(pot_id)` with no
`removed_at` clause, and `note_versions_select` inherits from it. Migration
0030 fixed exactly this class of bug for study material, with the comment "any
member could read a removed set or card straight from PostgREST", and notes
were never given the same treatment. `study_sets_select` today reads
`is_pot_member(pot_id) and (removed_at is null or is_pot_maintainer(pot_id))`.

Removal of a note is therefore enforced in seventeen places in application
code and nowhere in row level security. Any member of the Pot can read a
removed note, and every version of it, straight from PostgREST with the anon
key. It is not a cross-Pot leak, and the note was visible to that member
before it was removed, but a teacher removing something inappropriate would
not expect it to stay readable. Verified against production, not inferred.

## Every claim

| Claim | Meeting said | Actually | Effort |
| --- | --- | --- | --- |
| Generate flashcards from a Pot | Existing | **built** | days (revised up) |
| Know it / still learning adaptive behavior, plus shuffle, star | Existing | **built** | days |
| "Close a Pot to new members" so old invite links stop working | Existing | **built** | days (revised up) |
| Light and dark mode | Existing | **built** | days (revised up) |
| "Suggest corrections" on another student's note | Existing | **built** | days (revised up) |
| "Regenerate class code", old code becomes invalid | Existing / planned | **built** | none |
| Teacher view | Existing | **built** | none |
| Ownership-based, Pot-specific permissions rather than global t | Existing | **built** | none |
| Maintainer permission limits | Existing requirement | **built** | none |
| Owner, maintainer, member hierarchy | Existing | **built** | none |
| Original note visibility | Existing | **built** | none |
| Practice-test generation from everything in a Pot, with contro | Existing | **built** | weeks (revised up) |
| Collapsible and customizable sidebar, reorder items, save the  | Existing | **built** | weeks (revised up) |
| Practice generation reliability | Needs fix | **partial** | blocked |
| Textbook photo and handwriting input | Suggested | **partial** | blocked (revised up) |
| Google Classroom two-way integration | Planned | **partial** | blocked |
| Google Calendar integration | Suggested (meeting als | **partial** | blocked |
| Difficulty based on recall vs recognizing patterns vs applying | Existing | **partial** | days |
| Generate one comprehensive class summary across the notes cont | Existing concept | **partial** | days |
| Select specific notes and merge them into a new summary, rathe | Planned expansion | **partial** | days |
| "Role-aware onboarding tutorial" guiding a new user to one imm | Explicitly planned | **partial** | days |
| Favorite Pots surfaced more prominently | Existing | **partial** | days (revised up) |
| Human plus automated review | Existing philosophy | **partial** | days |
| Sorting notes and history by recency or alphabetically | Existing | **partial** | evening |
| Teacher-generated practice from class notes, potentially assig | Existing / planned int | **partial** | weeks |
| File, link, PDF, video and media attachments in the contributi | Existing | **partial** | weeks |
| Student maintainers who review submitted material | Existing concept | **partial** | weeks |
| Moderation | Existing concept + Sug | **partial** | weeks |
| User funnel analytics | Planned concept | **absent** | blocked |
| "Hide original notes" from regular members | Suggested | **absent** | blocked |
| Flashcard export / printing | Planned | **absent** | days (revised up) |
| Expanded summary was demonstrated but not working | Needs fix | **absent** | days (revised up) |
| "One-time invite codes" | Future idea | **absent** | days |
| "Help center after onboarding" | Suggested | **absent** | days (revised up) |
| "Teacher feedback request area" where teachers submit feature  | Planned concept | **absent** | days |
| An adjustable middle or night theme, warmer palette, lower eye | Suggested | **absent** | days |
| Export or download notes as PDF or print-friendly | Suggested | **absent** | days (revised up) |
| Focus mode / suppressing notifications during study | Suggested | **absent** | days (revised up) |
| Merge personal notes with textbook or source material | Suggested | **absent** | weeks |
| "Contribution-gated access" | Suggested | **absent** | weeks |
## The free one

The retry, backoff and standby-mixer machinery written for exactly the "API
overload" failure the meeting complained about is real and tested
(`web/lib/mix/server.ts`), and almost certainly inert in production:
`FALLBACK_MODEL_API_KEY` and `FALLBACK_FAST_MODEL` appear only in
`.env.example` and decision 051, so with the standby unset the primary retries
four times and gives up. Setting those two variables on the Netlify site is
not engineering work at all, and it addresses a Needs fix item directly.
Confirm with `web/scripts/check-fallback-mixer.mjs` first, because a model
that thinks before answering will not make the standby's budget.
