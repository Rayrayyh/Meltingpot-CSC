import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarStar,
  Cards,
  ClockCounterClockwise,
  Crown,
  MagnifyingGlass,
  Notebook,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { JoinCard } from "@/components/landing/join-card";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Reveal } from "@/components/ui/reveal";
import { getAuthUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Classes",
  description:
    "A Pot is one class's shared space. Join with a six-character code, see the vault before you sign up, and study from what your class builds together.",
};

// Each card carries an id, because section two's bento links a tile straight
// at the card that describes it: eight tiles used to resolve to three pages
// and land at the top of each, which told the reader nothing about the
// feature they had just clicked.
const INSIDE = [
  {
    id: "shared-notes",
    icon: Notebook,
    title: "Shared notes, in sections",
    body: "Everything the class has approved, filed under the sections your course uses, with every original one tap away.",
  },
  {
    id: "study",
    icon: Cards,
    title: "Flashcards and practice tests",
    body: "Made out of the notes your class already shared, so the questions are about your course. One deck for everyone, and tests you set up before you sit them.",
  },
  {
    id: "search",
    icon: MagnifyingGlass,
    title: "Search that reaches everything",
    body: "Titles, summaries, note bodies, sections, contributors, and attachments, across every class you belong to.",
  },
  {
    id: "history",
    icon: ClockCounterClockwise,
    title: "History with names on it",
    body: "Every version of every note stays readable, and everyone who touched it stays credited.",
  },
  {
    id: "calendar",
    icon: CalendarStar,
    title: "A calendar for what happened and what is coming",
    body: "What the class shared, day by day, next to anything due from a course the Pot is linked to. Days are cut in your own time zone.",
  },
];

export default async function ClassesPage() {
  const user = await getAuthUser();

  return (
    <div className="flex flex-col">
      <SiteHeader signedIn={Boolean(user)} active="/classes" />

      <section className="px-6 sm:px-10 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-clay">
            One Pot per class
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] text-ink">
            Classes
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-ink-muted leading-relaxed">
            A class space is called a Pot: one shared vault for one course,
            built by the people taking it. A six-character code is the whole
            invitation, and you see the Pot before you are asked to sign up.
          </p>
        </div>
      </section>

      <section className="px-6 sm:px-10 py-20 sm:py-28 bg-surface border-y border-edge">
        <div className="mx-auto w-full max-w-6xl grid lg:grid-cols-[1fr_minmax(0,26rem)] gap-14 lg:gap-24 items-center">
          <div className="space-y-7">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.08] text-ink">
              Half-finished notebooks add up to one worth studying from.
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed max-w-xl">
              Everyone remembers a different half of the lecture. When each
              person types up their half and the class signs off on what gets
              shared, the Pot holds more than any single notebook would, and
              someone has read every line of it.
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 pt-1 text-[13px] text-ink-muted">
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                No login wall before you see the Pot
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                One code invites the whole class
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                You approve every share
              </li>
            </ul>
          </div>
          <div className="w-full space-y-4">
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              For students
            </p>
            <JoinCard />
            <p className="text-center text-[13px] text-ink-muted">
              Teaching a class?{" "}
              <Link
                href="/pots/new"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Create a Pot
              </Link>{" "}
              and share the code.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 py-20 sm:py-28">
        <Reveal className="mx-auto w-full max-w-5xl space-y-14">
          <div className="max-w-lg space-y-3">
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-clay">
              Inside a Pot
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Everything a course collects.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {INSIDE.map((item) => (
              <div
                key={item.title}
                id={item.id}
                className="scroll-mt-24 bg-surface border border-edge rounded-(--radius-card) p-8 space-y-4 shadow-(--shadow-card)"
              >
                <item.icon className="size-7 text-primary" weight="duotone" aria-hidden />
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section
        id="roles"
        className="scroll-mt-24 px-6 sm:px-10 py-20 sm:py-28 bg-surface border-y border-edge"
      >
        <Reveal className="mx-auto w-full max-w-5xl space-y-12">
          <div className="max-w-xl space-y-3">
            <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-clay">
              Who does what
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Members write. Maintainers keep it right.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-paper border border-edge rounded-(--radius-card) p-8 space-y-4">
              <UsersThree className="size-7 text-primary" weight="duotone" aria-hidden />
              <h3 className="text-lg font-semibold text-ink">Members</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Everyone who joins. They write notes, share what they approve,
                suggest corrections, and study from the vault. A draft stays
                private until they say otherwise.
              </p>
            </div>
            <div className="bg-paper border border-edge rounded-(--radius-card) p-8 space-y-4">
              <Crown className="size-7 text-primary" weight="duotone" aria-hidden />
              <h3 className="text-lg font-semibold text-ink">Maintainers</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Usually the teacher or a few trusted students. They review
                corrections, manage sections and membership, and can close
                joining or regenerate the class code when it leaks.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
