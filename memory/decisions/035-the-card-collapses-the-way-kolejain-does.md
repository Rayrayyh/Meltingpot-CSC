# The notification card collapses the way kolejain.com does

The card animates nothing but opacity, in a tenth of a second both ways; the shrink is the rail reflowing it.

## The decision (2026-09-05)

The owner asked for the same animation and method as the sidebar card on kolejain.com, and sent a recording. The method was read out of that site's stylesheet and the timings measured frame by frame from the recording; the working is in `docs/KOLEJAIN_NOTIFICATION_MOTION.md`.

What shipped: `.mp-nav-alerts` transitions opacity in 0.1s linear with no delay, the card is `shrink-0 overflow-hidden`, and every line inside it is nowrap so the rail's one second width animation clips it at the moving edge rather than rewrapping it. The previous `translateY(6px) scale(0.97)` and the 0.55s delayed reveal were removed: they were an impression of the motion, and they fought the reflow that produces it.

The card is also 20.3 percent shorter (241px to 192px), taken from padding and row spacing with the 11px type left at its floor, and the nav scroller no longer paints a bar (`scrollbar-width: none`) while staying scrollable. The bar had been raised full height for an overflow of a few pixels on short windows.
