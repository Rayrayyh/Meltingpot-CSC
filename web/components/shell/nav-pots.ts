import type { NavPot } from "@/components/shell/main-nav";
import type { UserPot } from "@/lib/data/user";

/**
 * The shape the rail needs, and nothing else.
 *
 * Both shells load the full membership record and both hand the nav the same
 * subset, so the mapping lives here rather than being written out twice and
 * drifting the first time a field is added.
 */
export function navPots(pots: UserPot[]): NavPot[] {
  return pots.map((p) => ({
    id: p.id,
    title: p.title,
    position: p.position,
    favoritedAt: p.favoritedAt,
    lastViewedAt: p.lastViewedAt,
  }));
}
