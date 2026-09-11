import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  CalendarStar,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartBar,
  ClockCounterClockwise,
  FileText,
  GraduationCap,
  MagnifyingGlass,
  Users,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { PotMark } from "@/components/brand/pot-mark";
import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

/**
 * Section two: a reproduction of the owner's nine reference sheets, which sit
 * on main at 68d6448. Every string is transcribed from those sheets, every
 * colour was sampled out of the PNGs, and every dimension below is in the
 * sheet's own pixels: the frame is 1672 by 941, exactly meltingpot-bento.png,
 * and `u()` turns a reference pixel into a fraction of the frame's width so
 * the whole grid scales as one picture rather than reflowing.
 *
 * The gradients, the class contribution total and the collaboration feed are
 * all here because the owner asked for the references copied exactly on
 * 2026-09-10. That lifts the no-gradients rule for this block, and it puts a
 * class-wide total on the page, which the private-record rule would otherwise
 * refuse; `memory/decisions/046` records both as the owner's call.
 *
 * Everything inside a tile below the heading and its line of copy is drawn
 * chrome and is aria-hidden, the convention HeroDashboard already set, so a
 * screen reader gets eight headings and eight sentences rather than a
 * fabricated class.
 */

/** One pixel of the reference sheet. */
const u = (n: number) => `calc(var(--u) * ${n})`;

export function FeatureBento() {
  return (
    <div className="bento-frame">
      <div data-testid="feature-bento" className="bento">
        <ContributionsTile />
        <HistoryTile />
        <CalendarTile />
        <div className="bento-band [grid-column:2] [grid-row:2]">
          <CollaborationTile />
          <NotesTile />
        </div>
        <ToolsTile />
        <AiTile />
        <SearchTile />
      </div>
    </div>
  );
}

/**
 * One tile. The lift is per tile rather than one wrapper around the grid,
 * because framer starts a whileInView animation only once the fraction of the
 * element named by `amount` is on screen, and the whole grid is taller than a
 * laptop viewport, so a single wrapper never reached its threshold and left
 * the section at opacity zero for good.
 */
function Tile({
  area,
  skin,
  lip = false,
  pad = 22,
  delay,
  children,
}: {
  /** Where the tile sits in the sheet's grid. It has to land on the Reveal,
   *  which is the grid item; putting it on the tile inside left all eight to
   *  auto-place and the bottom row ended up in the wrong columns. */
  area?: string;
  skin: string;
  lip?: boolean;
  pad?: number;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal className={cn("min-w-0", area)} delay={delay}>
      <div
        data-bento-tile
        className={cn("bento-tile flex h-full flex-col", skin, lip && "bento-lip")}
        style={{ padding: u(pad) }}
      >
        {children}
      </div>
    </Reveal>
  );
}

/** The heading and the one line of copy, the only readable text in a tile. */
function Head({
  title,
  body,
  size,
  bodySize,
  onDark = false,
}: {
  title: string;
  body: string;
  size: number;
  bodySize: number;
  onDark?: boolean;
}) {
  return (
    <div className="min-w-0">
      <h3
        className="font-extrabold leading-[1.08] tracking-[-0.025em]"
        style={{ fontSize: u(size), color: onDark ? "#ffffff" : "var(--b-ink)" }}
      >
        {title}
      </h3>
      <p
        className="font-normal leading-[1.3]"
        style={{
          marginTop: u(4),
          fontSize: u(bodySize),
          color: onDark ? "rgb(255 255 255 / 0.92)" : "var(--b-ink-muted)",
        }}
      >
        {body}
      </p>
    </div>
  );
}

/** The white circle with a navy arrow that two of the sheets carry. */
function ArrowButton({ href, label, size }: { href: string; label: string; size: number }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group/arrow bento-float inline-flex shrink-0 items-center justify-center rounded-full bg-white transition-transform duration-300 hover:-translate-y-0.5"
      style={{ width: u(size), height: u(size) }}
    >
      <ArrowRight
        className="transition-transform duration-300 group-hover/arrow:translate-x-0.5"
        weight="bold"
        style={{ width: u(size * 0.44), height: u(size * 0.44), color: "var(--b-ink)" }}
        aria-hidden
      />
    </Link>
  );
}


/** The app's avatar at a reference-pixel size. Avatar's own sizes are fixed
 *  Tailwind px, so at anything under the sheet's width they stayed put while
 *  the rest of the picture shrank and pushed the rows taller. */
function BentoAvatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="block shrink-0 [&>span]:!h-full [&>span]:!w-full [&_svg]:!h-1/2 [&_svg]:!w-1/2"
      style={{ width: u(size), height: u(size) }}
    >
      <Avatar name={name} size="sm" />
    </span>
  );
}

/* ------------------------------------------------------------ 1 of 8 ----- */

/** Twenty four weeks by six days, the shape the reference sheet draws, at the
 *  density it draws: mostly mid orange, a scatter of amber, a few near white. */
const HEATMAP = [
  "232232322323253223123232",
  "342324423245235524232423",
  "245323242324323252324542",
  "232423232432324232342324",
  "324234243243523242532423",
  "232423243232523423252342",
];

const HEAT = ["#d9660f", "#e8813a", "#f2a05e", "#fbc98f", "#fdf3e6"];

function ContributionsTile() {
  return (
    <Tile
      area="[grid-column:1] [grid-row:1/span_2]"
      skin="bento-contrib"
      lip
      pad={24}
      delay={0}
    >
      <div className="flex items-center justify-between" style={{ gap: u(8) }}>
        <div className="flex min-w-0 items-center" style={{ gap: u(9) }}>
          {/* The sheet shows the mark in white. The artwork ships orange with
              the mouth and the m as transparent holes, so inverting it to
              white lets the card's own orange come through them. */}
          <span className="block shrink-0" style={{ width: u(40), height: u(40) }}>
            <PotMark className="size-full [filter:brightness(0)_invert(1)]" />
          </span>
          <span
            className="font-brand truncate font-semibold leading-none text-white"
            style={{ fontSize: u(27) }}
          >
            meltingpot
          </span>
        </div>
        <span
          aria-hidden
          className="inline-flex shrink-0 items-center rounded-full font-medium text-white"
          style={{
            gap: u(6),
            padding: `${u(9)} ${u(14)}`,
            fontSize: u(15),
            background: "rgb(255 255 255 / 0.18)",
            boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.22)",
          }}
        >
          This semester
          <CaretDown style={{ width: u(13), height: u(13) }} weight="bold" />
        </span>
      </div>

      {/* The three amber strokes the sheet fans down the right hand side. */}
      <span
        aria-hidden
        className="pointer-events-none absolute block"
        style={{ right: u(26), top: u(196), width: u(112), height: u(122) }}
      >
        {[
          { w: 52, r: -38, x: 4, y: 0 },
          { w: 44, r: -38, x: 32, y: 40 },
          { w: 36, r: -16, x: 54, y: 84 },
        ].map((d, i) => (
          <span
            key={i}
            className="absolute left-0 top-0 block rounded-full"
            style={{
              width: u(d.w),
              height: u(12),
              background: "#fbb96c",
              transform: `translate(${u(d.x)}, ${u(d.y)}) rotate(${d.r}deg)`,
            }}
          />
        ))}
      </span>

      <h3
        className="font-extrabold leading-[1.02] tracking-[-0.035em] text-white"
        style={{ marginTop: u(24), fontSize: u(43), maxWidth: u(330) }}
      >
        Contributions make progress visible.
      </h3>
      <p
        className="leading-[1.32] text-white"
        style={{ marginTop: u(14), fontSize: u(18), maxWidth: u(345) }}
      >
        See how your calculus group builds knowledge together, one idea at a
        time.
      </p>

      <div
        aria-hidden
        className="flex items-center bg-white"
        style={{
          marginTop: u(18),
          gap: u(12),
          borderRadius: u(18),
          padding: `${u(12)} ${u(16)}`,
          boxShadow: "0 10px 26px rgb(90 35 5 / 0.16)",
        }}
      >
        <Users
          className="shrink-0"
          weight="fill"
          style={{ width: u(34), height: u(34), color: "#e8560e" }}
        />
        <div className="min-w-0 flex-1">
          <p
            className="font-extrabold leading-none tracking-[-0.02em]"
            style={{ fontSize: u(34), color: "var(--b-ink)" }}
          >
            128
          </p>
          <p
            className="truncate"
            style={{ marginTop: u(4), fontSize: u(15), color: "var(--b-ink-muted)" }}
          >
            Total contributions
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center font-extrabold"
          style={{ gap: u(3), fontSize: u(20), color: "var(--b-green)" }}
        >
          <ArrowUp style={{ width: u(17), height: u(17) }} weight="bold" />
          +24%
        </span>
      </div>

      <div aria-hidden className="flex" style={{ marginTop: u(16), gap: u(3) }}>
        {Array.from({ length: 24 }, (_, col) => (
          <div key={col} className="flex flex-1 flex-col" style={{ gap: u(3) }}>
            {HEATMAP.map((row, r) => (
              <span
                key={r}
                className="aspect-square"
                style={{ borderRadius: u(3), background: HEAT[Number(row[col]) - 1] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className="flex text-white"
        style={{ marginTop: u(8), fontSize: u(14) }}
      >
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
          <span key={m} className="flex-1">
            {m}
          </span>
        ))}
      </div>

      <p
        className="mt-auto text-white"
        style={{ paddingTop: u(12), fontSize: u(16) }}
      >
        Knowledge grows together.
      </p>
    </Tile>
  );
}

/* ------------------------------------------------------------ 2 of 8 ----- */

const VERSIONS = [
  { tag: "v1.0", line: "Initial notes on limits", date: "Mar 4" },
  { tag: "v1.1", line: "Added integral examples", date: "Mar 6" },
  { tag: "v1.2", line: "Solved series problems", date: "Mar 10", now: true },
  { tag: "v1.3", line: "Finalized study guide", date: "Mar 12" },
];

function HistoryTile() {
  return (
    <Tile
      area="[grid-column:2] [grid-row:1]"
      skin="bento-history"
      lip
      delay={0.06}
    >
      <div className="flex items-start justify-between" style={{ gap: u(16) }}>
        <div className="flex min-w-0 items-start" style={{ gap: u(14) }}>
          <ClockCounterClockwise
            className="shrink-0"
            weight="bold"
            style={{ marginTop: u(2), width: u(42), height: u(42), color: "var(--b-orange-deep)" }}
            aria-hidden
          />
          <Head
            title="Version history"
            body="Track changes, explore calculus ideas, and never lose a good thought."
            size={34}
            bodySize={18}
          />
        </div>
        <Link
          href="/how-it-works"
          className="group/roll bento-float inline-flex shrink-0 items-center rounded-full bg-white font-medium transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            gap: u(10),
            padding: `${u(13)} ${u(22)}`,
            fontSize: u(17),
            color: "var(--b-ink)",
          }}
        >
          View history
          <ArrowRight
            className="transition-transform duration-300 group-hover/roll:translate-x-0.5"
            weight="bold"
            style={{ width: u(17), height: u(17) }}
            aria-hidden
          />
        </Link>
      </div>

      <div
        aria-hidden
        className="mt-auto flex items-stretch"
        style={{ paddingTop: u(14) }}
      >
        {VERSIONS.map((v, i) => (
          <Fragment key={v.tag}>
            {i > 0 && (
              <span
                className="my-auto flex shrink-0 items-center"
                style={{ gap: u(4), paddingInline: u(6) }}
              >
                {VERSIONS[i - 1].now ? (
                  <span
                    className="rounded-full bg-white"
                    style={{ width: u(11), height: u(11) }}
                  />
                ) : (
                  <span style={{ width: u(12), height: 1, background: "var(--b-rail)" }} />
                )}
                <span
                  className="rounded-full"
                  style={{ width: u(11), height: u(11), background: "var(--b-rail)" }}
                />
                {v.now ? (
                  <span
                    className="rounded-full bg-white"
                    style={{ width: u(11), height: u(11) }}
                  />
                ) : (
                  <span style={{ width: u(12), height: 1, background: "var(--b-rail)" }} />
                )}
              </span>
            )}
            <div
              className={cn("min-w-0 flex-1", v.now ? "bento-chip-now" : "bento-float bg-[#fefbf6]")}
              style={{ borderRadius: u(16), padding: `${u(12)} ${u(14)}` }}
            >
              <p
                className="font-extrabold leading-none tracking-[-0.02em]"
                style={{ fontSize: u(21), color: v.now ? "#ffffff" : "var(--b-ink)" }}
              >
                {v.tag}
              </p>
              <p
                className="leading-[1.28]"
                style={{
                  marginTop: u(7),
                  fontSize: u(15),
                  color: v.now ? "rgb(255 255 255 / 0.94)" : "var(--b-ink-muted)",
                }}
              >
                {v.line}
              </p>
              <p
                style={{
                  marginTop: u(6),
                  fontSize: u(14),
                  color: v.now ? "rgb(255 255 255 / 0.82)" : "var(--b-ink-soft)",
                }}
              >
                {v.date}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ 3 of 8 ----- */

/** March 2025, Monday first, exactly the four rows the sheet draws. */
const MONTH = [
  ["24", "25", "26", "27", "28", "1", "2"],
  ["3", "4", "5", "6", "7", "8", "9"],
  ["10", "11", "12", "13", "14", "15", "16"],
  ["17", "18", "19", "20", "21", "22", "23"],
];

const AGENDA = [
  { title: "Differential equations test", when: "Today, 2:00 PM", dot: "#fd852e" },
  { title: "Improper integrals review", when: "Thu, Mar 14, 10:00 AM", dot: "#fbce83" },
  { title: "Take-home quiz due", when: "Mon, Mar 17, 11:59 PM", dot: "#d5d5d8" },
];

function CalendarTile() {
  return (
    <Tile
      area="[grid-column:3] [grid-row:1/span_2]"
      skin="bento-calendar"
      delay={0.12}
    >
      <div className="flex items-start" style={{ gap: u(12) }}>
        <CalendarStar
          className="shrink-0"
          weight="fill"
          style={{ marginTop: u(2), width: u(34), height: u(34), color: "#e2540e" }}
          aria-hidden
        />
        <Head
          title="Calendar"
          body="Keep your calculus study plan on track."
          size={26}
          bodySize={16}
        />
      </div>

      <div aria-hidden style={{ marginTop: u(18) }}>
        <div className="flex items-center justify-between" style={{ paddingInline: u(4) }}>
          <CaretLeft style={{ width: u(20), height: u(20), color: "var(--b-ink)" }} weight="bold" />
          <p
            className="font-extrabold tracking-[-0.02em]"
            style={{ fontSize: u(22), color: "var(--b-ink)" }}
          >
            Mar 2025
          </p>
          <CaretRight style={{ width: u(20), height: u(20), color: "var(--b-ink)" }} weight="bold" />
        </div>
        <div
          className="grid grid-cols-7 text-center font-medium"
          style={{ marginTop: u(12), fontSize: u(15), color: "var(--b-ink-soft)" }}
        >
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div
          className="grid grid-cols-7 text-center font-semibold"
          style={{ marginTop: u(6), rowGap: u(4), fontSize: u(16) }}
        >
          {MONTH.flat().map((day, i) => {
            const outside = i < 5;
            const today = day === "12";
            return (
              <span key={i} className="flex items-center justify-center">
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    width: u(32),
                    height: u(32),
                    ...(today
                      ? { background: "#e2540e", color: "#ffffff" }
                      : { color: outside ? "var(--b-ink-soft)" : "var(--b-ink)" }),
                  }}
                >
                  {day}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden
        className="mt-auto"
        style={{ paddingTop: u(18), borderTop: `1px solid #e6e3df`, marginTop: u(20) }}
      >
        {AGENDA.map((item, i) => (
          <div
            key={item.title}
            className="flex items-start"
            style={{ gap: u(10), marginTop: i === 0 ? 0 : u(9) }}
          >
            <span
              className="shrink-0 rounded-full"
              style={{ marginTop: u(5), width: u(13), height: u(13), background: item.dot }}
            />
            <div className="min-w-0">
              <p
                className="font-bold leading-tight"
                style={{ fontSize: u(16), color: "var(--b-ink)" }}
              >
                {item.title}
              </p>
              <p style={{ marginTop: u(3), fontSize: u(15), color: "var(--b-ink-muted)" }}>
                {item.when}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ 4 of 8 ----- */

const MESSAGES = [
  { name: "Rayyan", when: "2h ago", text: "This integral solution looks great!" },
  { name: "Ibrahim", when: "4h ago", text: "Added a step for u-substitution here." },
  {
    name: "Ahmad",
    when: "1d ago",
    text: "Should we try an alternative method for this limit?",
  },
];

function CollaborationTile() {
  return (
    <Tile skin="bento-collab" delay={0.06}>
      <div className="flex items-start justify-between" style={{ gap: u(10) }}>
        <div className="flex min-w-0 items-start" style={{ gap: u(12) }}>
          <UsersThree
            className="shrink-0"
            weight="fill"
            style={{ marginTop: u(2), width: u(34), height: u(34), color: "#e8560e" }}
            aria-hidden
          />
          <Head
            title="Collaboration"
            body="Work through calculus together."
            size={26}
            bodySize={16}
          />
        </div>
        <div aria-hidden className="flex shrink-0 items-center">
          <div className="flex" style={{ marginRight: u(8) }}>
            {["Rayyan", "Maya", "Paul"].map((n, i) => (
              <span
                key={n}
                className="inline-block rounded-full ring-2 ring-white"
                style={{ marginLeft: i === 0 ? 0 : u(-9) }}
              >
                <BentoAvatar name={n} size={28} />
              </span>
            ))}
          </div>
          <span
            className="inline-flex items-center justify-center rounded-full font-extrabold"
            style={{
              width: u(30),
              height: u(30),
              fontSize: u(13),
              background: "#e8ecf7",
              color: "var(--b-ink)",
            }}
          >
            +3
          </span>
        </div>
      </div>

      <div aria-hidden className="mt-auto" style={{ paddingTop: u(10) }}>
        {MESSAGES.map((m, i) => (
          <div
            key={m.name}
            className="flex items-start"
            style={{
              gap: u(10),
              marginTop: i === 0 ? 0 : u(6),
              borderRadius: u(16),
              padding: `${u(7)} ${u(12)}`,
              background: "#f7f6f6",
            }}
          >
            <BentoAvatar name={m.name} size={30} />
            <div className="min-w-0">
              <p className="leading-none" style={{ fontSize: u(16) }}>
                <span className="font-extrabold" style={{ color: "var(--b-ink)" }}>
                  {m.name}
                </span>{" "}
                <span style={{ fontSize: u(14), color: "var(--b-ink-soft)" }}>{m.when}</span>
              </p>
              <p
                className="leading-[1.3]"
                style={{ marginTop: u(4), fontSize: u(15), color: "var(--b-ink-muted)" }}
              >
                {m.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ 5 of 8 ----- */

const NOTE_ROWS = [
  { dot: "#f4400e", bar: "var(--b-bar)", w: 62 },
  { dot: "#fcb75c", bar: "#fcc47a", w: 48 },
  { dot: "#d9d9d9", bar: "var(--b-bar)", w: 54 },
  { dot: "#d9d9d9", bar: "var(--b-bar)", w: 70 },
];

function NotesTile() {
  return (
    <Tile skin="bento-notes" delay={0.12}>
      <div className="flex items-start justify-between" style={{ gap: u(10) }}>
        <div className="flex min-w-0 items-start" style={{ gap: u(12) }}>
          <NoteGlyph />
          <Head
            title="Shared notes"
            body="Organize calculus notes, problem sets, and solutions together."
            size={26}
            bodySize={15}
          />
        </div>
        <ArrowButton href="/how-it-works" label="See how shared notes work" size={44} />
      </div>

      <div aria-hidden className="relative mt-auto" style={{ paddingTop: u(10) }}>
        <div className="bg-white" style={{ borderRadius: u(18), padding: u(12) }}>
          <p
            className="font-extrabold tracking-[-0.02em]"
            style={{ fontSize: u(19), color: "var(--b-ink)" }}
          >
            Calculus Notes
          </p>
          <div style={{ marginTop: u(10) }}>
            {NOTE_ROWS.map((r, i) => (
              <div
                key={i}
                className="flex items-center"
                style={{ gap: u(10), marginTop: i === 0 ? 0 : u(9) }}
              >
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: u(14), height: u(14), background: r.dot }}
                />
                <span
                  className="rounded-full"
                  style={{ height: u(10), background: r.bar, width: `${r.w}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div
          className="bento-float absolute flex items-center bg-white"
          style={{
            right: u(8),
            top: u(78),
            gap: u(10),
            borderRadius: u(16),
            padding: `${u(9)} ${u(12)}`,
          }}
        >
          <BentoAvatar name="Paul" size={28} />
          <div>
            <p
              className="font-extrabold leading-none"
              style={{ fontSize: u(15), color: "var(--b-ink)" }}
            >
              Edited by Paul
            </p>
            <p style={{ marginTop: u(4), fontSize: u(14), color: "var(--b-ink-muted)" }}>
              10 min ago
            </p>
          </div>
        </div>
      </div>
    </Tile>
  );
}

/** The sheet's orange document mark: a rounded page with a folded corner and
 *  two white rules. Phosphor has nothing with the folded corner filled. */
function NoteGlyph() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="shrink-0"
      style={{ marginTop: u(2), width: u(34), height: u(34) }}
      aria-hidden
    >
      <path
        d="M6 8a5 5 0 0 1 5-5h13l10 10v19a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V8Z"
        fill="#ea6a15"
      />
      <path d="M24 3l10 10h-7a3 3 0 0 1-3-3V3Z" fill="#f79a4e" />
      <rect x="12" y="16" width="14" height="3.4" rx="1.7" fill="#ffffff" />
      <rect x="12" y="23" width="10" height="3.4" rx="1.7" fill="#ffffff" />
    </svg>
  );
}

/* ------------------------------------------------------------ 6 of 8 ----- */

const TOOLS = [
  { icon: FileText, label: "Formula flashcards" },
  { icon: ChartBar, label: "Practice problem sets" },
  { icon: GraduationCap, label: "Study guides" },
];

function ToolsTile() {
  return (
    <Tile area="[grid-column:1] [grid-row:3]" skin="bento-tools" delay={0.06}>
      <div className="flex items-start justify-between" style={{ gap: u(10) }}>
        <div className="flex min-w-0 items-start" style={{ gap: u(12) }}>
          <BookOpen
            className="shrink-0"
            weight="fill"
            style={{ marginTop: u(2), width: u(36), height: u(36), color: "#e8560e" }}
            aria-hidden
          />
          <Head
            title="Study tools"
            body="Everything you need to master calculus."
            size={26}
            bodySize={16}
          />
        </div>
        <ArrowButton href="/how-it-works" label="See how study tools work" size={46} />
      </div>

      <div
        aria-hidden
        className="mt-auto grid grid-cols-3"
        style={{ paddingTop: u(10), gap: u(10) }}
      >
        {TOOLS.map((t) => (
          <div
            key={t.label}
            className="flex flex-col items-center justify-center bg-white text-center"
            style={{ gap: u(8), borderRadius: u(16), padding: `${u(10)} ${u(6)}` }}
          >
            <t.icon
              weight="fill"
              style={{ width: u(32), height: u(32), color: "var(--b-slate)" }}
            />
            <span
              className="font-extrabold leading-[1.2]"
              style={{ fontSize: u(16), color: "var(--b-ink)" }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ 7 of 8 ----- */

/** The sheet's four pointed star, which Phosphor's Sparkle does not match. */
function Star({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: u(size), height: u(size) }}
      className={className}
      aria-hidden
    >
      <path
        d="M12 0c.5 6.3 5.2 11 11.5 11.5C17.2 12 12.5 16.7 12 23c-.5-6.3-5.2-11-11.5-11.5C6.8 11 11.5 6.3 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AiTile() {
  return (
    <Tile area="[grid-column:2] [grid-row:3]" skin="bento-ai" lip delay={0.12}>
      <div className="flex items-start justify-between" style={{ gap: u(16) }}>
        <div className="flex min-w-0 items-start text-white" style={{ gap: u(14) }}>
          <span
            aria-hidden
            className="relative block shrink-0"
            style={{ marginTop: u(2), width: u(40), height: u(40) }}
          >
            <Star size={32} className="absolute left-0 top-0" />
            <Star size={15} className="absolute bottom-0 right-0" />
          </span>
          <Head
            title="AI summaries"
            body="Turn long calculus discussions into clear takeaways."
            size={30}
            bodySize={18}
            onDark
          />
        </div>
        <Link
          href="/how-it-works"
          className="group/roll inline-flex shrink-0 items-center rounded-full font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            gap: u(10),
            padding: `${u(13)} ${u(22)}`,
            fontSize: u(17),
            background: "rgb(255 255 255 / 0.2)",
            boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.24)",
          }}
        >
          Try it out
          <ArrowRight
            className="transition-transform duration-300 group-hover/roll:translate-x-0.5"
            weight="bold"
            style={{ width: u(17), height: u(17) }}
            aria-hidden
          />
        </Link>
      </div>

      <div
        aria-hidden
        className="bento-panel mt-auto flex items-center"
        style={{ marginTop: u(10), gap: u(18), borderRadius: u(18), padding: u(12) }}
      >
        <span
          className="flex shrink-0 items-center justify-center"
          style={{
            width: u(50),
            height: u(50),
            borderRadius: u(16),
            background: "rgb(255 255 255 / 0.2)",
          }}
        >
          <FileText style={{ width: u(28), height: u(28) }} className="text-white" weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          {[100, 94, 64].map((w, i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{
                height: u(12),
                width: `${w}%`,
                marginTop: i === 0 ? 0 : u(12),
                background: "rgb(255 255 255 / 0.32)",
              }}
            />
          ))}
        </div>
        <span
          className="bento-glow inline-flex shrink-0 items-center rounded-full text-white"
          style={{ gap: u(10), padding: `${u(10)} ${u(22)} ${u(10)} ${u(18)}` }}
        >
          <span className="relative block shrink-0" style={{ width: u(34), height: u(34) }}>
            <Star size={26} className="absolute left-0" />
            <Star size={11} className="absolute right-0 top-0" />
            <Star size={10} className="absolute bottom-0 right-1" />
          </span>
          <span className="font-bold leading-[1.18]" style={{ fontSize: u(18) }}>
            Key points
            <br />
            ready
          </span>
        </span>
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ 8 of 8 ----- */

const TAGS = ["#integrals", "#u-substitution", "#partial-fractions"];

function SearchTile() {
  return (
    <Tile area="[grid-column:3] [grid-row:3]" skin="bento-search" lip delay={0.18}>
      <div className="flex items-start" style={{ gap: u(12) }}>
        <MagnifyingGlass
          className="shrink-0"
          weight="bold"
          style={{ marginTop: u(2), width: u(34), height: u(34), color: "var(--b-orange-deep)" }}
          aria-hidden
        />
        <Head
          title="Search"
          body="Find notes, people, or calculus topics across your workspace."
          size={25}
          bodySize={15}
        />
      </div>

      <div
        aria-hidden
        className="mt-auto flex items-center rounded-full bg-white"
        style={{ marginTop: u(8), gap: u(8), padding: `${u(4)} ${u(4)} ${u(4)} ${u(14)}` }}
      >
        <MagnifyingGlass
          className="shrink-0"
          weight="bold"
          style={{ width: u(19), height: u(19), color: "var(--b-ink-soft)" }}
        />
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontSize: u(14), color: "var(--b-ink-soft)" }}
        >
          Search integrals, derivatives, etc...
        </span>
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full"
          style={{ width: u(34), height: u(34), background: "#fdf3e3" }}
        >
          <ArrowRight
            style={{ width: u(16), height: u(16), color: "var(--b-ink)" }}
            weight="bold"
          />
        </span>
      </div>

      <div aria-hidden className="flex flex-wrap" style={{ marginTop: u(6), gap: u(6) }}>
        {TAGS.map((t) => (
          <span
            key={t}
            className="whitespace-nowrap rounded-full font-extrabold"
            style={{
              padding: `${u(6)} ${u(10)}`,
              fontSize: u(12),
              background: "#fef2df",
              color: "var(--b-ink)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </Tile>
  );
}
