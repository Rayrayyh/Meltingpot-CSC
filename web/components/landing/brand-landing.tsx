import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CursorLock } from "@/components/landing/cursor-lock";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HeroDashboard } from "@/components/landing/hero-dashboard";
import { HeroMotion } from "@/components/landing/hero-motion";
import { NamesOnTheNote } from "@/components/landing/names-on-the-note";
import { ScrollStopper } from "@/components/landing/scroll-stopper";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { PRINCIPLES, STEPS } from "@/components/landing/site-content";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Magnetic } from "@/components/ui/magnetic";
import { RollText } from "@/components/ui/roll-text";

/**
 * The public landing: brand hero up top, the join and create paths one scroll
 * below, then the melt story. Signed-in people are welcome here too, so the
 * account calls to action turn into a way back to their dashboard rather than
 * asking them to sign in again.
 */
export function BrandLanding({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="flex flex-col">
      <CursorLock />
      <HeroMotion />
      {/* Same ground as the hero, so the top of the page is one surface
          rather than a paper band over a sunken one. */}
      <div className="bg-sunken">
        <SiteHeader signedIn={signedIn} getStartedHref="/join" />
      </div>

      <main id="main" className="flex flex-col">
      <section id="top" className="relative overflow-hidden bg-sunken">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-12 pt-8 sm:pt-10 pb-16 md:pb-0 text-center">
          {/* Fluid so the three forced lines never become four or five. */}
          {/* One mask per line, so each can rise out of its own edge rather
              than the whole block fading. The three lines were already forced
              with breaks, so nothing about the wrapping changes. */}
          <h1 className="font-display text-[32px] sm:text-[clamp(2.1rem,3.4vw,3.4rem)] font-semibold leading-[1.08] tracking-tight text-ink">
            {["Everyone takes notes.", "MeltingPot brings", "them together."].map(
              (line) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <span data-hero-line className="block">
                    {line}
                  </span>
                </span>
              ),
            )}
          </h1>
          <p
            data-hero-support
            className="mx-auto mt-5 max-w-2xl text-lg sm:text-xl text-ink-muted leading-relaxed"
          >
            Turn scattered notes, resources, and explanations into one
            shared course space your whole class can explore.
          </p>
          <div
            data-hero-support
            className="mt-8 flex flex-wrap items-center justify-center gap-8"
          >
            <Magnetic>
              <Button href={signedIn ? "/home" : "/join"} size="lg" roll>
                {signedIn ? "Go to dashboard" : "Join a class"}
              </Button>
            </Magnetic>
            <a
              href="#explore"
              className="group/roll inline-flex items-center gap-2 text-[16px] font-medium text-ink hover:text-primary transition-colors"
            >
              <RollText>Learn more</RollText>
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover/roll:translate-x-1"
                aria-hidden
              />
            </a>
          </div>
        </div>
        {/* The product shot: a Pot page built from the shipped components,
            tilted 7 degrees and cropped by this container so the surface
            reads as continuing past the fold. The container height, not the
            section, owns the cut, so the crop line stays on the same swept
            row of the card at every viewport width. Below md the card would
            be illegible at any honest scale, so the hero is copy only there.

            Decorative throughout: fabricated demo content, hidden from
            assistive tech, inert to pointer and selection. */}
        <div
          aria-hidden
          inert
          data-hero-shot
          className="pointer-events-none select-none mt-10 hidden h-[586px] justify-start overflow-hidden md:flex min-[1360px]:justify-center"
        >
          {/* The shadow lives here, on an untransformed wrapper, as a filter:
              the silhouette tilts with the card but the light stays overhead. */}
          <div className="pl-4 sm:pl-10 min-[1360px]:pl-0 pt-6 will-change-transform [filter:var(--shadow-hero)]">
            <div
              style={{
                transform: "translateX(-4px) skewY(1.5deg) skewX(-7deg)",
                transformOrigin: "50% 50%",
              }}
            >
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* Slot two names the problem, then gives every arrival a door that
          works. The audit that reshaped it: both hero CTAs used to land on a
          code form almost no first-time visitor could complete, with the
          teacher path in 13px fine print and the demo class nowhere. Now the
          codeless majority gets the live demo Pot, code holders get a compact
          entry whose button never plays dead, and teachers get equal billing.
          The old #spaces id survives for stale links. The hero and header
          CTAs point at /join, the page that still owns a code field. */}
      <section
        id="spaces"
        className="px-6 sm:px-10 py-16 sm:py-20 bg-surface border-y border-edge scroll-mt-8"
      >
        {/* Layer-cake scanning only works when a heading summarises what sits
            under it, and the old one described the problem while the grid
            below shows eight features. The heading now names the grid, in the
            product's own earlier words, and the eyebrow is gone: it is a
            minority pattern and it was saying what the heading already says. */}
        <div className="mx-auto w-full max-w-[1672px] px-0">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-ink">
              Everything your class knows, in one Pot.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed">
              Shared notes, corrections, study tools and due dates, in one place.
            </p>
          </div>
        </div>

        {/* The bento is the reference sheet at its own size, 1672 by 941, so
            it steps outside the section's 1152px container. */}
        <div className="mt-10">
          <FeatureBento />
        </div>

      </section>

      <div id="explore" className="scroll-mt-8">
        <ScrollStopper />
      </div>

      <section className="px-6 sm:px-10 py-24 sm:py-36 bg-surface border-y border-edge">
        <Reveal className="mx-auto w-full max-w-5xl space-y-16">
          <div className="max-w-lg space-y-3">
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-clay">
              Three steps, no friction
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              As easy as typing what you know.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10 lg:gap-14">
            {STEPS.map((step) => (
              <div key={step.number} className="group space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary font-display text-lg font-semibold transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                    {step.number}
                  </span>
                  <step.icon className="size-5 text-ink-faint" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-6 sm:px-10 py-24 sm:py-36">
        <Reveal className="mx-auto w-full max-w-5xl space-y-16">
          <div className="max-w-lg space-y-3">
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-clay">
              Built on trust
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Your words stay yours.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {PRINCIPLES.map((principle) => (
              <div
                key={principle.title}
                className="bg-surface border border-edge rounded-(--radius-card) p-8 space-y-4 shadow-(--shadow-card) transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-(--shadow-raised)"
              >
                <principle.icon className="size-7 text-primary" weight="duotone" aria-hidden />
                <h3 className="text-lg font-semibold text-ink">{principle.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{principle.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <NamesOnTheNote />

      {/* Its own top padding: the section above it ends on a border, so the
          orange card cannot borrow the gap it used to inherit. */}
      <section className="px-6 sm:px-10 pt-24 sm:pt-32 pb-28 sm:pb-36">
        <Reveal className="mx-auto w-full max-w-4xl bg-primary rounded-(--radius-card) px-8 py-16 sm:px-16 sm:py-20 text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-on-primary">
            Start your Pot tonight.
          </h2>
          <p className="text-sm sm:text-base text-on-primary/80 max-w-md mx-auto leading-relaxed">
            Create it in ten seconds, share one code, and watch the vault fill
            before the next exam.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              href="/pots/new"
              size="lg"
              roll
              className="bg-surface text-primary hover:bg-surface/90"
            >
              Create a Pot
            </Button>
            <Link
              href="/join"
              className="text-[14px] font-medium text-on-primary/90 hover:text-on-primary underline underline-offset-4"
            >
              or enter a class code
            </Link>
          </div>
        </Reveal>
      </section>

      </main>

      <SiteFooter />
    </div>
  );
}
