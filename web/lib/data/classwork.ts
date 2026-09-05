import { getAuthUser } from "@/lib/auth/server";
import { localDate } from "@/lib/contributions/streak";
import { supabaseServer } from "@/lib/supabase/server";
import type { ClassworkKind, ClassworkProvider, ProviderCourse } from "@/lib/classwork/types";
import { classworkAvailability } from "@/lib/classwork/config";

/**
 * Readers for classwork. Every one of these names its columns: the Vault id
 * and the scope list on connections and the pass cursor on links sit outside
 * the column grants (0049), and PostgREST refuses select=* on a table where a
 * column is withheld.
 *
 * Connections carry no readable user_id, so there is nothing to filter on
 * and row level security is the whole scope (own rows only). Links and items
 * are readable across a Pot by design, so "visible to me" is the intended
 * meaning there rather than a filter that went missing (memory/lessons/005).
 */
export type ConnectionSummary = {
  id: string;
  provider: ClassworkProvider;
  instanceUrl: string | null;
  externalDisplay: string | null;
  consentAt: string;
  needsReconnectAt: string | null;
  lastError: string | null;
  courses: ProviderCourse[];
  coursesFetchedAt: string | null;
};

export type LinkSummary = {
  id: string;
  connectionId: string;
  userId: string;
  provider: ClassworkProvider;
  potId: string | null;
  potTitle: string | null;
  externalCourseId: string;
  courseName: string;
  courseUrl: string | null;
  enrollment: "teacher" | "student" | "unknown";
  syncStatus: "never" | "running" | "ok" | "error" | "reconnect";
  syncStartedAt: string | null;
  syncFinishedAt: string | null;
  syncError: string | null;
  itemCount: number;
};

export type DueEntry = {
  kind: "due";
  itemId: string;
  itemKind: ClassworkKind;
  title: string;
  provider: ClassworkProvider;
  potId: string | null;
  potTitle: string | null;
  courseName: string;
  dueAt: string;
  dueAllDay: boolean;
  url: string | null;
  /** The day it lands on where the reader is, as YYYY-MM-DD. */
  day: string;
};

const LINK_COLUMNS =
  "id, connection_id, user_id, provider, pot_id, external_course_id, course_name, course_url, enrollment, sync_status, sync_started_at, sync_finished_at, sync_error, item_count, pot:pots(title)";

const ITEM_COLUMNS =
  "id, provider, external_id, kind, title, due_at, due_all_day, url, pot_id, link:lms_course_links!lms_items_link_id_fkey(course_name, pot:pots(title))";

function isCourse(value: unknown): value is ProviderCourse {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.externalId === "string" && typeof c.name === "string";
}

export async function getConnections(): Promise<ConnectionSummary[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("lms_connections")
    .select("id, provider, instance_url, external_display, consent_at, needs_reconnect_at, last_error, courses, courses_fetched_at")
    .order("consent_at", { ascending: true });
  if (error) {
    console.error("classwork connections read failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    provider: row.provider,
    instanceUrl: row.instance_url,
    externalDisplay: row.external_display,
    consentAt: row.consent_at,
    needsReconnectAt: row.needs_reconnect_at,
    lastError: row.last_error,
    courses: Array.isArray(row.courses) ? row.courses.filter(isCourse) : [],
    coursesFetchedAt: row.courses_fetched_at,
  }));
}

type LinkRow = {
  id: string;
  connection_id: string;
  user_id: string;
  provider: ClassworkProvider;
  pot_id: string | null;
  external_course_id: string;
  course_name: string;
  course_url: string | null;
  enrollment: string;
  sync_status: string;
  sync_started_at: string | null;
  sync_finished_at: string | null;
  sync_error: string | null;
  item_count: number;
  pot: { title: string } | null;
};

function toLink(row: LinkRow): LinkSummary {
  return {
    id: row.id,
    connectionId: row.connection_id,
    userId: row.user_id,
    provider: row.provider,
    potId: row.pot_id,
    potTitle: row.pot?.title ?? null,
    externalCourseId: row.external_course_id,
    courseName: row.course_name,
    courseUrl: row.course_url,
    enrollment: row.enrollment as LinkSummary["enrollment"],
    syncStatus: row.sync_status as LinkSummary["syncStatus"],
    syncStartedAt: row.sync_started_at,
    syncFinishedAt: row.sync_finished_at,
    syncError: row.sync_error,
    itemCount: row.item_count,
  };
}

/** Every link the caller can see: their own, and those of Pots they belong to. */
export async function getVisibleLinks(scope: { potId?: string } = {}): Promise<LinkSummary[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  let query = supabase.from("lms_course_links").select(LINK_COLUMNS).order("created_at", { ascending: true });
  if (scope.potId) query = query.eq("pot_id", scope.potId);
  const { data, error } = await query;
  if (error) {
    console.error("classwork links read failed", error.message);
    return [];
  }
  return ((data ?? []) as unknown as LinkRow[]).map(toLink);
}

/** The caller's own links only, private and Pot alike. */
export async function getOwnLinks(): Promise<LinkSummary[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("lms_course_links")
    .select(LINK_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("classwork own links read failed", error.message);
    return [];
  }
  return ((data ?? []) as unknown as LinkRow[]).map(toLink);
}

const STALE_AFTER_MS = 15 * 60_000;
const RUNNING_STUCK_MS = 2 * 60_000;
const AUTO_SYNC_MAX = 4;

/**
 * Which links a page open should push a sync for. The database has the last
 * word (sync_too_soon, sync_in_progress); this only spares it the calls that
 * would certainly be refused. A pass cut short is invisible here, since the
 * cursor is not readable, so it reads as "running" and is retried once the
 * two minute window closes.
 */
export function staleLinkIds(links: LinkSummary[], now = Date.now()): string[] {
  return links
    .filter((link) => {
      if (link.syncStatus === "reconnect") return false;
      if (link.syncStatus === "never") return true;
      if (link.syncStatus === "running") {
        return !link.syncStartedAt || Date.parse(link.syncStartedAt) < now - RUNNING_STUCK_MS;
      }
      return !link.syncFinishedAt || Date.parse(link.syncFinishedAt) < now - STALE_AFTER_MS;
    })
    .slice(0, AUTO_SYNC_MAX)
    .map((link) => link.id);
}

type ItemRow = {
  id: string;
  provider: ClassworkProvider;
  external_id: string;
  kind: ClassworkKind;
  title: string;
  due_at: string | null;
  due_all_day: boolean;
  url: string | null;
  pot_id: string | null;
  link: { course_name: string; pot: { title: string } | null } | null;
};

/**
 * The same course can reach a person twice, privately and through a Pot.
 * One entry per provider item, the Pot copy preferred, since that is the one
 * with a class around it.
 */
function collapse(rows: ItemRow[]): ItemRow[] {
  const byKey = new Map<string, ItemRow>();
  for (const row of rows) {
    const key = `${row.provider}:${row.external_id}`;
    const seen = byKey.get(key);
    if (!seen || (seen.pot_id === null && row.pot_id !== null)) byKey.set(key, row);
  }
  return [...byKey.values()];
}

function toDue(row: ItemRow, zone: string): DueEntry | null {
  if (!row.due_at) return null;
  return {
    kind: "due",
    itemId: row.id,
    itemKind: row.kind,
    title: row.title,
    provider: row.provider,
    potId: row.pot_id,
    potTitle: row.link?.pot?.title ?? null,
    courseName: row.link?.course_name ?? "",
    dueAt: row.due_at,
    dueAllDay: row.due_all_day,
    url: row.url,
    day: localDate(row.due_at, zone),
  };
}

/** What is due in the next `days` days, across everything the caller can see. */
export async function getDueSoon(zone: string, days = 7, limit = 5, now = Date.now()): Promise<DueEntry[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  // From the start of today where the reader is, so an 11:59 pm deadline that
  // has passed by a few hours still shows as today's rather than vanishing.
  const from = new Date(now - 24 * 3_600_000).toISOString();
  const to = new Date(now + days * 24 * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("lms_items")
    .select(ITEM_COLUMNS)
    .is("removed_at", null)
    .gte("due_at", from)
    .lt("due_at", to)
    .order("due_at", { ascending: true })
    .limit(60);
  if (error) {
    console.error("classwork due read failed", error.message);
    return [];
  }
  const today = localDate(now, zone);
  return collapse((data ?? []) as unknown as ItemRow[])
    .map((row) => toDue(row, zone))
    .filter((entry): entry is DueEntry => entry !== null && entry.day >= today)
    .slice(0, limit);
}

/**
 * Every due date landing in a month, cut where the reader is. A day of
 * padding either side of the UTC month covers a zone's offset; bucketing by
 * local day then keeps only what belongs to the month.
 */
export async function getMonthDue(year: number, month: number, zone: string): Promise<DueEntry[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  const from = new Date(Date.UTC(year, month, 1) - 24 * 3_600_000).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 1) + 24 * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("lms_items")
    .select(ITEM_COLUMNS)
    .is("removed_at", null)
    .gte("due_at", from)
    .lt("due_at", to)
    .order("due_at", { ascending: true })
    .limit(400);
  if (error) {
    console.error("classwork month read failed", error.message);
    return [];
  }
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return collapse((data ?? []) as unknown as ItemRow[])
    .map((row) => toDue(row, zone))
    .filter((entry): entry is DueEntry => entry !== null && entry.day.startsWith(prefix));
}

/** True when this deployment can connect at least one provider. */
export function classworkOffered(): boolean {
  const a = classworkAvailability();
  return a.google_classroom || a.canvas;
}
