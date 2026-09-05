import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowSquareOut, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { ClassworkAutoSync } from "@/components/classwork/auto-sync";
import { UserShell } from "@/components/shell/user-shell";
import { Button } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/pills";
import { dueLabel, kindLabel, providerName } from "@/lib/classwork/labels";
import { localDate } from "@/lib/contributions/streak";
import { getMonthEntries, type CalendarEntry } from "@/lib/data/calendar";
import {
  classworkOffered,
  getMonthDue,
  getVisibleLinks,
  staleLinkIds,
  type DueEntry,
} from "@/lib/data/classwork";
import { readerZone } from "@/lib/data/streak";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";

export const metadata = { title: "Calendar" };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthName(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Row =
  | { kind: "note"; day: string; at: number; entry: CalendarEntry }
  | { kind: "due"; day: string; at: number; entry: DueEntry };

/**
 * A planner and a record, in one.
 *
 * The record half is every note the class really shared. The planner half is
 * every due date a linked course really set: nothing here was typed into this
 * app, so the calendar cannot promise what the rest of the product does not
 * keep. Both halves are cut where the reader is. Neither provider says whether
 * anyone handed anything in, so a past due date reads "Was due", never
 * "Overdue" (decision 038).
 */
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const zone = await readerZone();
  const now = new Date().getTime();
  const today = localDate(now, zone);
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7)) - 1;
  const year = Number(params.y) || todayYear;
  const month = Number.isFinite(Number(params.m)) && params.m !== undefined
    ? Number(params.m)
    : todayMonth;

  const offered = classworkOffered();
  const [entries, dues, links] = await Promise.all([
    getMonthEntries(year, month, zone),
    offered ? getMonthDue(year, month, zone) : Promise.resolve([] as DueEntry[]),
    offered ? getVisibleLinks() : Promise.resolve([]),
  ]);
  const viewingCurrentMonth = year === todayYear && month === todayMonth;
  const empty = entries.length === 0 && dues.length === 0;

  // An empty month still offers the next action: back to today when browsing
  // history, or the first place a note could actually be written. The
  // memberships read is RLS scoped to the caller.
  let emptyAction: ReactNode = null;
  if (empty) {
    if (!viewingCurrentMonth) {
      emptyAction = (
        <Button href="/calendar" variant="secondary">
          Back to this month
        </Button>
      );
    } else {
      const supabase = await supabaseServer();
      const { data: memberships } = await supabase
        .from("memberships")
        .select("pot_id, pots(archived_at)");
      const firstActivePotId =
        (memberships ?? []).find((m) => m.pots && !m.pots.archived_at)?.pot_id ?? null;
      emptyAction = firstActivePotId ? (
        <Button href={`/p/${firstActivePotId}/contribute`}>Add contribution</Button>
      ) : (
        <Button href="/join">Join a Pot</Button>
      );
    }
  }

  const byDay = new Map<number, { notes: number; dues: number }>();
  const bump = (day: string, key: "notes" | "dues") => {
    const n = Number(day.slice(8, 10));
    const current = byDay.get(n) ?? { notes: 0, dues: 0 };
    current[key] += 1;
    byDay.set(n, current);
  };
  for (const entry of entries) bump(entry.day, "notes");
  for (const due of dues) bump(due.day, "dues");

  const rows: Row[] = [
    ...entries.map((entry): Row => ({ kind: "note", day: entry.day, at: Date.parse(entry.sharedAt), entry })),
    ...dues.map((entry): Row => ({ kind: "due", day: entry.day, at: Date.parse(entry.dueAt), entry })),
  ].sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at);

  const first = new Date(Date.UTC(year, month, 1));
  // Monday-first, so the weekend sits together at the end of the row.
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const isToday = (day: number) => `${prefix}${String(day).padStart(2, "0")}` === today;

  return (
    <UserShell>
      {offered ? <ClassworkAutoSync linkIds={staleLinkIds(links, now)} /> : null}
      <div className="mx-auto w-full max-w-4xl px-6 py-12 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{monthName(year, month)}</h1>
            <p className="text-sm text-ink-muted">
              {offered
                ? "What your classes shared, and what is due."
                : "When your classes shared notes. Every square is a note that exists."}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/calendar?y=${prev.y}&m=${prev.m}`}
              aria-label="Previous month"
              className="inline-flex size-9 items-center justify-center rounded-(--radius-control) border border-edge-strong text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CaretLeft className="size-4" aria-hidden />
            </Link>
            <Link
              href={`/calendar?y=${next.y}&m=${next.m}`}
              aria-label="Next month"
              className="inline-flex size-9 items-center justify-center rounded-(--radius-control) border border-edge-strong text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <CaretRight className="size-4" aria-hidden />
            </Link>
          </div>
        </header>

        <Card>
          <CardSection>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((d) => (
                <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                const counts = day ? byDay.get(day) ?? { notes: 0, dues: 0 } : { notes: 0, dues: 0 };
                const busy = counts.notes + counts.dues > 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-16 rounded-(--radius-control) border p-1.5 text-left",
                      day === null ? "border-transparent" : busy ? "border-edge bg-sunken" : "border-edge",
                      day !== null && isToday(day) && "border-primary",
                    )}
                  >
                    {day === null ? null : (
                      <>
                        <span
                          className={cn(
                            "text-[12px] tabular-nums",
                            isToday(day) ? "font-semibold text-primary" : "text-ink-muted",
                          )}
                        >
                          {day}
                        </span>
                        {counts.notes > 0 ? (
                          <span className="mt-1 block text-[11px] leading-tight text-ink">
                            {counts.notes} {counts.notes === 1 ? "note" : "notes"}
                          </span>
                        ) : null}
                        {counts.dues > 0 ? (
                          <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-primary">
                            {counts.dues} due
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardSection>
        </Card>

        {empty ? (
          <Card>
            <EmptyState
              title={offered ? "Nothing shared or due this month" : "Nothing shared this month"}
              body={
                offered
                  ? "When your class shares a note, or a linked course sets a due date, the day shows up here."
                  : "When your class shares a note, the day it landed shows up here."
              }
              action={emptyAction ?? undefined}
            />
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) =>
              row.kind === "note" ? (
                <li key={`n:${row.entry.noteId}`}>
                  <Link href={`/p/${row.entry.potId}/n/${row.entry.noteId}`} className="mp-lift group block">
                    <Card className="group-hover:border-edge-strong transition-colors">
                      <CardSection className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink group-hover:text-primary">
                            {row.entry.title}
                          </p>
                          <p className="text-[12px] text-ink-faint">
                            {row.entry.contributorName} &middot; {row.entry.potTitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12px] tabular-nums text-ink-muted">
                          {dayLabel(row.day)}
                        </span>
                      </CardSection>
                    </Card>
                  </Link>
                </li>
              ) : (
                <li key={`d:${row.entry.itemId}`} data-testid="calendar-due">
                  <DueRow entry={row.entry} now={now} zone={zone} />
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </UserShell>
  );
}

function dayLabel(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function DueRow({ entry, now, zone }: { entry: DueEntry; now: number; zone: string }) {
  const body = (
    <Card className="group-hover:border-edge-strong transition-colors">
      <CardSection className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink group-hover:text-primary">
            <span className="truncate">{entry.title}</span>
            {entry.url ? <ArrowSquareOut className="size-3.5 shrink-0 text-ink-faint" aria-hidden /> : null}
          </p>
          <p className="text-[12px] text-ink-faint">
            {kindLabel(entry.itemKind)} &middot; {entry.courseName}
            {entry.potTitle ? <> &middot; {entry.potTitle}</> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill tone="neutral">{providerName(entry.provider)}</StatusPill>
          <span className="text-[12px] tabular-nums text-ink-muted">
            {dueLabel(entry.dueAt, entry.dueAllDay, now, zone)}
          </span>
        </div>
      </CardSection>
    </Card>
  );
  return entry.url ? (
    <a href={entry.url} target="_blank" rel="noreferrer noopener" className="mp-lift group block">
      {body}
    </a>
  ) : (
    <div className="group block">{body}</div>
  );
}
