# Meeting backlog

Product and feature ideas pulled out of the original meeting transcript by the
owner, separated from the unrelated hackathon discussion. Recorded 2026-09-22.

Two things to hold in mind when reading it.

Later MeltingPot decisions from other conversations are deliberately not mixed
in. This is what was actually discussed in that meeting, so where it disagrees
with the repo as it stands today, the repo is the later word and this is the
earlier one.

The status labels are the owner's, and they describe **how people spoke in the
meeting**, not what the code does:

- **Existing**: demonstrated or described as already working
- **In progress**: explicitly said to be under development
- **Planned**: someone on the team said "we'll add", "we're going to"
- **Suggested**: proposed but not clearly committed
- **Needs fix**: the feature existed but an issue was called out

An "Existing" label is therefore a claim made in a room, not a verified fact
about this repository. `docs/MEETING_AUDIT.md` holds the check of those claims
against the code, and corrects several of them.

The owner's own shorter list of what they want next is in `docs/BACKLOG.md`.
The two overlap in places and neither supersedes the other.

---

## 1. Google Classroom and school integrations

### Google Classroom two-way integration
**Planned, strongly committed.** Connect MeltingPot directly to Google
Classroom so teachers and students do not manage both systems independently.

- Import notes or media from Google Classroom into MeltingPot.
- Push notes from MeltingPot back to Classroom.
- Push generated practice assignments into Classroom.
- Keep Classroom and MeltingPot synchronized rather than manually moving
  between the two.
- Potentially turn teacher-assigned note-taking work into material that
  automatically enters the Pot after completion and approval.
- Reduce the need for teachers to separately log into MeltingPot for routine
  approval tasks.

### Google Calendar integration
**Suggested, positively received.** Connect the academic calendar so the
system knows when tests or important coursework are approaching.

- Import upcoming tests from Google Classroom or Google Calendar.
- Recognize when a test is approaching.
- Automatically prepare relevant quizzes or study material.
- Send study reminders, such as an upcoming test notification.
- Use the calendar to tell students when they should begin studying.

### Teacher workflow should fit existing tools
**Strong product requirement.** Teachers should not have to learn another
complicated system or constantly switch platforms.

- Classroom integration should feel native.
- Teacher approvals and actions should require as few extra steps as possible.
- Meet teachers where they are rather than requiring a separate workflow.

## 2. Notes, uploads, and course knowledge

### File, link, PDF, video, and media attachments
**Existing, being expanded.** The contribution flow already supported
attaching media, files or links and using their contents. Sources discussed:
PDFs, videos, links, textbook material, images and photos, other course
resources.

### Textbook photo and handwriting input
**Suggested, technically dependent.** A teacher asked about photographing
textbook material and handwritten notes.

- Upload a picture of handwritten notes.
- Read cursive and handwriting where supported.
- Extract useful course material from the image.
- Convert it into notes.

The group noted handwriting quality depends on the model, so this was not
presented as solved.

### Merge personal notes with textbook or source material
**Suggested.** Take what the student wrote, plus what is in the book or
resource, and identify what is missing.

- Compare student notes against an attached source.
- Add missing concepts.
- Show what the student failed to capture.
- Preserve the student's original material rather than replacing it.

This connects directly to the core problem discussed: students capture
different parts of the same lecture.

## 3. Combining the class's notes

### Generate one comprehensive class summary
**Existing concept, parts need improvement.** Look across the notes and topics
contributed to a Pot and produce a combined summary. The case discussed: one
student captured one concept, another a second, a third wrote down something
both missed, and the class summary fills those gaps. The teacher's framing was
"how do I take all nine submitted notes and create one comprehensive note
page?"

### Select specific notes and merge them
**Planned expansion.** Rather than always summarizing everything in a Pot, the
teacher should be able to select particular notes and combine those.
Select notes, join them, create a new summary.

### Expanded summary
**Needs fix.** Demonstrated in the meeting, but expanding the summary was not
working at that moment and the team intended to fix it.

## 4. Practice tests and quizzes

### Practice-test generation
**Existing.** Students could generate practice from everything in a Pot, with
controls for number of questions, difficulty, and additional topic or focus
instructions, using the Pot's knowledge as the source. Difficulty was
described as based partly on whether the task involved recalling information,
recognizing patterns, or applying concepts.

### Teacher-generated practice
**Existing, planned integration.** Teachers generate practice from class notes
and potentially assign it. The meeting distinguished this from creating a real
graded exam; practice based on the class's own material was the better case.

### Push practice through Google Classroom
**Planned.** Once Classroom is connected, push generated practice into it as
an assignment or practice activity.

### Automatic practice around upcoming tests
**Suggested.** Upcoming assessment, identify relevant course content, prepare
practice. One of the more ambitious integration ideas.

## 5. Flashcards and adaptive studying

### Generate flashcards from a Pot
**Existing.** Demonstrated, generated from course and Pot material.

### Know it, still learning
**Existing.** The flashcard workflow already included basic adaptive
behavior: "know it" removes or deprioritizes a card, "still learning" brings
it back later. Other demonstrated controls: shuffle, start over, focus on
cards still being learned.

### Flashcard export and printing
**Planned.** Asked whether flashcards could be printed; the response was that
an export button could be added. Could become PDF export, printable sheets, or
other study exports.

## 6. Study games

### Jeopardy-style study game
**Suggested.** Turn the same Pot material into something like Jeopardy.

### Kahoot-style practice
**Suggested.** Also specifically discussed.

The underlying idea is one body of course knowledge in several familiar study
formats rather than only conventional quizzes and flashcards. Treated as
future expansion rather than necessary for the core.

## 7. Live lecture and meeting mode

### Live classroom listening
**In progress.** Explicitly said to be under development. Contexts: Zoom,
Google Meet, a live classroom lecture, other live sessions.

### "I'm lost" assistance
**In progress concept.** During a live lecture a student indicates they are
lost, and MeltingPot uses the lecture context to produce notes, a short
summary, or help understanding what was just discussed.

### Live note generation
**In progress.** Build notes while the lecture is happening rather than
waiting until it ends.

### Post-meeting transcript to study material
**In progress, planned.** After a meeting or lecture, use the transcript to
create notes, summaries, class study material, practice and flashcards.

### In-person lecture recording
**In progress concept.** For an in-person class, a teacher records from their
laptop or potentially through MeltingPot.

### Recording privacy
**Important requirement.** Do not retain the raw recording; retain the
transcript; keep teacher-access controls around that transcript. Discussed
specifically in response to privacy concerns.

## 8. Focus mode

### Distraction-free studying
**Suggested.** Someone asked about preventing interruptions while studying,
and a focused environment without notifications was judged useful.

- Suppress in-app notifications during study sessions.
- A dedicated focus mode.
- Resume notifications afterwards.

## 9. Teacher dashboard and teacher controls

### Teacher view
**Existing.** The demonstrated teacher and owner view included Pot members,
shared notes, history, corrections, administrative settings, stored class
data, note review, and note deletion where permitted.

### Sorting notes
**Existing.** Notes and history could be sorted by recency or alphabetically.

### Teacher-created class summaries
**Existing, expanding.** Teachers generate summaries from student-submitted
material. Future expansion: select specific students' notes, merge them,
create a new comprehensive note.

### Teacher feedback request area
**Planned concept.** Teachers were discussed as an ongoing source of product
feedback, and the group talked about a place for them to submit requests.

## 10. Roles and permissions

### Ownership-based permissions
**Existing.** MeltingPot does not need separate global teacher and student
account types. A user who creates a Pot becomes its owner; another user can be
a normal member; users may have elevated permissions within particular Pots.
Roles are Pot-specific rather than account-wide.

### Student maintainers
**Existing concept, strongly endorsed.** Trusted students help maintain a
class Pot: review submitted material, ensure contributions are relevant, keep
the knowledge base clean, assist with moderation. The teacher liked strong
note-takers functioning almost as teaching assistants.

### Maintainer permission limits
**Existing requirement.** Maintainers should not perform every destructive
owner action. The explicit example: a maintainer should not be able to delete
the entire Pot. The owner retains deeper authority.

### Owner, maintainer, member hierarchy
**Existing.** Progressively deeper levels of access. Students could still see
original notes and history, while maintainers and owners received additional
controls.

### Alternative role naming
**Suggested, mostly playful.** "Chef" and "Sous Chef" were floated as branded
role terminology. Not presented as a committed change.

## 11. Corrections, review, and version history

### Suggest corrections
**Existing.** Students could open another student's note and suggest a
correction.

### Human and automated review
**Existing philosophy.** Changes should not be accepted purely automatically.
Student-submitted content goes through automated checking, then human
approval.

### Original note visibility
**Existing.** Students could view the original input, the processed material,
and the history.

### Hide original notes
**Suggested.** Someone asked whether original notes could be hidden from
regular members. The group said it could technically be changed, but there was
no clear decision. The inclination favored preserving the original.

## 12. Moderation and classroom safety

### Moderation channel
**Existing concept, being developed.** A moderation system rather than an
unrestricted social feed.

### Flag inappropriate or off-topic notes
**Suggested expansion.** Flag irrelevant submissions, flag inappropriate
content, reject clearly inappropriate material before publication.

### Automated warning system
**Suggested.** Warning, repeated violation handling, automatic removal in
serious cases.

### Human approval remains important
**Existing principle.** Even with automated filtering, teachers and
maintainers remain involved.

### Suspend or remove users
**Existing, proposed teacher control.** Suspend a student from a Pot, remove a
student, respond to abuse or low-quality submissions.

## 13. Contribution-gated access

### Contribute before consuming
**Suggested, significant discussion.** Students should not stop taking their
own notes simply because everybody else's are available.

Teacher enables a contribution requirement, the student submits approved
notes, the student gains access to the shared class knowledge base. The phrase
used was essentially: if you want to eat from the Pot, you have to add an
ingredient.

### Contribution frequency
**Suggested.** One accepted contribution per week, per topic, or per chapter.
The meeting explicitly rejected making it excessively frequent.

### Classroom-assigned note contribution
**Suggested.** A cleaner version: the teacher assigns notes, the student
submits, the work is reviewed, the student gets access. This ties contribution
to the existing class workflow rather than to arbitrary gamification.

## 14. Class joining and access security

### Close a Pot to new members
**Existing, discussed.** Once all intended students have joined, the owner
closes the Pot so old invite links no longer work.

### Regenerate class code
**Existing, planned.** If a code is compromised or shared with someone
unwanted, regenerate it and the old code becomes invalid.

### One-time invite codes
**Future idea.** Explicitly mentioned as a potential future feature, useful
for controlled onboarding, preventing forwarded codes, and individually issued
access.

## 15. Onboarding and usability

### Role-aware onboarding tutorial
**Explicitly planned.** The team said "we'll add like an onboarding tutorial".
It should guide a new user toward one immediate action rather than overwhelm
them. A student joins a class then contributes notes; a teacher or owner
creates and sets up the class then adds members. Google Classroom was the
simplicity benchmark.

### One-click accessibility
**Strong design requirement.** Important actions should be roughly one click
away.

### Avoid Canvas-style complexity
**Strong design requirement.** Understandable with a very short onboarding
rather than requiring a separate guide.

### Help center after onboarding
**Suggested.** If someone does get stuck, there should be an obvious place to
get help.

## 16. Product analytics and testing

### User funnel analytics
**Planned concept.** Instrument the app to understand where users leave, what
people actually use, where they get stuck, whether they complete onboarding,
and where engagement drops. Compared to analyzing a video game funnel.

### Pilot surveys
**Suggested.** Once piloted in a real class: survey students during the pilot,
collect usage data, identify pain points, use teachers as ongoing focus
groups.

### Teacher feature-request feedback
**Suggested.** Teachers using the product identify missing functionality.

## 17. Study and note-taking coaching

### Note-taking tips
**Suggested.** The teacher recommended study-habit guidance, note-taking tips,
and guidance for writing effective notes.

### Feedback on note quality
**Suggested.** Rather than merely fixing a student's notes, help the student
become a better note-taker over time: enter MeltingPot with weak notes,
eventually learn to take better ones. This supports the concern raised
throughout that the product should help students study, not eliminate the need
to think.

## 18. Appearance and accessibility

### Light and dark mode
**Existing.** Both demonstrated.

### Adjustable middle or night theme
**Suggested.** A teacher found the dark and light jump too extreme. Ideas: an
intermediate theme, adjustable intensity, a warmer red or orange nighttime
palette, lower eye strain for late-night studying. Compared with night-mode
concepts that reduce harsher light.

### Collapsible and customizable sidebar
**Existing.** Collapse the sidebar, reorder certain navigation items, save the
preferred arrangement.

### Favorite Pots
**Existing.** Frequently used Pots surfaced more prominently.

## 19. Exporting and printing

### Export flashcards
**Planned.** As above.

### Export and download notes
**Suggested, described as easy to add.** The teacher asked whether students
could download or print shared notes; the response was that export could be
implemented fairly easily. Potential outputs: PDF, print-friendly notes,
flashcards, study guides.

## 20. Product positioning decisions

Not literal features, but they affect what should and should not be built.

### Collaboration, not social media
**Very explicit.** The group corrected the word "social" several times.
MeltingPot is collaborative, not social. Schools and teachers do not need
another social feed. Students collaborate around course material, but there is
no reason for unrelated messaging or chatter.

### No general chat
**Intentional decision.** A chat between students was specifically questioned,
and the answer was essentially no, to keep the experience focused.

### Knowledge base first
**Core product direction.** All the class's useful knowledge in one place,
rather than making MeltingPot just another note generator.

## 21. Called out to fix

Implementation cleanup rather than new features.

- Summary expansion: not working during the demo.
- Practice generation reliability: API overload and errors were occurring.
- Calendar: existed in an early, basic state but needed much more work.
- Handwriting support: needed validation with real handwritten examples.
- Google integrations: discussed extensively but explicitly not finished.
- Teacher workflow: needed lower friction before classroom adoption.
- General UX: core features should be polished before continuing to add a
  large number of partially finished features.

One of the strongest pieces of feedback in the meeting was essentially: finish
a few core features extremely well before adding dozens of new ones. That
should guide how this list gets prioritized.

## The owner's synthesis of priority

Explicitly the owner's reading of how strongly and concretely each item was
discussed, rather than a priority order voted on in the meeting.

**Highest priority.** Google Classroom integration, comprehensive shared notes
and summaries, the contribution and review workflow, teacher and maintainer
permissions, practice and flashcards, onboarding, moderation, and general
reliability.

**Next.** Calendar integration, exports, analytics, contribution-gated access,
better teacher workflows, note-taking guidance, appearance and night mode.

**Later or experimental.** Live lecture mode, automatic calendar-based study
preparation, Jeopardy and Kahoot-style games, one-time class codes, deeper
handwriting processing.
