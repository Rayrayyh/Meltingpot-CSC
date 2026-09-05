import { localDate } from "@/lib/contributions/streak";
import { supabaseServer } from "@/lib/supabase/server";

export type CalendarEntry = {
  noteId: string;
  potId: string;
  potTitle: string;
  title: string;
  contributorName: string;
  sharedAt: string;
  /** The day it lands on where the reader is, as YYYY-MM-DD. */
  day: string;
};

/**
 * What the class actually did, by day.
 *
 * Every entry is a note that was really shared, read straight off shared_at,
 * which means this half of the calendar can never disagree with the feed. Row
 * level security scopes it to the Pots you belong to without this query
 * naming them. The other half, what is due, comes from lib/data/classwork and
 * is real in the same sense: a course published it.
 *
 * Days are cut where the reader is, as the private record's are. A day of
 * padding either side of the UTC month covers a zone's offset; bucketing by
 * local day then keeps only what belongs to the month asked for. Before due
 * dates this was cut in UTC and nobody minded; an 11:59 pm deadline landing on
 * tomorrow's square is a different matter.
 */
export async function getMonthEntries(year: number, month: number, zone: string): Promise<CalendarEntry[]> {
  const from = new Date(Date.UTC(year, month, 1) - 24 * 3_600_000).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 1) + 24 * 3_600_000).toISOString();
  const supabase = await supabaseServer();

  // The embed hints are the real constraint names, which are not all the
  // Postgres default: the current version is shared_notes_current_version_fk,
  // not ..._id_fkey. Guessing that cost a silent empty calendar once already.
  const { data, error } = await supabase
    .from("shared_notes")
    .select(
      `id, pot_id, shared_at,
       pot:pots(title),
       current:note_versions!shared_notes_current_version_fk(title),
       contributor:profiles!shared_notes_contributor_id_fkey(display_name)`,
    )
    .is("removed_at", null)
    .gte("shared_at", from)
    .lt("shared_at", to)
    .order("shared_at", { ascending: true });

  if (error) {
    // Loud in the server log rather than an empty month that looks like a
    // quiet class.
    console.error("calendar query failed", error.message);
    return [];
  }
  if (!data) return [];

  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return data
    .map((row) => {
      const r = row as unknown as {
        id: string;
        pot_id: string;
        shared_at: string;
        pot: { title: string } | null;
        current: { title: string } | null;
        contributor: { display_name: string } | null;
      };
      return {
        noteId: r.id,
        potId: r.pot_id,
        potTitle: r.pot?.title ?? "A Pot",
        title: r.current?.title ?? "Untitled note",
        contributorName: r.contributor?.display_name ?? "Someone",
        sharedAt: r.shared_at,
        day: localDate(r.shared_at, zone),
      };
    })
    .filter((entry) => entry.day.startsWith(prefix));
}
