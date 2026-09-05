# One pill slides between Original and Organized

The note view toggle reads Original then Organized, opens on Organized, and marks the choice with a single pill whose leading edge sets off before its trailing edge.

## The decision (2026-09-05)

Order: Original first because it is the source and Organized is what was made from it, so left to right reads in the order things happened. Organized stays the default because it is the reading surface.

Motion: `components/ui/pill-tabs.tsx`. Sliding a box by animating its left edge and width together gives a box that translates, which is not what the owner's reference does. There the edge facing the destination moves first and the edge behind catches up, so the pill stretches across the gap and contracts onto the target. That is two edges on two springs (leading stiff, trailing soft), assigned per move by direction. The pill follows the pointer while it is over the control and settles on the selected item when it leaves; keyboard focus moves it the same way. Reduced motion collapses both springs to a step.

Measured: the pill grows from 96px to 117px mid travel and settles at 80px on the narrower tab.
