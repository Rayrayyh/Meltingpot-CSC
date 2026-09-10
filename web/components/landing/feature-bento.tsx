import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  Cards,
  CalendarCheck,
  ClockCounterClockwise,
  FileText,
  GraduationCap,
  ListChecks,
  MagnifyingGlass,
  Notebook,
  SealCheck,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { PotMark } from "@/components/brand/pot-mark";
import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

/**
 * Section two: eight tiles, one per thing the product actually does.
 *
 * Every inner panel here is fabricated demo chrome, the same convention
 * HeroDashboard uses, and every one of them is aria-hidden so none of it
 * reaches assistive tech or the tab order. Only the tile headings, the copy
 * and the two real links are readable.
 *
 * Two translations from the owner's reference sheets are deliberate. The
 * reference washes every tile in a gradient; the house rule allows exactly
 * one gradient, inside the brand mark, so the tiles are flat token fills and
 * the variety comes from paper, primary-soft, clay-soft, primary and clay.
 * The reference also headlines the contribution graph as a group total with
 * a growth figure, which is a scoreboard; in this product that graph is a
 * private record of one person's own days, so the tile says so.
 */
export function FeatureBento() {
  return (
    <div
      data-testid="feature-bento"
      className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12"
    >
      <RecordTile />
      <HistoryTile />
      <CalendarTile />
      <CorrectionsTile />
      <NotesTile />
      <StudyTile />
      <OrganizerTile />
      <SearchTile />
    </div>
  );
}

/**
 * One tile. The lift lives on the grid item rather than on the grid, because
 * framer only starts a whileInView animation once the fraction of the element
 * named by `amount` is on screen, and the whole bento is taller than a laptop
 * viewport, so a single wrapper around all eight never reached its threshold
 * and the section stayed at opacity zero for good.
 */
function Tile({
  className,
  span,
  delay,
  children,
}: {
  className?: string;
  span: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal className={span} delay={delay}>
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-(--radius-card) p-6 sm:p-7",
          className,
        )}
      >
        {children}
      </div>
    </Reveal>
  );
}

/** A tile heading: icon, title, one line of copy. */
function TileHead({
  icon: Icon,
  title,
  body,
  tone = "ink",
  action,
}: {
  icon: React.ComponentType<{ className?: string; weight?: "duotone"; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
  tone?: "ink" | "on-primary" | "on-clay";
  action?: React.ReactNode;
}) {
  const muted =
    tone === "ink"
      ? "text-ink-muted"
      : tone === "on-primary"
        ? "text-on-primary/80"
        : "text-on-clay/80";
  const strong =
    tone === "ink" ? "text-ink" : tone === "on-primary" ? "text-on-primary" : "text-on-clay";
  const accent = tone === "ink" ? "text-primary" : strong;
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 size-6 shrink-0", accent)} weight="duotone" aria-hidden />
      <div className="min-w-0 flex-1">
        <h3 className={cn("font-display text-lg font-semibold tracking-tight", strong)}>
          {title}
        </h3>
        <p className={cn("mt-1 text-sm leading-relaxed", muted)}>{body}</p>
      </div>
      {action}
    </div>
  );
}

/** The small round arrow the reference puts in the corner of a few tiles. */
function TileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group/arrow inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-edge bg-surface-raised text-ink transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowRight
        className="size-4 transition-transform duration-300 group-hover/arrow:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

/* ---------------------------------------------------------------- tiles -- */

/** Twelve weeks by seven days. Fixed, so the server and the client draw the
 *  same grid: 0 is a day with nothing on it, 1 to 3 are how much was written. */
const RECORD_WEEKS = [
  "0231120", "1322011", "0113230", "2201132", "1130221", "0212310",
  "3021123", "1203021", "0132210", "2110332", "1023120", "0311201",
];

function RecordTile() {
  return (
    <Tile
      delay={0}
      span="xl:col-span-3 xl:row-span-2 md:col-span-6"
      className="bg-primary text-on-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <PotMark className="size-9" />
        <span
          aria-hidden
          className="rounded-full bg-on-primary/15 px-3 py-1 text-[12px] font-medium text-on-primary"
        >
          This semester
        </span>
      </div>

      {/* Two columns while the tile runs the full width of the six column
          grid, one column again once it is back to three columns of twelve. */}
      <div className="mt-6 md:grid md:grid-cols-2 md:items-start md:gap-10 xl:block">
        <div>
          <h3 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-on-primary sm:text-[32px]">
            Your record is your own.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-on-primary/80">
            A quiet count of the days you wrote something. Nobody else sees it,
            nothing is ranked, and a slow week still shows the run you already
            managed.
          </p>
        </div>

        <div className="mt-6 md:mt-0 xl:mt-6">
          <div
            aria-hidden
            className="flex items-center justify-between gap-3 rounded-(--radius-control) bg-surface-raised px-4 py-3"
          >
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-ink">
                18 days
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">Your longest run</p>
            </div>
            <CalendarCheck className="size-7 text-primary" weight="duotone" />
          </div>

          {/* A fixed aspect keeps the cells square whatever the tile's width
              is doing, which a flexible height did not: at six columns wide
              they stretched into bars. */}
          <div
            aria-hidden
            className="mt-5 flex aspect-[220/127] w-full max-w-60 gap-[3px]"
          >
            {RECORD_WEEKS.map((week, w) => (
              <div key={w} className="flex flex-1 flex-col gap-[3px]">
                {week.split("").map((level, d) => (
                  <span
                    key={d}
                    className={cn(
                      "flex-1 rounded-[3px]",
                      level === "0" && "bg-on-primary/15",
                      level === "1" && "bg-on-primary/35",
                      level === "2" && "bg-on-primary/60",
                      level === "3" && "bg-on-primary/90",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="mt-2 flex w-full max-w-60 justify-between text-[11px] text-on-primary/70"
          >
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
          </div>
        </div>
      </div>

      <p className="mt-auto pt-6 text-sm text-on-primary/80">
        There is no leaderboard anywhere in the product.
      </p>
    </Tile>
  );
}

const VERSIONS: { tag: string; line: string; date: string; now?: boolean }[] = [
  { tag: "v1", line: "First draft, as typed", date: "4 Mar" },
  { tag: "v2", line: "Sections named", date: "6 Mar" },
  { tag: "v3", line: "Correction merged", date: "10 Mar", now: true },
  { tag: "v4", line: "Source added", date: "12 Mar" },
];

function HistoryTile() {
  return (
    <Tile delay={0.06}
      span="xl:col-span-6 md:col-span-6" className="bg-clay-soft">
      <TileHead
        icon={ClockCounterClockwise}
        title="Every version stays."
        body="Open a shared note and walk back through everything it used to say. The original is never overwritten."
        action={<TileLink href="/how-it-works" label="See how history works" />}
      />
      <div aria-hidden className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {VERSIONS.map((v, i) => (
          <Fragment key={v.tag}>
            {i > 0 && (
              <span className="hidden h-px w-4 shrink-0 bg-edge-strong sm:my-auto sm:block" />
            )}
            <div
              className={cn(
                "flex-1 rounded-(--radius-control) px-3 py-3",
                v.now
                  ? "bg-primary text-on-primary"
                  : "border border-edge bg-surface-raised text-ink",
              )}
            >
              <p className="font-display text-base font-semibold leading-none">{v.tag}</p>
              <p
                className={cn(
                  "mt-2 text-[12px] leading-snug",
                  v.now ? "text-on-primary/85" : "text-ink-muted",
                )}
              >
                {v.line}
              </p>
              <p
                className={cn(
                  "mt-2 text-[11px]",
                  v.now ? "text-on-primary/70" : "text-ink-faint",
                )}
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

/** September 2026, Monday first. The 1st is a Tuesday, so the row opens on
 *  31 August; 10 September is the marked day. */
const MONTH_ROWS = [
  ["31", "1", "2", "3", "4", "5", "6"],
  ["7", "8", "9", "10", "11", "12", "13"],
  ["14", "15", "16", "17", "18", "19", "20"],
  ["21", "22", "23", "24", "25", "26", "27"],
];

const AGENDA: { title: string; when: string; dot: string }[] = [
  { title: "Membrane transport quiz", when: "Today, 2:00 PM", dot: "bg-primary" },
  { title: "Cellular respiration review", when: "Thu 17 Sep, 10:00 AM", dot: "bg-clay-soft" },
  { title: "Genetics problem set due", when: "Mon 21 Sep, 11:59 PM", dot: "bg-edge-strong" },
  { title: "Enzymes notes shared by Amy", when: "Tue 22 Sep", dot: "bg-edge-strong" },
];

function CalendarTile() {
  return (
    <Tile
      delay={0.12}
      span="xl:col-span-3 xl:row-span-2 md:col-span-3"
      className="border border-edge bg-paper"
    >
      <TileHead
        icon={CalendarBlank}
        title="Calendar"
        body="What your classes shared, and what is due."
      />
      <div aria-hidden className="mt-5">
        <p className="text-center font-display text-base font-semibold text-ink">
          September 2026
        </p>
        <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-[11px] text-ink-faint">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1.5 text-center text-[12px]">
          {MONTH_ROWS.flat().map((day, i) => {
            const outside = i === 0;
            const today = day === "10" && i > 0;
            return (
              <span key={i} className="flex items-center justify-center">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full",
                    today && "bg-primary font-semibold text-on-primary",
                    !today && outside && "text-ink-faint/60",
                    !today && !outside && "text-ink",
                  )}
                >
                  {day}
                </span>
              </span>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="mt-5 flex flex-1 flex-col justify-start gap-4 border-t border-edge pt-4">
        {AGENDA.map((item) => (
          <div key={item.title} className="flex items-start gap-2.5">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.dot)} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{item.title}</p>
              <p className="text-[12px] text-ink-muted">{item.when}</p>
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

const CORRECTIONS: { name: string; when: string; line: string }[] = [
  {
    name: "Ibrahim",
    when: "2h ago",
    line: "ATP yield should be 30 to 32, not 36. Source in the proposal.",
  },
  {
    name: "Amy",
    when: "4h ago",
    line: "Added the link reaction step between glycolysis and the cycle.",
  },
];

function CorrectionsTile() {
  return (
    <Tile delay={0.06}
      span="xl:col-span-3 md:col-span-3" className="border border-edge bg-paper">
      <TileHead
        icon={SealCheck}
        title="Corrections carry reasons."
        body="A classmate proposes a fix and says where it came from. A maintainer decides."
      />
      <div aria-hidden className="mt-5 flex flex-1 flex-col gap-2">
        {CORRECTIONS.map((c) => (
          <div
            key={c.name}
            className="flex items-start gap-3 rounded-(--radius-control) bg-surface-raised p-3"
          >
            <Avatar name={c.name} size="sm" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">
                {c.name}{" "}
                <span className="font-normal text-ink-faint">{c.when}</span>
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{c.line}</p>
            </div>
          </div>
        ))}
        <p className="mt-auto pt-3 text-[12px] text-ink-faint">Waiting on a maintainer</p>
      </div>
    </Tile>
  );
}

function NotesTile() {
  return (
    <Tile delay={0.12}
      span="xl:col-span-3 md:col-span-3" className="bg-primary-soft">
      <TileHead
        icon={Notebook}
        title="Shared notes"
        body="The organized version and the words you actually typed, side by side, forever."
      />
      <div
        aria-hidden
        className="mt-5 flex flex-1 flex-col rounded-(--radius-control) bg-surface-raised p-4"
      >
        <p className="text-[13px] font-semibold text-ink">How cells make ATP</p>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-primary" />
            <span className="h-2 flex-1 rounded-full bg-edge" />
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-clay" />
            <span className="h-2 w-2/3 rounded-full bg-clay-soft" />
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-edge-strong" />
            <span className="h-2 flex-1 rounded-full bg-edge" />
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-edge-strong" />
            <span className="h-2 w-4/5 rounded-full bg-edge" />
          </div>
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary">
          <FileText className="size-3.5" aria-hidden />
          Original kept
        </p>
        <div className="mt-auto flex items-center gap-2.5 border-t border-edge pt-4">
          <Avatar name="Rayyan" size="sm" />
          <p className="text-[12px] leading-snug text-ink-muted">
            Rayyan approved this before the class saw it.
          </p>
        </div>
      </div>
    </Tile>
  );
}

const STUDY_KINDS: { icon: typeof Cards; label: string }[] = [
  { icon: FileText, label: "Summary" },
  { icon: Cards, label: "Flashcards" },
  { icon: ListChecks, label: "Practice test" },
];

function StudyTile() {
  return (
    <Tile delay={0.06}
      span="xl:col-span-3 md:col-span-3" className="border border-edge bg-paper">
      <TileHead
        icon={GraduationCap}
        title="Study tools"
        body="Built from what your class wrote, not from a stranger's deck."
      />
      <div aria-hidden className="mt-5 grid flex-1 grid-cols-3 gap-2">
        {STUDY_KINDS.map((kind) => (
          <div
            key={kind.label}
            className="flex flex-col items-center justify-center gap-2 rounded-(--radius-control) bg-surface-raised px-2 py-4 text-center"
          >
            <kind.icon className="size-6 text-ink-faint" weight="duotone" />
            <span className="text-[12px] font-medium leading-tight text-ink">
              {kind.label}
            </span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

function OrganizerTile() {
  return (
    <Tile delay={0.12}
      span="xl:col-span-6 md:col-span-6" className="bg-clay text-on-clay">
      <TileHead
        icon={Sparkle}
        title="The organizer proposes. You publish."
        body="It suggests a title, headings and where the note belongs, and flags anything it is unsure of. It cannot share a word without you."
        tone="on-clay"
      />
      <div
        aria-hidden
        className="mt-6 flex flex-1 items-center gap-4 rounded-(--radius-control) bg-on-clay/10 p-4"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-(--radius-control) bg-on-clay/15">
          <FileText className="size-6 text-on-clay" weight="duotone" />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <span className="block h-2.5 rounded-full bg-on-clay/25" />
          <span className="block h-2.5 w-11/12 rounded-full bg-on-clay/25" />
          <span className="block h-2.5 w-3/5 rounded-full bg-on-clay/25" />
        </div>
        <span className="shrink-0 rounded-full bg-surface-raised px-4 py-2.5 text-[13px] font-semibold leading-tight text-primary">
          Ready for
          <br />
          your review
        </span>
      </div>
    </Tile>
  );
}

const SECTIONS = ["Cell structure", "Membrane transport", "Genetics"];

function SearchTile() {
  return (
    <Tile delay={0.18}
      span="xl:col-span-3 md:col-span-6" className="bg-clay-soft">
      <TileHead
        icon={MagnifyingGlass}
        title="Search"
        body="Find a note, a section, or the classmate who wrote it."
      />
      <div
        aria-hidden
        className="mt-5 flex items-center gap-2 rounded-full bg-surface-raised px-4 py-3"
      >
        <MagnifyingGlass className="size-4 shrink-0 text-ink-faint" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink-faint">
          Search this Pot
        </span>
        <ArrowRight className="size-4 shrink-0 text-ink-muted" />
      </div>
      <div aria-hidden className="mt-3 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <span
            key={s}
            className="rounded-full bg-surface-raised px-3 py-1.5 text-[12px] font-medium text-ink"
          >
            {s}
          </span>
        ))}
      </div>
    </Tile>
  );
}
