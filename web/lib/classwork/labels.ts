import { localDate } from "@/lib/contributions/streak";
import type { ClassworkKind, ClassworkProvider } from "@/lib/classwork/types";

/** The names the student already knows these tools by. */
export function providerName(provider: ClassworkProvider): string {
  return provider === "google_classroom" ? "Google Classroom" : "Canvas";
}

export function kindLabel(kind: ClassworkKind): string {
  switch (kind) {
    case "assignment":
      return "Assignment";
    case "quiz":
      return "Quiz";
    case "discussion":
      return "Discussion";
    case "announcement":
      return "Announcement";
    case "material":
      return "Material";
    case "event":
      return "Event";
  }
}

const DAY_MS = 86_400_000;

function dayIndex(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

function shortDate(dueAt: string, zone: string): string {
  return new Date(dueAt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: zone,
  });
}

function shortTime(dueAt: string, zone: string): string {
  return new Date(dueAt)
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: zone })
    .replace(/\s?(am|pm)$/i, (m) => m.trim().toLowerCase())
    .replace(/^0/, "");
}

/**
 * When something is due, said the way a person would, cut into their own zone.
 *
 * Never "Overdue". Neither provider tells us whether anyone handed anything
 * in, so a past date is a fact about the date and nothing about the person.
 */
export function dueLabel(
  dueAt: string | null,
  dueAllDay: boolean,
  now: number,
  zone: string,
): string | null {
  if (!dueAt) return null;
  const dueDay = localDate(dueAt, zone);
  const today = localDate(now, zone);
  if (!dueDay || !today) return null;
  const diff = dayIndex(dueDay) - dayIndex(today);
  const clock = dueAllDay ? "" : ` at ${shortTime(dueAt, zone)}`;
  if (diff === 0) return `Due today${clock}`;
  if (diff === 1) return `Due tomorrow${clock}`;
  if (diff > 1 && diff <= 6) return `Due ${shortDate(dueAt, zone)}${clock}`;
  if (diff > 6) return `Due ${shortDate(dueAt, zone)}`;
  if (diff === -1) return "Was due yesterday";
  if (diff >= -30) return `Was due ${-diff} days ago`;
  return `Was due ${shortDate(dueAt, zone)}`;
}

/** The bucket a Classwork list puts an item in. */
export type DueBucket = "soon" | "later" | "undated" | "past";

export function dueBucket(dueAt: string | null, now: number, zone: string): DueBucket {
  if (!dueAt) return "undated";
  const diff = dayIndex(localDate(dueAt, zone)) - dayIndex(localDate(now, zone));
  if (diff < 0) return "past";
  return diff <= 7 ? "soon" : "later";
}
