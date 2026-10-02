import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/ui/reveal";

/**
 * Section three: the reason a Pot exists at all.
 *
 * What used to stand here was the melt, a before and after diptych with an
 * eyebrow repeating its own heading, four green ticks in the corner, and 1700
 * pixels of pinned scroll spent saying that a tool tidies messy text. Every
 * AI notes product makes that claim, so the section proved nothing while
 * costing the most scroll on the page, and the left half of it sat empty
 * while the right half ran on.
 *
 * This says the thing only a Pot can say. One note, three names, and the raw
 * scrap it came from still lying behind it. The line that does the persuading
 * is the last one: a question nobody has answered, left on the note, because
 * the rule is that nothing gets smoothed over and a page willing to show an
 * open question is making a claim a competitor cannot screenshot.
 *
 * Deliberately not the correction story. That is further down in
 * NamesOnTheNote, which is about a sentence being challenged and reviewed.
 * This one is about the gap: what no single person in the room wrote down.
 *
 * No timeline, no pin, no client state. The whole section renders on the
 * server. Its only motion is the scrap lifting under the pointer, which is
 * CSS on a group and is gated behind motion-safe, so a reader who asked for
 * stillness gets the composition and nothing moves.
 */

/** The three who each had a piece of it, in the order they wrote. */
const WROTE_IT = ["Ahmad", "Paul", "Amy"] as const;

export function PooledNote() {
  return (
    <section
      aria-labelledby="pooled-note-heading"
      data-testid="pooled-note"
      className="bg-paper px-6 sm:px-10 py-24 sm:py-32"
    >
      <Reveal className="mx-auto grid w-full max-w-5xl gap-16 lg:grid-cols-[23rem_minmax(0,1fr)] lg:items-center lg:gap-16 xl:gap-20">
        <div>
          {/* Two sentences, one turn. The payoff carries the brand orange
              and a step up in size, and the concession stays at full size in
              full ink so nothing is demoted. Two signals rather than one is
              deliberate: in forced colors, in grayscale, and in dark mode
              where the light ink and the lighter orange sit close in
              luminance, the size is the only thing left saying which sentence
              the section is actually about.

              Sized in em against the heading so the ratio survives every
              breakpoint and 200 percent zoom, and held to one line, because a
              payoff that wraps to leave "did." on its own is a widow where
              the crescendo should be. It is allowed to run wider than the
              paragraph under it and into the column gap: the overhang is what
              gives the stack a base, and the gap is wide enough at every
              width that it never reaches the card.

              Below sm the heading is sized from the viewport rather than
              stepped, because holding the payoff to one line is a
              constraint on its width and only a width can satisfy it. At
              320px a fixed 32px heading put the payoff ten pixels past the
              screen and the whole page scrolled sideways.

              The heading also keeps a measure of its own, wider than the
              column and wider than the paragraph under it. At the column's
              own width the first sentence broke into four short lines and
              outweighed its own payoff four to one. */}
          <h2
            id="pooled-note-heading"
            className="font-display text-[clamp(1.5rem,calc((100vw-3rem)/10.6),2.125rem)] sm:text-[2.25rem] lg:w-[25rem] lg:text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.021em] text-balance text-ink"
          >
            Nobody in that room took a complete set of notes.{" "}
            <span className="mt-[0.18em] block whitespace-nowrap text-[1.1em] leading-[1.02] text-primary sm:text-[1.18em]">
              Together, they did.
            </span>
          </h2>
          <p className="mt-7 max-w-[22rem] text-[15.5px] leading-relaxed text-ink-muted">
            One lecture, three sets of half notes, one page that holds all of
            it. Everyone approved their own part before it went in.
          </p>
          <a
            href="#how"
            className="mt-8 inline-block border-b border-primary/35 pb-0.5 text-[14px] font-medium text-primary transition-colors hover:border-primary hover:text-primary-hover"
          >
            See how a note gets made
          </a>
        </div>

        {/* The scrap and the note are one hover target: the pointer anywhere
            over the pair lifts the raw note, which is where the finished one
            came from. */}
        <div className="group relative">
          {/* Below lg there is no room to hang it outside, so it sits above
              the card in flow with the card overlapping its foot. From lg it
              hangs off the left edge into the column gap. */}
          <div className="relative z-0 -mb-3 ml-1 w-[17rem] max-w-full -rotate-2 rounded-(--radius-card) border border-edge bg-sunken px-4 py-3.5 shadow-(--shadow-card) transition-[translate,rotate,scale,box-shadow] duration-500 ease-out motion-safe:group-hover:-translate-y-2.5 motion-safe:group-hover:-rotate-[5.5deg] motion-safe:group-hover:scale-[1.03] motion-safe:group-hover:shadow-(--shadow-raised) lg:absolute lg:-left-28 lg:-top-14 xl:-left-36 lg:mb-0 lg:ml-0 lg:-rotate-3 lg:motion-safe:group-hover:-translate-x-2">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-faint/80">
              Paul, 2:16pm
            </p>
            <p className="mt-2 font-mono text-[11.5px] leading-[1.7] text-ink-faint">
              ok so for non competitive Vmax drops and Km stays same?? more
              substrate doesnt fix it
            </p>
          </div>

          <article className="relative z-10 rounded-(--radius-card) border border-edge bg-surface px-7 py-7 sm:px-8 shadow-(--shadow-raised)">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
              Enzyme inhibition, and which line moves
            </h3>
            <div className="mt-3.5 flex items-center gap-2.5 border-b border-edge pb-5">
              <span className="flex">
                {WROTE_IT.map((name) => (
                  <Avatar
                    key={name}
                    name={name}
                    size="sm"
                    className="-ml-1.5 ring-2 ring-surface first:ml-0"
                  />
                ))}
              </span>
              <p className="text-[13px] text-ink-muted">
                Ahmad, Paul and Amy wrote this, Tuesday
              </p>
            </div>

            <p className="mt-5 font-serif text-[16px] leading-[1.72] text-ink">
              Competitive inhibitors bind the active site. Km rises, Vmax is
              unchanged, and enough substrate outcompetes them.
            </p>
            <p className="mt-3.5 font-serif text-[16px] leading-[1.72] text-ink">
              Non competitive inhibitors bind somewhere else on the enzyme.
              Vmax falls, Km is unchanged, and more substrate does not rescue
              it.
            </p>

            {/* Clay rather than the diff tokens: nothing here was added to an
                existing note, so the added and removed colors would be saying
                something untrue about the state of it. */}
            <div className="mt-5 rounded-r-lg border-l-2 border-clay/45 bg-clay-soft/40 px-4 py-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                Only Amy wrote this down
              </p>
              <p className="mt-1.5 font-serif text-[15.5px] leading-[1.7] text-ink">
                On a Lineweaver-Burk plot, competitive moves the x intercept
                and non competitive moves the y intercept. That is the graph
                question every year.
              </p>
            </div>

            <p className="mt-6 border-t border-edge pt-4 text-[12.5px] leading-[1.7] text-ink-faint">
              <span className="font-semibold text-ink-muted">Still open.</span>{" "}
              Paul asked whether substrate ever rescues non competitive
              inhibition. Nobody has answered yet, so it stays on the note.
            </p>
          </article>
        </div>
      </Reveal>
    </section>
  );
}
