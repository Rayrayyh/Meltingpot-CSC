/**
 * Which class the collapsed rail opens.
 *
 * With the rail collapsed the My Pots control has no list to expand, because
 * the list carries .mp-nav-open-only and that is display:none at 4.5rem. So the
 * control navigates instead, and this is the rule it navigates by.
 *
 * The precedence runs from the most deliberate signal to the least. An order
 * someone arranged by hand is a statement about which class comes first, so it
 * wins outright. Marking a class is the next most deliberate thing they can do,
 * and among several marked the one they were in last breaks the tie. Failing
 * both, the class they were in last is the best guess anyone can make.
 */

export type PotChoice = {
  id: string;
  /** Their arranged slot, or null for a class they have never moved. */
  position: number | null;
  favoritedAt: string | null;
  lastViewedAt: string | null;
};

function mostRecentlyViewed(pots: PotChoice[]): PotChoice | null {
  let best: PotChoice | null = null;
  for (const pot of pots) {
    if (!pot.lastViewedAt) continue;
    if (!best || pot.lastViewedAt > best.lastViewedAt!) best = pot;
  }
  return best;
}

export function collapsedPotDestination(pots: PotChoice[]): string | null {
  if (pots.length === 0) return null;
  // One class is not a choice. Go there and skip every other rule, including an
  // order of one that somebody set and forgot.
  if (pots.length === 1) return pots[0].id;

  const arranged = pots.filter((p) => p.position !== null);
  if (arranged.length > 0) {
    // Ties keep the order the caller handed them in, which is join order.
    let first = arranged[0];
    for (const pot of arranged) {
      if (pot.position! < first.position!) first = pot;
    }
    return first.id;
  }

  const marked = pots.filter((p) => p.favoritedAt);
  if (marked.length > 0) {
    const recent = mostRecentlyViewed(marked);
    if (recent) return recent.id;
    // Marked but never opened since. The most recently marked is the closest
    // thing to an intention on record.
    let latest = marked[0];
    for (const pot of marked) {
      if (pot.favoritedAt! > latest.favoritedAt!) latest = pot;
    }
    return latest.id;
  }

  return (mostRecentlyViewed(pots) ?? pots[0]).id;
}
