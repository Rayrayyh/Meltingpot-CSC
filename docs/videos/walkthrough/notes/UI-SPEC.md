# UI spec: the light-mode screens for the walkthrough film

What every rebuilt screen shows, in the app's own words, tokens and icons. Pair it with `../assets/ui-light.css`
(tokens and base classes at 1x; scale with a wrapper to 1.25x to 1.5x).

How each finding was checked:

- **measured**: read from run 4's capture log (`docs/videos/launch/remake/capture/capture-log.json`, byte-identical to
  `scratchpad/launch/capture/run4/capture-log.json`; 145 states, viewport 1280 x 800, scale 2, all dark theme), its `text`
  or its `boxes` (x, y, w, h in CSS px), or a value copied from a Tailwind class in `web/`.
- **looked**: read in the `web/` source, or seen in a frame of the owner's landing film `scratchpad/csc/ref-demo.mp4`.
- **inferred**: my reading, not checked against a render.

Strings below are verbatim. `|` separates neighbouring strings. Text shown in capitals is sentence case in the source and
uppercased by CSS (`.eyebrow`); type it in sentence case and let the class do the rest.

## 0. Sources and what they can give

| Source | What it holds | Replayable as DOM? |
| --- | --- | --- |
| `web/app/globals.css` `:root` | the light tokens (no separate `:root[data-theme="light"]` block exists; light is the bare `:root`) (looked) | n/a |
| run 4 capture log | per state: url, theme, scrollY, full visible `text`, and `boxes` (tag, role, accessible name, x/y/w/h) for interactive elements and headings (measured) | **No.** No HTML or CSS was saved by any capture. `capture.mjs` writes PNG + text + boxes only; `find` over `docs/videos/launch`, `walkthrough`, `demo` and `scratchpad/launch` turned up no `.html`/`.css` snapshot (only the film's own `ui.css` and fontsource packages). `appendix2-ui-to-video.mjs` expects `reference/ui/NN-name.html` + one `.css`, which do not exist for meltingpot. Rebuild by hand from this spec (measured) |
| run 4 PNGs (`scratchpad/launch/capture/run4/*.png`) | 2x screenshots, **dark** theme | layout reference only (looked) |
| previous film `launch/remake/film/assets/ui.css` | dark tokens, 1.5x-scaled shadcn/Kibo parts | superseded by `ui-light.css` (looked) |
| landing film `ref-demo.mp4` | 39 s, 1920 x 1080, 60 fps, light; stylised mockups, not the app (looked) | no |

Frame dumps for this note were written under `scratchpad/newdemo/work-uispec/` and deleted afterwards.

## 1. Recommended class and example data

**Use Biology 101 from run 4** (inferred, from the evidence below). Keep the landing film's *storyline* (write, organize,
share, correct, history, calendar, practice, search, end lockup) but not its calculus data.

- Every screen the film needs (join, compose, organizing, review with Worth checking, shared, note, correction, maintainer
  review, accepted, history, flashcards, practice test with marking, teaching readout) has a run 4 state with real app
  text for Biology 101 (measured). The AI moments (organized note, Worth checking, readout) are real outputs for this data.
- AP Calculus BC appears in the app only as decoration: `hero-dashboard.tsx` lists `"AP Calculus BC", "64 notes"` in a
  Pot list, `feature-bento.tsx` has `"Improper integrals review"`, `"Added a step for u-substitution here."` and tags
  `#integrals #u-substitution #partial-fractions` (looked). No organizer output, Worth checking, correction, flashcard,
  test or readout exists for it, so every calculus string would be written fresh (inferred).
- Gaps in run 4 that the builders must fill and label as example data: the Calendar (run 4 has no calendar state; data
  must follow the app's labels in section (l)), search (no state), selection-to-flashcard (no state), contributions page
  (only the Home record card was captured).

People (measured): Rayyan (owner of Biology 101, runs the Pot), Amy (new member, writes the note), Ibrahim (corrects),
Adam, Ahmad. Pot description: "Everything our class knows about intro biology, gathered in one place. Rough notes
welcome." Class code `5R22AX`. Sections: Week 1: Foundations | Week 2: Cell structure | Week 3: Cell division | Exam review.

Seed notes (title, summary, author, age, section; measured from the feed):

| Title | Summary | Author | Age | Section |
| --- | --- | --- | --- | --- |
| What exam 1 covers | Exam 1 spans weeks 1 to 3, with emphasis on osmosis problems, organelle functions, and the mitosis versus meiosis distinction. | Ibrahim | 20h ago | Exam review |
| Osmosis and tonicity | Water crosses a selectively permeable membrane toward the higher solute concentration; tonicity describes which way cells gain or lose water. | Ibrahim | 2d ago | Week 2: Cell structure |
| Mitosis vs meiosis (v2) | Mitosis makes two identical body cells; meiosis makes four genetically distinct gametes with half the chromosomes. | Adam | 3d ago | Week 3: Cell division |
| The cell cycle and its checkpoints | Cells spend most of their life in interphase (G1, S, G2) before dividing in M phase; checkpoints keep damaged cells from dividing. | Adam | 4d ago | Week 3: Cell division |
| Organelles and what they do | A quick map of the major organelles: where genetic information lives, where energy is made, and how proteins are built and shipped. | Rayyan | 5d ago | Week 2: Cell structure |
| The scientific method, laws, and theories | Science moves from observation to testable hypothesis to experiment; a law describes what happens while a theory explains why. | Ahmad | 6d ago | Week 1: Foundations |

Amy's raw note (measured): `membrane = phospholipid bilayer. small stuff gets thru, big stuff cant` (70 characters).

### Landing film strings that are NOT in today's app (looked: grep over `web/app`, `web/components`, `web/lib`)

Film captions (fine as the film's own headlines, but not app UI): "Study at the speed of thought." | "Write it down. Keep
moving." | "Good notes get better." | "Every change has a history." | "Keep the class in sync." | "Turn notes into
practice." | "Find it when it matters." | "The class knows more together." (end line; no app source has it).

Mock UI strings that differ from the app:

| Landing film | Today's app |
| --- | --- |
| "Original text is preserved." | "Original text will always be preserved." |
| "Saved" on the composer | "Saving" while typing (measured); "Saved" exists only on the review step |
| "First shared by Rayyan" on the note page | note page meta reads "Shared just now" / "Shared just now · corrected by Ibrahim"; "First shared by" exists only on the history timeline ("First shared by Amy") |
| "Correction approved by Rayyan" | not in app; history says "Correction by Ibrahim · approved by Rayyan" |
| "Accepted. The shared note is updated." + "Ibrahim's correction · Reviewed by Rayyan" | "Accepted. The shared note is updated." is real; the line under it is "Ibrahim's correction became the newest version and is credited to them. Reviewed by Rayyan." |
| "Proposed 20m ago" | "Proposed just now" (measured); a relative age is real app behaviour |
| "Current version" / "Suggested version" in red/green boxes | real labels, but the app also shows "Marked up", "In context", "Review assistance" |
| Calendar subtitle "When your classes shared notes." | "When your classes shared notes. Every square is a note that exists." (or, with a linked course, "What your classes shared, and what is due.") |
| Calendar day "1 note" / "2 notes" | real; the film never showed "N due" or Due rows |
| Flashcards deck tag "integrals 3", "All 3" | real pattern ("All 12", "osmosis 3"); calculus data invented |
| "AP Calculus BC" as the Pot, sections Integration, Series, Differential equations, notes "Improper integrals", "Choosing a u-substitution", "Separable differential equations", "Rewrite it as a limit.", "Compare with 1/x²." | example data only; not seeded anywhere in the app |
| Search result "A limit first, then a comparison. Worked example from class." | example data |

## 2. Shared shell (every in-app screen)

Files: `components/shell/app-shell.tsx`, `top-bar.tsx`, `wordmark.tsx`, `main-nav.tsx`, `nav-notifications.tsx`,
`nav-profile.tsx`, `pot-tabs.tsx` (looked). Boxes from run 4 (measured, 1280 x 800):

```
+--------------------------------------------------------------------------------+ top bar h 56, surface, border-b edge
| [pot 32] meltingpot (Baloo 2 600 20px)                                          |
+------------------+-------------------------------------------------------------+
| sidebar w 240    | Pot tabs: Feed  Study  Members  Admin(1)  Settings  y 56 h 44|
| surface,         +-------------------------------------------------------------+
| border-r edge    |        content column x 400, w 720 (centred in the 1040 main) |
| Collapse  y 68   |                                                             |
| Search    y 114  |                                                             |
| Home      y 168  |                                                             |
| My Pots   y 206  |                                                             |
|   Biology 101 y 248 (indented 16)                                              |
| Study     y 286  |                                                             |
| Calendar  y 324  |                                                             |
| Contributions y 362                                                            |
| ...              |                                                             |
| New (alerts) rows 50 tall from y 558                                           |
| profile  y 742 h 50                                                            |
+------------------+-------------------------------------------------------------+
```

- Nav rows: h 36, px 12, radius 10, gap 8, 14px; icon 18px. Active: primary-soft fill, primary text, weight 500.
  Hover: sunken fill, ink text. Pot rows under My Pots: 13px, indented 16 (measured, looked).
- Icons (Phosphor regular, looked): Search `MagnifyingGlass`, Home `House`, My Pots `CookingPot`, Study `GraduationCap`,
  Calendar `CalendarBlank`, Contributions `Notebook`, Collapse `CaretDoubleLeft`, favourite `Star`.
- Visible strings (measured): Collapse | Search | Home | My Pots | Biology 101 | Study | Calendar | Contributions | New.
  Keyboard hints (`/`, `H`, `Ctrl + 1`, `S`, `C`, `N`) appear only on hover (opacity 0 to 1, 150 ms) (looked).
- Alerts block "New" (measured), rows: title 13px 500 / meta 12px muted, e.g. "Osmosis and tonicity" / "Ahmad sent a
  correction" / "Biology 101 · 6h ago". Empty state: "You are all caught up" | "Corrections and class notes land here."
- Profile: avatar md + "Rayyan" (14px 500) + "rayyan@meltingpot.dev" (12px muted). Use the name; the film may drop
  the email line (inferred).
- Pot tabs (`pot-tabs.tsx`): 13px 500, pt 12 pb 10, px 12, 2px bottom border primary when active. Student sees Feed |
  Study | Members | Settings; the owner also sees Admin with a pending count pill (bg pending-soft, text pending, 11px
  600, h 18), e.g. "Admin 1" (measured).
- Sidebar collapse: width 240 to 72 over 1 s `cubic-bezier(0.075, 0.82, 0.165, 1)` (looked). Not needed in the story.
- Pot mark: `web/components/brand/pot-mark.tsx` (SVG, the only gradient allowed) or `assets/pot-logo.png` (looked).

## (a) Landing hero lockup and join by code

Files: `components/landing/brand-landing.tsx`, `site-header.tsx`, `join-card.tsx`, `components/ui/class-code-input.tsx`,
`app/join/page.tsx`, `app/join/[code]/page.tsx` (looked).

Hero (looked): Fraunces 600, 37px rising to `clamp(2.1rem+5px, 3.4vw+5px, 3.4rem+5px)`, line-height 1.08, tracking
tight, centred, three lines each rolling in (`RollingText`):
"Everyone takes notes." / "MeltingPot brings" / "them together."
Support line (18 to 20px, ink-muted): "Turn scattered notes, resources, and explanations into one shared course space
your whole class can explore."
Actions: primary lg pill "Join a class" (signed in: "Go to dashboard") + text link with `Play` (fill) "Watch the demo"
(fallback "Learn more" + `ArrowRight`). Header links: How it works | Classes | Contributions | Get started.

Join (measured, state 6 to 14): heading "Join a Pot", sub "Enter the class code your classmate or teacher shared.",
label "Enter class code", code field (mono 600, letter-spacing 0.35em, centred, radius 14, placeholder `ABC123`, max 6),
button "Join Pot" (busy: "Checking"), hint "Enter the 6-character code your class shared." Typing: one character per
step, `5R22AX` (run 4 typed 6 steps then settled). Errors (do not show): "Something went wrong checking that code. Try
again." Join card: Card max-w 448, padding 24, gap 16.

Preview (measured, state 15; route `/join/5R22AX`): wordmark | "You found" | "Biology 101" | description | "4 members"
(`Users`) | "6 notes" (`Notebook`) | "active 20h ago" (`Clock`) | "Run by Rayyan" | "Membership is saved instantly. No
extra setup required." (`CheckCircle`) | button "Join Pot" (busy "Joining") | "Class code 5R22AX". Returning member
variant: "Welcome back to" + "Open Pot".

Motion: route content enters with `mp-enter` 0.28 s `cubic-bezier(0.22,1,0.36,1)` (looked). Primary button hover
`RollText` (letters roll up) (looked).

## (b) Home dashboard

Files: `app/home/page.tsx`, `components/home/attention-modules.tsx`, `pot-stat-card.tsx`, `activity-list.tsx`,
`contribution-record.tsx`, `home-join-card.tsx`, `due-soon.tsx` (looked). Icons: `Plus`, `Archive`, `ListChecks`,
`NotePencil`, `PencilSimpleLine`, `ArrowRight`, `ChatCircleText`, `Notebook`, `Users`, `Plant` (looked).

Owner, Rayyan (measured, state 74): "Afternoon, Rayyan" | "2 corrections are waiting on you." | button "Create a Pot" |
**Waiting on your review**: "2 open corrections" | "Oldest first, so nobody waits twice as long as anyone else." | row
"Osmosis and tonicity" / "Ahmad · Biology 101 · 6h ago" / pill "Incorrect fact" / button "Review" | row "The cell
membrane" / "Ibrahim · Biology 101 · just now" / "Incorrect fact" / "Review" | **Your Pots** + "Manage Pots" | Pot card
"Biology 101" + RolePill "Owner" (clay tone) | "5" (members) | "7 notes" | "2 open" | "Last shared just now" | "Open the
feed" | **New in your Pots** list ("The cell membrane" / "Amy · Biology 101 · just now", then the six seed notes) | "Have
a class code?" | **Your contributions** card.
Before Amy's note (state 1): "1 correction is waiting on you." | "1 open correction" | one row.

Student, Ibrahim (measured, state 54): "Afternoon, Ibrahim" | "Pick up where your class left off." | Your Pots, "Biology
101" + "Member" | "5" | "7 notes" | "1 open" | "Last shared just now" | "Open the feed" | "Have a class code?" | New in
your Pots | Your contributions: "2" "days in a row" | M T W T F S S | "Ahead of 67% of Biology 101." | "Notes shared" |
"2" | "First note shared" | "Next marker at 5 notes."
New student, Amy (state 5): "Afternoon, Amy" | "Pick up where your class left off." | "Create a Pot" | "Join your first
Pot" | "Enter a class code to see what your class is building."

Layout (inferred from the PNGs, not measured): greeting h1 then stacked cards in the 720 column; review rows are list
rows with title 14px 500, meta 12px faint, a pending pill and a secondary sm button.

## (c) Pot feed with sections

Files: `app/p/[potId]/page.tsx`, `components/pot/feed.tsx`, `note-card.tsx`, `sections-panel.tsx` (looked). Icons:
`Brain`, `Cards`, `FileText`, `Plus`, `Sparkle`, `Tray`; note card `ChatCircleText`, `Paperclip` (looked).

Boxes (measured, state 2): h1 "Biology 101" at x 400 y 140 w 720 h 32 | four stat tiles in a row (each about 171 wide,
77 tall, e.g. "OPEN CORRECTIONS 1" at x 766) | "Copy" button beside the code | h2 "Study this Pot" y 338 | 2 x 2 study
tiles 354 x 144 (x 400 and 766; y 390 and 546) | h2 "Recent contributors" y 722 | contributor chips 38 tall.

Strings (measured, state 17, Amy's view): Feed | Study | Members | Settings | "Biology 101" | description |
"Contributors" 5 | "Shared notes" 6 | "Open corrections" 1 | "Class code" 5R22AX | "Copy" | "Study this Pot" | "Browse
the source notes or generate material from the full class vault." | tiles "Raw notes" / "Shared notes from everyone." ·
"Summary" / "Build a fresh study guide." · "Flashcards" / "Generate recall cards from the Pot." · "Practice" / "Set the
length and difficulty, then sit it." | "Recent contributors": "Ibrahim" "2 notes · 20h ago", "Adam" "2 notes · 3d ago",
"Rayyan" "1 note · 5d ago", "Ahmad" "1 note · 6d ago" | section chips "All sections" (selected) | "Week 1: Foundations" |
"Week 2: Cell structure" | "Week 3: Cell division" | "Exam review" | "Latest shared notes" | primary button "Add
contribution" (`Plus`) | note cards (table in section 1) each: title (16px 600), optional "v2" badge, summary, avatar sm
+ author · age · section, then "Suggest correction" (`ChatCircleText`) and "Open" (primary link).
After Amy shares (state 82): "Shared notes" 7, first card "The cell membrane" "v2" (after Ibrahim's correction) "Amy ·
1m ago · Week 2: Cell structure", contributors list adds "Amy" "1 note · 1m ago".

Section chip switch (inferred): chips are `Chip`; selected = primary-soft fill, primary text, primary/30 border.

## (d) "Write anything" composer with attachments

File: `components/contribute/contribute-flow.tsx` (looked); icons `Paperclip`, `LinkSimple`, `ArrowLeft`, `X`,
`Question`, `Eye`, `MagnifyingGlass`, `CheckCircle` (looked).

Strings (measured, states 19 to 25): "1 of 3 · Write" (step head 12px 500 muted + 4px bar, primary fill at 1/3) |
h1 "Write anything" | "No templates, no formatting, no pressure." | textarea placeholder (looked): "Type whatever you
remember, paste rough notes, explain an idea, or share an example. Formatting does not matter." | counter "0 / 20,000"
then "70 / 20,000" | autosave "Saving" | secondary sm buttons "Attach file" (`Paperclip`) and "Add link" (`LinkSimple`) |
"Original text will always be preserved." | "Cancel" (quiet) | "Continue" (primary).
Attachments (looked): list heading "Attachments", field label "Link URL"; limits copy "That file is over the 10 MB limit.
Try a smaller one." (do not show errors). In the note page an attached file shows `Paperclip` + "Attachments included
with this note".

Typing: run 4 typed Amy's 70 characters in 5 steps of 14 (measured). The app draws its own 2px primary caret
(`smooth-caret.tsx`, `.caret`) (looked).

Step 2 (measured, states 27 to 30): "2 of 3 · Optional section" | "Where might this belong?" | "Pick a section if you know
it. Skipping is completely fine." | the four section options | "Not sure where it belongs" | "Nothing is decided for you.
A suggestion appears at review." | "Nothing is shared until you approve it." | "Back" | "Continue" becomes "Continue with
Week 2: Cell structure" after picking; the picked option shows "Selected". The film may skip this step (inferred).

## (e) Organizing progress

Strings (measured, states 31 to 43, 13 frames): h1 "Organizing your note..." | "Your original is saved. Nothing has been
shared yet." | stages (label 14px 500, detail 12px muted):

1. "Original preserved" / "Saved exactly as you wrote it"
2. "Structuring the idea" / "Building a scannable explanation"
3. "Creating a summary" / "One line the class can skim"
4. "Suggesting placement" / "Matching this to a section"

| "Cancel and return to draft" (quiet).
State order (measured): stage 1 active, then done while 2 is active (state 36), then 1 to 4 done (state 43).
Markers (looked, `progress-steps.tsx`): 20px circle; done = success-soft fill, success/30 border, `Check` bold 12px in
success; active = primary/40 border with the `Stir` loading pot at 14px; waiting = edge-strong border, faint label.

## (f) Review before sharing

Strings (measured, states 44 to 47): "3 of 3 · Review before sharing" | pending pill "Review required" | eyebrow
"Suggested placement" | "Week 2: Cell structure (suggested)" | "Shared as Amy" | eyebrow "Original preserved" | Amy's raw
text | eyebrow "Organized" + "Edit" | `Sparkle`(fill) "Organized by gemini-3.6-flash" (12px faint; the provider name came
from run 4's simulated model, confirm before use) | title "The cell membrane" | summary "The cell membrane is a
phospholipid bilayer, and size decides what gets through it." | term eyebrow "Cell membrane" with bullets "A phospholipid
bilayer." "Small molecules get through." "Big molecules can't get through." | "Key takeaways": "The cell membrane is a
phospholipid bilayer." "Size decides what gets through." | **Worth checking** panel (`Warning`, warning tone): heading
"Worth checking before you share" | quote "“big stuff cant”" | "Big molecules do get in and out, just not through the
bilayer on their own: transport proteins carry them, and cells take in very large ones by endocytosis. Size isn't the
whole rule either, since small charged ions can't cross the bilayer unaided." | "Your note has not been changed. Edit it
above if you agree, or share it as it is." | "Saved" | "Organized for you; every word stays yours to change." | "Only you
can approve what gets shared." | buttons "Edit my original" | "Save draft" | "Organize again" | primary "Share with class"
(busy "Sharing").
Button boxes (measured): y 746, h 40; widths 143, 108, 143, 149; right edge at x 1256.
Layout (inferred from the PNG): original and organized side by side, organized card wider; Worth checking panel under
the organized body.

## (g) Shared confirmation

Strings (measured, states 48 to 50): `CheckCircle` "Shared with the class" | "Your contribution is live and credited to
you. Today is on your record." | card "The cell membrane" + success pill "Live" + summary | "Added to Week 2: Cell
structure in Biology 101 just now" | "View in class notes" | "Back to class feed" | "Add another contribution".
Record card that pops over it the first time (state 48): "Day one. The pot is on." | "Something of yours is in the class
vault today." | "1 of the days this week are on your record." | "Your record, nobody else's." | "Back to it".

## (h) Note page, highlights, and selecting a passage to make a flashcard

Files: `components/pot/note-view.tsx`, `note-body.tsx`, `selection-to-card.tsx` (looked).
Strings (measured, state 55, Ibrahim): breadcrumb "Biology 101" › "Week 2: Cell structure" › "The cell membrane" | h1
"The cell membrane" | summary | avatar + "Amy" "Shared just now" | "History" | "Suggest correction" | segmented "Original"
| "Organized" | body (Source Serif 4): "Cell membrane" term + 3 bullets, "Key takeaways" + 2 bullets | footer "Built from
notes shared in this Pot. The original is always preserved alongside every version."
After the correction (state 81, Rayyan): "Version 2" badge | "Shared just now · corrected by Ibrahim" | owner extra
"Remove from the Pot" | third bullet "Big molecules need a transport protein to get through."
Highlights (looked): vocabulary terms in the body are `<mark>` with `bg-clay-soft/70`, radius 3, px 2 (`.highlight`).
Selection to card (looked, no run 4 state): select a passage, a pill rises above it: `Cards` (primary) "Make a
flashcard" (h 32, 13px 500, surface, edge-strong border, raised shadow; enters opacity 0, y -4 to 0 over 0.15 s
`cubic-bezier(0.22,1,0.36,1)`). Clicking opens a panel: heading "Make a flashcard" | `X` "Close" | field "Question"
(placeholder "What is the key point here?") | field "Answer" (prefilled with the passage, inferred) | field "Tags" hint
"Separate tags with commas." | button "Save card" (busy "Saving") | saved: `Check` "Card saved." (13px success) +
"Done". Suggested passage (inferred): "A phospholipid bilayer." Selection colour: primary-soft behind ink.

## (i) Correction flow

File: `components/correct/correct-flow.tsx`, `diff-view.tsx` (looked); icons `ArrowLeft`, `Eye`, `ShieldCheck`.
Strings (measured, states 57 to 72): h1 "Suggest a correction" | "Select what seems off in Amy's note, then write the fix
in your own words." | eyebrow "The cell membrane" | segmented "Correct one sentence" (default) | "Edit the whole note" |
"Tap the sentence you want to correct." | sentences as rows: "Cell membrane: A phospholipid bilayer." "Small molecules
get through." "Big molecules can't get through." | after pick, eyebrow "Selected" + the sentence | eyebrow "What seems
off?" chips "Incorrect fact" | "Incomplete" | "Unclear wording" | "Outdated" | "This helps the maintainer review faster." |
"Your correction" field prefilled with the sentence | "The sentence is already here. Change what is wrong and leave the
rest." | until edited: "Nothing has changed yet. Edit the sentence above to send a correction." | "Why this is more
accurate (optional)" | "Supporting source (optional)" | `ShieldCheck` "A maintainer approves changes" / "Your proposal
won't replace the note automatically." | "Cancel" | "Continue".
Typing (measured): field cleared, then "Big molecules need a transport protein to get through." typed in steps of 9.
Show the change (state 71): h1 "Show the change" | "Your maintainer will compare these side by side." | "Before" "Big
molecules can't get through." | "After" "Big molecules need a transport protein to get through." | "Marked up" "Big
molecules <del>can't</del><ins>need a transport protein</ins> to get through." | "This correction adds 5 words and
removes 1 word." | "Reason: Incorrect fact" | "No changes are public until approved." | "Back" | primary "Send to
maintainer".
Waiting (state 73): eyebrow "Correction proposal" | "The cell membrane" | "Proposed by Ibrahim · original note by Amy" |
`HourglassMedium` pending "Waiting on maintainer" | "A maintainer will compare both versions and decide. You can still
edit this proposal; edits keep the same proposal and its history." | Before / After / Marked up as above | "History" |
"Ibrahim sent the proposal · just now" | "Send" | "AI cannot publish this change. A maintainer must decide." | "Edit this
proposal".

## (j) Maintainer review and accept

File: `components/correct/review-workspace.tsx` (looked); icons `Robot`, `ShieldCheck`, `Warning`.
Strings (measured, state 76, Rayyan): eyebrow "Correction proposal" | pending "Waiting on your review" | "The cell
membrane" | "Ibrahim" "Proposed just now" | "Amy" "Original contributor" | eyebrow "The change" | "Current version" /
"Suggested version" / "Marked up" | "In context" (the three sentences) | "Reason: Incorrect fact" | eyebrow "Review
assistance" | "This correction adds 5 words and removes 1 word." | "No supporting source was attached." | "AI cannot
publish this change. A maintainer must decide." | History row | "Send" | "You can ask a question without deciding yet." |
"Accepting publishes this as the newest version and credits both contributors." | "Decline" | "Request revisions" |
primary "Accept changes".
Accepted (state 79): `CheckCircle` success notice "Accepted. The shared note is updated." / "Ibrahim's correction became
the newest version and is credited to them. Reviewed by Rayyan." | "View updated note" | history adds "Rayyan accepted
the change · just now". Pot tab count drops "Admin 2" to "Admin 1" (measured).

## (k) Version history timeline

File: `app/p/[potId]/n/[noteId]/history/page.tsx`, `components/pot/history-view.tsx` (looked).
Strings (measured, state 80): breadcrumb "Biology 101" › "The cell membrane" › "History" | h1 "Version history" | "Who
changed what, when, and who reviewed it." | eyebrow "Timeline" | "Version 2" success pill "Current" / "Correction by
Ibrahim · approved by Rayyan" / "just now" | "Version 1" / "First shared by Amy" / "just now" | "Every version stays
visible. Nothing is silently overwritten." | right pane: "The cell membrane" / "Correction by Ibrahim · approved by Rayyan
· just now" / "Current" / body v2 | eyebrow "Changes from version 1" | "This correction adds 5 words and removes 1 word."
| "Reason: Incorrect fact" | body with the marked-up third bullet.
The landing film's two-up version cards (selected one on primary-soft with a primary/30 border) are a fair stylisation
(looked).

## (l) Calendar with classwork due dates

File: `app/calendar/page.tsx`, `lib/classwork/labels.ts` (looked); icons `CaretLeft`, `CaretRight`, `ArrowSquareOut`.
No run 4 state; build from source.
Layout (looked): column max-w 896 (`max-w-4xl`), px 24, py 48. Header: h1 month name ("September 2026", 24px 600) +
sub; right: two 36px square buttons, radius 10, edge-strong border, aria "Previous month" / "Next month". Card with
`grid-cols-7 gap-6px`: weekday heads "Mon Tue Wed Thu Fri Sat Sun" (11px 600 0.08em uppercase faint); day cells min-h
64, p 6, radius 10, border edge; a day with anything is sunken; today has a primary border and a primary 600 number;
lines "1 note" / "2 notes" (11px ink) and "1 due" (11px 600 primary). September 2026 starts on a Tuesday (looked, matches
the landing film).
Sub copy: without a linked course "When your classes shared notes. Every square is a note that exists."; with one "What
your classes shared, and what is due." Empty: "Nothing shared or due this month" / "When your class shares a note, or a
linked course sets a due date, the day shows up here."
Below: a list of rows (Card, py 14, px 20). Note row: title 14px 500, meta 12px faint "Author · Pot", right 12px
date. Due row: title (+ `ArrowSquareOut` if linked), meta "Assignment · <course name> · Biology 101", neutral pill
"Canvas" or "Google Classroom", right label from `dueLabel`: "Due today", "Due tomorrow", "Due <date>", "Was due
yesterday", "Was due N days ago" (never "Overdue" on the calendar). Kinds: Assignment, Quiz, Discussion, Announcement,
Material, Event. Home has a "Due soon" module ("Nothing due in the next two weeks." when empty).
Example data (inferred, must be labelled example): notes on the days Biology 101's notes were shared; one Assignment due
row. A course name is not in any capture; ask the owner or reuse "Biology 101".

## (m) Flashcards

File: `components/study/flashcard-session.tsx` (looked); icons `ArrowLeft`, `ArrowRight`, `Check`, `Shuffle`,
`ArrowClockwise`, `Sparkle`.
Setup (measured, state 84): "Back to Biology 101" | eyebrow "Study from the full Pot" | h1 "Flashcards" | "Build recall
cards from the notes everyone shared." | eyebrow "Set up the deck" | "Everything in it comes from notes this class shared.
Nothing outside the Pot goes in." | "Which parts": chips "The whole Pot" (selected) + four sections | "Anything to
concentrate on" / "Optional. Name a topic and the deck leans that way." | primary "Build the deck". Building: "Building the
deck" | "Building your deck..." (8 states, about 1 per step).
Card (measured, states 94 to 98): tabs "This deck" | "Previous decks (1)" | "Built just now from the notes as they are now.
From the whole Pot. Finished rounds are saved to this Pot, where you and this Pot's maintainers can see them." | "Change
the deck" | "Saved to this Pot" | tag chips "All 12" (selected) "osmosis 3" "cell cycle 2" "cell division 2" "membranes 2"
"organelles 2" "tonicity 2" "scientific method 1" | "1 / 12" | "0 know it · 0 still learning" | 4px progress bar | card
front: eyebrow "Question" | "What is the cell membrane made of?" (serif 20px) | "Click the card, or press space, to turn it
over" (12px faint) | back: eyebrow "Answer" | "A phospholipid bilayer." (serif 17px) | "From The cell membrane ·
membranes" | buttons "Still learning" (secondary) | "Know it" (primary, `Check`) | "Shuffle" | "Start over".
Flip (looked): the card turns on its **horizontal** axis, `rotateX` 0 to 180, 0.44 s `cubic-bezier(0.32, 0.72, 0, 1)`,
`perspective: 1600px` on the frame, `transform-style: preserve-3d`, card height 288 (320 from `sm`). A new card enters
from x +36 px, opacity 0 to 1 with the same curve. Card face colour `--card-face` #f7dfc6 by default.
Round summary (measured, state 99): eyebrow "Round finished" | "You knew 10 of 12" | "83% of this round, this time
through." | "Know it" 10 | "Still learning" 2 | "Study the 2 still learning" | "Start over" | "Look back through the deck"
| "Build a new deck". Score count-up (looked, `score-flourish.tsx`): 1.1 s `cubic-bezier(0.16, 1, 0.3, 1)`.

## (n) Practice test

File: `components/study/practice-setup.tsx`, `practice-session.tsx` (looked); icons `CheckCircle`, `XCircle`, `Clock`,
`ListChecks`, `ArrowLeft`, `ArrowRight`, `Sparkle`.
Setup (measured, states 101 to 103): h1 "Practice" | "Build a rigorous practice test grounded in the Pot." | eyebrow "Set
up the test" | "Every question comes from notes this class shared. Nothing outside the Pot goes in." | "How many
questions" 5 | 10 | 15 | 20 + "about 4 min" (5) / "about 8 min" (10) | "Difficulty level" "Gentle" | "Standard" |
"Demanding" + "A mix of recall and applying what the notes say." | "Which parts" | "Anything to concentrate on" /
"Optional. Name a topic and the test leans that way." | primary "Write the test" | writing: "Checking what the Pot
already has."
Ready (state 113): "Built just now from the notes as they are now. 10 questions, standard. Handed-in results are saved to
this Pot, where you and this Pot's maintainers can see them." | eyebrow "Practice test" | "Biology 101: weeks 1 to 3" |
"Questions" 10 | "About" 8 min | "Nothing is marked until you hand it in, and you can change any answer before then.
Every question comes from a note this class shared." | "Start the test".
Question (state 115/116): "Question 3 of 10" | "2 answered" then "3 answered" | "In osmosis, which way does water move
across a selectively permeable membrane?" | "Choose one answer" | A "From higher to lower solute concentration" | B "From
lower to higher solute concentration" (Amy picks B) | C "Only out of the cell" | D "Only into the cell" | "You can change
this answer until you hand the test in." | "Previous" | "Next" | "Jump to a question" 1 to 10 | "Review and hand in".
Hand in (state 117): eyebrow "Before you hand it in" | "10 of 10 answered" | "Everything is answered. Nothing is marked
until you hand it in." | 10 rows "N | question | Your answer: ..." | "Keep answering" | "Hand it in" (busy "Marking").
Marked (state 127): eyebrow "Marked" | "80%" | "8 of 10" | "Everything you missed is below, with the answer and where it
came from." | "Recorded as your first pass on this test." | "Right" 8 | "Wrong" 2 | "Blank" 0 | "Try the 2 you missed" |
"Take it again" | "Change the test". Missed item to feature (Q4): "A cell is placed in a hypertonic environment. What
happens to it?" | "Your answer" "It swells and may burst" (`XCircle`, danger) | "Correct answer" "It shrivels as water
leaves" | "Hypertonic means more solute outside the cell, so water leaves and the cell shrivels." | "From Osmosis and
tonicity". Other miss (Q9): "Which protein is the best-known checkpoint guard?" "ATP" / "p53" / "The class notes name p53
as the best-known checkpoint guard." / "From The cell cycle and its checkpoints". A right item (Q2): "According to the
class notes, how do big molecules get through the cell membrane?" "They need a transport protein" / "Small molecules get
through on their own; big molecules need a transport protein to get through." / "From The cell membrane" (ties the
correction to the test; inferred, worth featuring).

## (o) Search

Files: `app/search/page.tsx`, `components/search/search-controls.tsx` (looked); icons `MagnifyingGlass`, `Notebook`,
`Cards`, `FolderSimple`, `Sparkle`. No run 4 state.
Strings (looked): h1 "Search" | "Search your class knowledge" | intro "Shared notes, study summaries, and flashcards from
every Pot you are in. Try a topic, a classmate's name, a section, or a word from a note." | input placeholder "Search
notes, summaries, and flashcards" (`MagnifyingGlass`) | primary "Search" | kind chips "All" | "Notes" | "Summaries" |
"Flashcards" | "Sections" (group label "Filter by kind") | scope "All your Pots" or a Pot | "Sort" select: "Most recent"
("Newest first."), "Oldest first" ("The earliest thing the class shared, first."), "Most contributed" ("Notes the class
has corrected the most come first, then everything else by date."), "Title A to Z", "Title Z to A" | result kinds
"Section", "Study summary", "Flashcard", "Pot" | empty: "No matches yet" / "Try a different word from the note, a shorter
one, or check the spelling."
Example (inferred): query "membrane" typed letter by letter; results "The cell membrane" (v2, Amy) and "Osmosis and
tonicity" (its summary has "membrane"), plus a flashcard result "What is the cell membrane made of?". Result rows reuse the
feed note card.

## (p) Teaching readout (owner, Admin › Study)

Files: `app/p/[potId]/admin/page.tsx`, `components/study/teaching-readout.tsx`, `my-record.tsx` (looked); icons
`ChalkboardTeacher`, `Sparkle`, `Warning`.
Strings (measured, states 135 to 145): h1 "Admin" | "What this Pot has been asked for, what it has been written from, and
what has been taken out of it. Only a person can approve a change." | tabs "Review 1" "Shared notes 7" "History 9" "Study
4" "Removed 0" | "Study record" | "Practice, not grades. A score is the first pass at a test; retries show separately as
coming back to it. One result is a result, not a trend. Members are told this page can see their results. Alphabetical,
because a class is not a ranking." | per person (Adam, Ahmad, Amy, Ibrahim, Rayyan): "Last practiced 1m ago", eyebrow
"Tests" "7 of 10" "one test so far", eyebrow "Flashcards" "None yet" or "1 round · latest 10 known, 2 still learning" |
heading "What the class is shaky on" | "Read from the questions your class has actually answered, grouped by the note each
question came from. About the material, not the people: no student is named, counted, or compared here." | button "Read
the results" then "Reading the results" (6 states) then "Read them again" |
eyebrow "Holding up": "The class can tell mitosis from meiosis by what each one produces." | "Organelle jobs are holding
up, starting with where ATP comes from." | "The structure of the cell membrane has landed, including how big molecules get
through." |
eyebrow "Worth revisiting": "Osmosis and tonicity" / "The misses run the wrong way round: hypertonic is being read as the
cell swelling, so the direction water moves is the confusion, not the vocabulary." / "Try this: Draw one cell in salt
water and one in fresh water, have students add arrows for where the water goes, and only then name each case hypertonic
or hypotonic." | "The cell cycle and its checkpoints" / "A thinner signal: the misses mix up what happens in S phase with
who guards the checkpoints." / "Try this: Run a two-minute sort of G1, S, G2 and M with one job each, then ask what p53
stops and why that matters." |
"Read by gemini-3.1-pro-preview from 40 answers. The counts are the database's, not the model's." | eyebrow "The counts
behind it" table: "Topic" "Missed" "Asked" "People" | "Osmosis and tonicity" "6 (50%)" "12" "4" | "The cell cycle and its
checkpoints" "3 (38%)" "8" "4".
For the film (inferred): show the readout block, not the per-person Study record (it lists named scores). The counts
are the app's, so they may appear on the rebuilt screen; the film's own captions must not cite them.

## (q) Contributions record and class standing

Files: `components/home/contribution-record.tsx`, `components/contributions/*.tsx`, `app/me/contributions/page.tsx`,
`app/contributions/page.tsx` (looked); icon `Plant`.
Home card (measured): "Your contributions" | "1" "day so far" / "2" "days in a row" | weekday row M T W T F S S | "Notes
shared" 1 | "First note shared" | "Next marker at 5 notes." Private-record copy (looked): "A private record of your days" |
"Today is on your record. Only you see this." | "Longest run" | "First week in a row" | "The last marker we keep."
Class standing (measured, Ibrahim): "Ahead of 67% of Biology 101." Recommendation (inferred): **leave it out.** It is a
comparison to classmates, sits close to the no-leaderboard rule and would put a number in the film; the streak card
without that line is safe if a beat needs it. The public `/contributions` page is a how-it-works explainer ("Write it
rough", "You review and edit", "You share it", "Corrections go in", "Your name stays on it"), useful as copy, not a screen.

## (r) End lockup

Pot mark (no tile, transparent holes) + wordmark "meltingpot" (Baloo 2 600, lowercase, tracking -0.025em; the app pairs
a 32px mark with 20px text, gap 8, or 40px with 26px at `lg`) (looked). Line: "The class knows more together." (film copy,
not in the app; the app's own hero line is "Everyone takes notes. MeltingPot brings them together."). URL
"meltingpots.xyz" (from the brief and the landing film frame at 36 s; looked). Fraunces 600 for the line, ink on paper.

## 3. Motion vocabulary from the source (for the GSAP timeline)

| Motion | Duration and ease | Source (looked) |
| --- | --- | --- |
| Route content enter | 0.28 s `cubic-bezier(0.22,1,0.36,1)` | globals.css `.mp-enter` |
| Reveal / Settle (blocks rising in) | 0.5 s / 0.45 s `cubic-bezier(0.22,1,0.36,1)` | ui/reveal.tsx, ui/settle.tsx |
| Card hover lift | 0.18 s same curve | `.mp-lift` |
| Button colour | 150 ms | ui/button.tsx |
| Progress bar width | 300 ms | progress-steps.tsx, flashcard and practice bars |
| Flashcard turn | 0.44 s `cubic-bezier(0.32,0.72,0,1)`, rotateX, perspective 1600 px | flashcard-session.tsx |
| Next card in | x +36 to 0, opacity, 0.44 s same curve | flashcard-session.tsx |
| Score count-up | 1.1 s `cubic-bezier(0.16,1,0.3,1)` | score-flourish.tsx |
| Selection offer | 0.15 s, y -4 to 0 | selection-to-card.tsx |
| Segmented tab thumb | spring stiffness 700, damping 42, mass 0.6 (leading edge); 280/34/0.8 (trailing) | ui/pill-tabs.tsx |
| Sidebar collapse | 1 s `cubic-bezier(0.075,0.82,0.165,1)` | globals.css `.mp-side` |
| Route loader | appears after 150 ms, 0.3 s fade; arc spins 1.1 s linear | `.mp-route-loader` |
| Stir (loading pot) | 1.2 s linear loop | `.mp-stir-orbit` |

Typing cadence from run 4 (measured): the join code one character per state; the note in 14-character steps; the
correction in 9-character steps. Clicks in run 4 were preceded by a hover state (`*-hover`), so a cursor should rest on a
control, show its hover colour (primary-hover, sunken for secondary), then press (primary-active).
