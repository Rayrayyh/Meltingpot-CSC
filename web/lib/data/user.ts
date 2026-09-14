import { getAuthUser, requireAuthUser } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { PotRole } from "@/lib/database.types";

/**
 * Identity comes from the auth seam (lib/auth), not straight from Supabase, so
 * changing provider does not reach into every page. The queries below still
 * use the Supabase client, because that is the database rather than the
 * identity source.
 */
export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  /** Path inside the avatars bucket, or null for the tinted icon. */
  avatarPath: string | null;
};

/** The signed-in user, or a redirect to login. Use in protected pages. */
export function requireUser(): Promise<SessionUser> {
  return requireAuthUser();
}

export function getUser(): Promise<SessionUser | null> {
  return getAuthUser();
}

export type UserPot = {
  id: string;
  title: string;
  role: PotRole;
  /** Their arranged slot, or null for a class they have never moved. */
  position: number | null;
  favoritedAt: string | null;
  lastViewedAt: string | null;
};

export async function getUserPots(): Promise<UserPot[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  // RLS lets members read the whole roster of their pots, so the query must
  // still filter to the caller's own membership rows (see memory/lessons/005).
  //
  // Preferences come from a second query rather than an embed. They live in
  // their own table precisely so no other member can read them, which means
  // there is no foreign key from memberships to follow, and two small reads of
  // a handful of rows each are cheaper to understand than a join that has to
  // explain itself.
  const [{ data }, { data: prefs }] = await Promise.all([
    supabase
      .from("memberships")
      .select("role, pots(id, title, archived_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("pot_preferences")
      .select("pot_id, position, favorited_at, last_viewed_at")
      .eq("user_id", user.id),
  ]);
  const byPot = new Map((prefs ?? []).map((p) => [p.pot_id, p]));
  const pots = (data ?? [])
    .filter((m) => m.pots && !m.pots.archived_at)
    .map((m) => {
      const pref = byPot.get(m.pots!.id);
      return {
        id: m.pots!.id,
        title: m.pots!.title,
        role: m.role,
        position: pref?.position ?? null,
        favoritedAt: pref?.favorited_at ?? null,
        lastViewedAt: pref?.last_viewed_at ?? null,
      };
    });
  // Arranged classes lead, in the order they were arranged. Everything else
  // keeps join order behind them, so setting an order for two of nine classes
  // does not shuffle the other seven.
  return pots.sort((a, b) => {
    if (a.position === null && b.position === null) return 0;
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return a.position - b.position;
  });
}

/**
 * True when the caller runs a Pot. Archived Pots still count: the account
 * holds that class's work either way.
 */
/**
 * Whether this person is trusted with someone else's work anywhere.
 *
 * This gates the second factor, and it used to ask for "owner", which was the
 * wrong question: a maintainer accepts corrections, removes notes and promotes
 * members, so their account being taken is worth as much to an attacker as the
 * owner's. Anyone who can act on a Pot can protect the account that does it.
 */
export async function runsAnyPot(): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return false;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "maintainer"])
    .limit(1);
  return (data ?? []).length > 0;
}
