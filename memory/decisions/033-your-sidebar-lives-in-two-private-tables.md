# Your sidebar lives in two private tables

Favourites, last opened and the arranged order are rows only their owner can read, in tables of their own, because the tables they would naturally hang off are readable by the whole class.

## The decision (2026-09-05)

The owner asked for three things on the sidebar: the collapsed My Pots icon should open a class rather than a list it cannot show; a class can be marked as a favourite; and a settings panel arranges the links and the classes. All three need per-person state the server can read, and that state went into `sidebar_preferences` (one row per person: link order, hidden links) and `pot_preferences` (one row per person per class: favourited_at, last_viewed_at, position), migrations 0046 and 0047.

## Why not columns on memberships or profiles

`memberships_select` lets every member of a Pot read the whole roster, and `profiles_select` lets anyone who shares a Pot with you read your row. A `last_viewed_at` on either would tell twenty nine classmates exactly when each of them last opened the class. That is behavioural data about a child, the kind India's DPDP Act section 9(3) forbids tracking outright and the kind nobody in a class has any business seeing. The only policy on either new table is the owner's own row, gated by the second factor like everything else (0047).

## Why not localStorage

It is closer to a window layout than a record, which argues for the browser. Two things argued harder for the server. The nav is rendered by the server on every navigation, so a preference held only in the browser paints the default order first and corrects it after hydration, the flash decision 020 had to solve for the theme with a script in the head. And a student on a school computer in the morning and a laptop at night is the ordinary case for this product; a favourite that does not follow them is one they set twice and stop trusting. The collapsed state of the rail itself stays in localStorage (decision 029), because that genuinely is per device.

## What the collapsed icon does

`lib/pot-destination.ts`, in order: one class means that class; an arranged order means the first slot; else a favourite, the most recently opened among several; else the most recently opened; else the first. The order wins over a favourite because arranging is the more deliberate act. So the panel writes positions only when the classes were actually arranged, and Reset writes them back to null: a save that only hid a link used to stamp a position on every class, after which a favourite could never decide again. That was a defect, found in review, not the owner's intent.

## What was rejected

Choosing the control's element in React from the stored collapse flag. It shipped the wrong element in server HTML, broke inside the mobile drawer (which renders the nav outside `.mp-side`, so the CSS and the flag disagreed), and remounted on a storage event. Both controls are always rendered and the stylesheet shows one, `.mp-nav-open-only` and `.mp-nav-collapsed-only`, so the control and the list it discloses cannot disagree.
