# Walkthrough film: storyboard (120 s, 96 BPM, 48 bars of 2.5 s)

Story: the owner's landing film (Study at the speed of thought, Write it down, Good notes get better, Every change has a
history, Keep the class in sync, Turn notes into practice, Find it when it matters, The class knows more together) plus
the AI organizer and the teaching readout. Look and motion: notes/STYLE.md. Every app word: notes/UI-SPEC.md (Biology 101
from run 4; people Amy writes, Ibrahim corrects, Rayyan runs the Pot; class code 5R22AX). Film copy: sentence case, no em
dashes, no emojis, no numbers the film invents (numbers only as the app's own data on screen).

Four chunks, each built in its own file: A = scenes/a.js (0 to 10 and 105 to 120), B = scenes/b.js (10 to 45),
C = scenes/c.js (45 to 70), D = scenes/d.js (70 to 105).

## Hand-off contract between chunks

- The window is one element (`#win`), shared. B brings it in at 9.6 (`F.win.enter(9.6)`); A's close blurs it at 105.0 and
  takes it away by 112.0. Between 10 and 105 the window is always visible at its home position unless a chunk blurs it
  behind a headline (`F.win.blur(t0, t1)`) or shifts it for the one split screen (D).
- Each chunk makes its own pages (`F.page()`), and takes its last page out (`F.pageOut`) 0.3 s after its end time, when
  the next chunk's headline blur already covers the window. The next chunk brings its first page in under that blur.
- The cursor: each chunk starts with the cursor hidden and off frame, and hides it (`F.cursor.hide`) by its end time.
  Set its start with `F.cursor.at(t, x, y)` before showing it, preferably entering from a frame edge already moving.
- Captions: one or two per chapter, under the window, never while a headline is up. Hide by the chapter end.
- Headlines (`F.headline`) sit in `#heads` above everything; give them the blur hand-off behind them.
- Camera: only C uses `F.cam` (the one pull back for "Keep the class in sync."), and it must be back at 1.0 by 70.0.
- Props (cream note cards and keycaps around the window): A initialises them (`F.propsInit`) and sets layouts at 0, 5,
  10 (margins), 105 and 112.5; B, C and D may add one layout change each at a chapter start (`F.propsLayout`).
- Sounds come from the kit: `F.type` (a key per character), `F.cursor.click` (a click per press). Add `F.sound("enter", t)`
  for a keyboard submit, `F.sound("key-heavy", t, { n: 0 })` for a space bar or shortcut, `F.sound("tick", t)` for a soft
  tick on a word or a check mark. Keep to at most one click per beat (0.625 s).

## A: hook and brand (0 to 10)

| Time | Picture | Sound |
|---|---|---|
| 0.0 to 5.0 | Paper stage; the dot grid fades in to 0.5 opacity over 1 s and drifts 12 px/s. Six cream note cards with rough class notes (Amy's raw note "membrane = phospholipid bilayer. small stuff gets thru, big stuff cant", "osmosis: water goes to the saltier side??", "G1 S G2 M, checkpoints between", "mitosis 2 cells / meiosis 4", "law = what, theory = why", "ATP made in mitochondria") drift past on a 6 to 10 degree tilt with depth blur. Headline: caret types "Study" (14 cps), then "at the speed of thought." builds word by word, "thought." stays orange. Holds to 4.6, exits 4.7 to 5.0. | keys on "Study"; ticks on words |
| 5.0 to 7.5 | Music lift. The note cards accelerate to the centre and are swallowed by the pot mark, which lands at 5.0 (150 px), holds, shrinks to 60% over 0.5 s on power3.out at 5.6 while "meltingpot" (Baloo 2 700) slides out to its right over 0.6 s. Under it, muted Inter 34 px: "Everyone takes notes. MeltingPot brings them together." (the site's own hero line) word by word from 6.3. | |
| 7.5 to 9.6 | Three small tilted app cards (a feed note card "The cell membrane", a "Shared with the class" notice, a flashcard "What is the cell membrane made of?") fly through from the right and accelerate off the left edge (Motionfly 11 to 13.9 s). The lockup lifts and fades by 9.4. Props settle to the margin layout at 10.0. | |
| 9.6 | B brings the window in. | |

## B: join, write, organize, share (10 to 45)

| Time | Picture | Sound |
|---|---|---|
| 9.6 to 10.4 | Window rises (`F.win.enter(9.6)`). Page: Join a Pot (UI-SPEC a), URL `meltingpots.xyz/join`. | |
| 10.4 to 15.0 | Caption at 10.4: icon users, **Join** "with the class code." Cursor enters from bottom right, clicks the code field (10.9), types `5R22AX` one character at a time at about 7 cps (keys), hovers and clicks "Join Pot" (12.5, label "Checking"). Swap to the preview (12.8): "You found", "Biology 101", description, "4 members", "6 notes", "active 20h ago", "Run by Rayyan", "Membership is saved instantly. No extra setup required.", "Join Pot", "Class code 5R22AX". Cursor clicks "Join Pot" at 15.0 (label "Joining"). | keys, 2 clicks |
| 15.3 to 20.0 | Swap to the Pot feed (Amy's view, UI-SPEC c), URL `meltingpots.xyz/p/biology-101`. Caption 15.6: icon cooking-pot, **One Pot** "for everything your class shares." Scroll 16.4 to 17.8 down past "Study this Pot" to "Latest shared notes" with the note cards; the cursor rides the scroll and hovers a card (hover lift). Cursor to "Add contribution", click at 19.4. | 1 click |
| 20.0 to 23.0 | C-style headline owned by B: `F.headline` "Write it down." (accent "down.") / "Keep moving." (muted, typed with caret at 14 cps). Window blur 20.0 to 22.9. Under the blur, swap to the composer (UI-SPEC d) at 21.0. | keys on line 2 |
| 23.0 to 28.3 | Caption 23.2: icon pencil-simple, **Write** "it rough. No templates, no formatting." Cursor clicks the textarea (23.4, focus ring), types Amy's note `membrane = phospholipid bilayer. small stuff gets thru, big stuff cant` at 22 cps with the app's 2 px caret; counter "n / 20,000" counts up; "Saving" shows while typing. The cursor heads for "Continue" during the last words; click at 28.1. | keys, 2 clicks |
| 28.4 to 31.2 | Swap to "Organizing your note..." (UI-SPEC e). The four stages complete one by one (28.7, 29.4, 30.1, 30.8): the active marker is a small stirring pot, done markers turn success green with a check (a tick each). Caption 29.0: icon sparkle, **AI** "drafts a title, a summary and key takeaways." | ticks |
| 31.4 to 37.4 | Swap to review before sharing (UI-SPEC f): "3 of 3 · Review before sharing", "Review required", "Suggested placement", the two columns: "Original preserved" with Amy's raw text, "Organized" with "Organized by gemini-3.6-flash", then the organized note streams in by line (0.08 s per line, rise 6 px): title, summary, the term block, Key takeaways. The cursor drifts over the organized column. Scroll 34.6 to 35.8 down to the "Worth checking before you share" panel; a primary-soft marker sweeps the quote “big stuff cant” (36.0). | |
| 37.5 to 41.0 | Caption 37.6: icon eye, **You decide** "what gets shared. Your original is always kept." Scroll to the bottom bar (38.0 to 38.8) with "Only you can approve what gets shared." and the buttons; cursor hovers "Share with class" (39.4) and clicks at 40.0 (label "Sharing"). | 1 click |
| 40.3 to 44.7 | Swap to "Shared with the class" (UI-SPEC g): the card "The cell membrane" with a "Live" pill, "Added to Week 2: Cell structure in Biology 101 just now". At 42.4 swap to the feed with "The cell membrane" arriving at the top of the list (cards stack in, Magic UI animated list style). Cursor leaves down and right by 44.5. Last page out at 45.3. | |

## C: correct, review, history, sync (45 to 70)

| Time | Picture | Sound |
|---|---|---|
| 45.0 to 47.5 | Headline "Good notes get better." (accent "better."), window blur 45.0 to 47.4. Under it, the note page (Ibrahim's view, UI-SPEC h), URL `meltingpots.xyz/p/biology-101/n/the-cell-membrane`, with vocabulary highlights. | ticks |
| 47.6 to 55.2 | Caption 47.7: icon chat-circle-text, **Classmates** "suggest a fix and say why." Cursor clicks "Suggest correction" (48.4); swap to the correction flow (UI-SPEC i): "Correct one sentence", "Tap the sentence you want to correct."; click "Big molecules can't get through." (49.4), it becomes "Selected"; click the chip "Incorrect fact" (50.0); the "Your correction" field selects its text and Ibrahim types `Big molecules need a transport protein to get through.` at 22 cps (50.6 on). Click "Continue" (53.4); swap to "Show the change" with Before, After and Marked up (del in removed colours, ins in added colours) and "This correction adds 5 words and removes 1 word."; click "Send to maintainer" (54.4); "Waiting on maintainer" pill and "AI cannot publish this change. A maintainer must decide." | keys, 4 to 5 clicks |
| 55.3 to 58.0 | Swap to Rayyan's review (UI-SPEC j), URL `.../corrections/...`: "Waiting on your review", "Current version" / "Suggested version" / "Marked up", "Accepting publishes this as the newest version and credits both contributors." Caption 55.6: icon shield-check, **A maintainer** "decides. AI cannot publish a change." Cursor clicks "Accept changes" at 56.9; the success notice "Accepted. The shared note is updated." / "Ibrahim's correction became the newest version and is credited to them. Reviewed by Rayyan." | 1 click |
| 58.0 to 62.3 | Swap to "Version history" (UI-SPEC k). Caption 58.2: icon clock-counter-clockwise, **Every change** "has a history." Timeline rows build in (animated list): Version 2 "Current" "Correction by Ibrahim · approved by Rayyan", Version 1 "First shared by Amy"; "Every version stays visible. Nothing is silently overwritten." Cursor clicks Version 1 (60.0), the right pane swaps to version 1, then back to Version 2 (61.3). | 2 clicks |
| 62.5 to 65.0 | Headline "Keep the class in sync." (accent "sync."), window blur 62.5 to 64.9; four name chips (Amy, Ibrahim, Adam, Ahmad, each with its avatar tint, Motionfly's labelled chips) point at the headline from around it. Under the blur, the Calendar (UI-SPEC l), September 2026, the days Biology 101 shared notes marked "1 note" / "2 notes". | |
| 65.0 to 70.0 | The one pull back: `F.cam(65.0, 0.89, 2.5)`, revealing classmates' smaller windows around ours in the margins (a feed, a flashcard, a note page, as simple rebuilt mini-pages, slightly blurred), then back to 1.0 from 68.0 to 70.0. Caption 65.2: icon calendar-blank, **Every day** "the class shared, on one calendar." Cursor hovers a marked day and clicks it (66.9); the list row under the grid highlights. Last page out at 70.3. | 1 click |

## D: practice, readout, search (70 to 105)

| Time | Picture | Sound |
|---|---|---|
| 70.0 to 72.5 | Headline "Turn notes into practice." (accent "practice."), window blur 70.0 to 72.4. Flashcards and practice questions fly in from the edges as a loose tilted stack behind the headline (Motionfly 29.5 to 33.3; 0.6 to 0.8 s on expo.out, staggered 0.078 s) and blur out as the window returns. | |
| 72.5 to 77.5 | Flashcards (UI-SPEC m), URL `.../study/flashcards`: tabs, tag chips, "1 / 12", the card front "What is the cell membrane made of?" Caption 72.7: icon cards, **Flashcards** "from the notes the class shared." Cursor clicks the card (73.4): the card turns on its horizontal axis (rotateX 0 to 180, 0.44 s, cubic-bezier(0.32, 0.72, 0, 1)) to "A phospholipid bilayer." and "From The cell membrane · membranes". Click "Know it" (74.6); the next card enters from x +36 (use run 4's second card from capture-log.json state 97). The space bar turns it (75.9, a key-heavy sound). | 2 clicks, 1 heavy key |
| 77.5 to 85.0 | Practice (UI-SPEC n): "Question 3 of 10", the osmosis question and four answers; cursor clicks B (78.4); "Review and hand in" (79.3) to "Before you hand it in"; "Hand it in" (80.0); swap to "Marked": "80%" counts up over 1.1 s (cubic-bezier(0.16, 1, 0.3, 1)), "8 of 10", then the missed item (Q4) with "Your answer", "Correct answer", the explanation and "From Osmosis and tonicity". Caption 77.7: icon exam, **Practice tests** "marked with the answer and where it came from." | 3 clicks |
| 85.0 to 95.0 | The one split screen (Motionfly 39.97 to 44.5): a paper panel slides in from the left over 0.5 s (power3.inOut) carrying the headline "See what the class is missing." (two lines, accent "missing.") and under it, muted Inter 30 px: "Whoever runs the Pot sees which topics the class missed, and what to try next."; the window shifts right by 300 px at the same time. In the window, Admin › Study (UI-SPEC p), only the "What the class is shaky on" block, never the named Study record: cursor clicks "Read the results" (86.9), "Reading the results" with a shimmer (Magic UI style) to 88.6, then "Holding up" lines stream in, a slow scroll (89.6 to 91.2) to "Worth revisiting" with the two topics and their "Try this:" lines, and "Read by gemini-3.1-pro-preview from 40 answers. The counts are the database's, not the model's." The split leaves at 94.3 (0.5 s) and the window returns home by 95.0. | 1 click |
| 95.0 to 105.0 | Second lift. Search (UI-SPEC o), URL `meltingpots.xyz/search`. Caption 95.4: icon magnifying-glass, **Find it** "when it matters." Cursor clicks the search field (95.8), types `cell membrane` (22 cps), Enter (enter sound, 96.9); results drop in one by one (animated list): the note "The cell membrane" (v2, Amy), "Osmosis and tonicity", the flashcard "What is the cell membrane made of?", the section "Week 2: Cell structure". Click the kind chip "Flashcards" (99.4), the list filters; click "All" (100.6); click "The cell membrane" (102.0), swap to its note page with the "Version 2" badge and "Shared 5m ago · corrected by Ibrahim". Cursor leaves by 104.5. | keys, enter, 3 clicks |

## A: close and end (105 to 120)

| Time | Picture | Sound |
|---|---|---|
| 105.0 to 112.3 | Music lift. Window blur at 105.0; the props and several app cards (the note, a flashcard, a practice result, the history row, a calendar day) gather round the window in a loose ring (Cua 11 to 16 s, props shaped by the story). Headline "The class knows more together." (accent "together.") builds word by word at 106.0. The window and cards fade away by 112.0. | ticks |
| 112.5 to 120.0 | Logo resolve on the music's end hit: the pot mark lands at 112.5, shrinks to 60% over 0.5 s, "meltingpot" slides out (0.6 s). Then a pill in `#ab5a14`: "meltingpots.xyz" (113.8), and a faint line "github.com/Rayrayyh/Meltingpot-CSC" (114.2). At 114.8 a small faint line at the bottom: "Product screens recreated from MeltingPot's own interface, with example class data." Hold, then the whole frame settles to paper by 120.0 (`#fade` from 119.3). | |
