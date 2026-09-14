# The caret is drawn on one line only

Every single line field draws its own gliding caret; every textarea keeps the browser's, coloured to match, because a drawn caret on a wrapping field is wrong a line at a time.

## The decision (2026-09-05)

The owner's rule is that the smooth caret goes everywhere the user types. The three raw inputs that had escaped it (the class code field, the dashboard join field, the search page control) now draw it, and `SmoothCaretInput` learned what those fields needed: text-align center, text-transform, the border, sub-pixel measurement, a caret height keyed to the field's own type size, and a measuring span that can no longer widen the page.

Textareas do not draw one. `TextArea` sets `caret-primary` instead, so the caret is the brand's colour in every field and only its motion differs.

## Why

Two defects in a mirror-div caret are structural, not tunable. At a soft wrap one `selectionStart` names two visual positions, one at the end of a line and one at the start of the next, and no browser exposes which it chose for a textarea; so the drawn caret sits a whole line away from the real one about half the time someone presses End or clicks a line end. And the mirror's width has to match the textarea's to the sub-pixel while `autoGrow`'s `overflow-y-auto` removes about 15px the instant a classic scrollbar appears, invisible on macOS overlay bars and wrong for every Windows and Linux user. Both are present at two rows as much as at fourteen. Cost was the third argument (roughly 4 to 12ms a keystroke at 20,000 characters) and would not have carried the decision on its own.

A caret that is sometimes a line wrong is worse than one that never glides.

## Open

The sidebar Search control (`main-nav.tsx`) is a link styled as a field, and is now the one field-shaped thing on screen with no caret when focused. Left as is.
