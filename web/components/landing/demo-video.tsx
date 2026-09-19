import { DemoFocus } from "@/components/landing/demo-focus";
import { DemoPlayer } from "@/components/landing/demo-player";
import { demoMedia } from "@/lib/landing/demo-media";

/**
 * The demo, sitting straight after the bento.
 *
 * The bento says what a Pot holds, in eight tiles. The obvious next question
 * is whether any of it works, and this answers it before the page starts
 * arguing about why a Pot should exist at all. That is why it goes here
 * rather than lower: further down it would follow Names on the note, which is
 * already an interactive demonstration, and two demonstrations in a row is
 * one too many.
 *
 * Self hosted rather than embedded. The site's CSP is frame-src 'self' plus
 * Clerk, so a YouTube or Vimeo iframe is refused outright, and adding an
 * origin to frame-src to carry one file is not a trade worth making. There is
 * no media-src directive, so an mp4 served from public/ falls back to
 * default-src 'self' and needs no policy change at all.
 *
 * The heading names both ends of the arc rather than the runtime. "Two
 * minutes, start to finish" was the first draft and sold the wrong thing: a
 * runtime is a cost, not a reason, and "start to finish" repeats the eyebrow
 * /how-it-works already carries. The runtime is still worth knowing before
 * somebody commits to watching, so it opens the line underneath instead.
 *
 * It also avoids opening on "one". The hero ends "in one Pot" and the bento
 * directly above ends "in one place", so a third one-something heading in the
 * first four reads as a tic. What this one does that neither of those does is
 * connect the two ends: the bento has just listed eight parts as tiles, and
 * the job here is to say the parts are one motion, in the class's terms
 * rather than in feature names. The word "watch" is deliberately absent,
 * because the hero link and the pill on the frame both already say it.
 *
 * What this wants in public/: the film, plus demo-poster.png for the frame
 * to rest on, demo.vtt for the captions button to have something to turn on,
 * and demo-preview.mp4, a few seconds of silent loop that makes the resting
 * frame move. Only the film is required; the rest each add a piece when they
 * show up. The film is found rather than named, so whatever the export is
 * called works without a code change. Without it there is nothing honest to
 * put here, so the section renders nothing at all rather than a dead frame,
 * and the hero drops its link to it. See lib/landing/demo-media.ts.
 */
export function DemoVideo() {
  if (!demoMedia) return null;

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      data-testid="demo-video"
      className="scroll-mt-8 bg-sunken px-6 sm:px-10 py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h2
            id="demo-heading"
            className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-balance text-ink"
          >
            From what you typed to what the class studies.
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed text-balance">
            Two minutes: a rough paragraph, organized, approved by the
            person who wrote it, corrected by somebody else, then turned into
            a practice test.
          </p>
        </div>

        {/* The id the hero aims at is on the frame, not on the section:
            DemoFocus centers this rather than letting the anchor top the
            section and leave the film below the fold. */}
        <div id="demo-frame">
          <DemoPlayer className="mt-10" {...demoMedia} />
        </div>
        <DemoFocus />
      </div>
    </section>
  );
}
