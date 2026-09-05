# 039 A bug pass fixes what it confirms, and names what it leaves

Summary: The 5 September bug pass ran eight finder lenses over the code and the live database with one skeptic per finding; sixteen confirmed findings and the cheap low ones were fixed the same day (migration 0053 plus app changes), the stale end to end specs were brought back to the product, and two items were left on purpose with their reasons written here.

## How the pass ran

An orchestrated workflow: eight finders, each with one lens (access control, data races, copy and product rules, classwork engine, RLS and grants, front end state, timezone and dates, test health), a dedup in code, then one verifier per medium or higher finding whose job was to refute it. Finders and verifiers read the production database with SELECT only. Result: 16 confirmed, 1 refuted, 19 low findings left unverified, 13 stale specs. Forty three minutes, twenty five agents.

## What changed

Database (0053, no schema change): the browser signs up through `sign_up_student`, which answers a taken email or weak password as a value so the attempt stays counted against the per address limit (a raise rolled the count back, so probing cost nothing); `register_student` is the insert and no browser role can call it. A card a maintainer took down can no longer be put back by its author. `remove_member`, `set_member_role` and `regenerate_class_code` ask `has_required_aal()` like every other door. `save_study_set` raises `study_set_removed` instead of handing a member the id of a removed set. A classwork pass resumes for ninety minutes, not sixty, because sixty is the cron's own cadence. Grants nothing uses are gone: truncate, references and trigger on every table, writes on `admin_events`, delete on `study_sets` and `note_flashcards`, execute on the ledger trigger functions.

App: "How this Pot runs" is read only for maintainers, since the update policy is owner only and the refusal was silent; the save now proves the row changed. Letter shortcuts stay quiet inside an open listbox, menu or dialog. The admin "Contributions" tab is "Shared notes", because drafts are private by policy and a maintainer only ever saw their own. A prefilled composer writes nothing until the person does something. A resumed draft's share no longer refreshes into a redirect. Organize runs once at a time. A closed class is told apart from a wrong code on Home. The private record's "first thing today" question sets aside the rows the completing act made, so a share with two resources attached still counts as first. Canvas all day events keep their date. Last place in the standing hears the step that puts them ahead, in the same thirty day window as everyone else. A malformed classwork variable disables only itself. Provider and database error text stays in the server log; people read the app's own sentences.

Specs: thirteen stale locators and assumptions were brought back to the product rather than deleted, and global setup now refuses a seed with more shared notes or pending proposals than `dev_seed` writes.

## Left on purpose

1. Profile foreign keys disagree on delete (some cascade, some refuse). Nothing deletes an account today, the privacy page says to ask, and the right answer is a product decision about what outlives a person: a shared note or a card is class material and should stay with the author blanked; a draft is private and should go; a Pot needs an owner and must be handed over first. That is one migration over about ten constraints, written when the deletion flow is, not before.
2. A late `classwork_finish_pass` can stamp a status on a newer pass. Fixing it properly means the finish door takes the pass's `passStartedAt`, which changes two granted signatures and their overload cleanup. The window is two minutes on a link nobody else syncs concurrently; recorded, not rushed.
