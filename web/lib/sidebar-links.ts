/**
 * The sidebar's destinations, and the rules for a person's arrangement of them.
 *
 * Pure on purpose: the nav renders on the server, the settings panel edits on
 * the client, and both have to agree about what a saved order means down to the
 * last edge case. Shared constants plus one resolver is the only way they stay
 * in step.
 */

export const NAV_KEYS = ["home", "pots", "study", "calendar", "contributions"] as const;

export type NavKey = (typeof NAV_KEYS)[number];

export type NavLink = {
  key: NavKey;
  label: string;
  href: string;
  /** The bare key that jumps here, shown on hover. */
  chord?: string;
};

/**
 * Search is not in here. It is the field at the top of the rail rather than a
 * destination in the list, it is the one control with a shortcut nobody has to
 * be taught, and a sidebar whose owner has hidden the way to find anything is
 * not a sidebar worth shipping.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { key: "home", label: "Home", href: "/home", chord: "H" },
  { key: "pots", label: "My Pots", href: "/home" },
  { key: "study", label: "Study", href: "/study", chord: "S" },
  { key: "calendar", label: "Calendar", href: "/calendar", chord: "C" },
  { key: "contributions", label: "Contributions", href: "/me/contributions", chord: "N" },
];

export const DEFAULT_NAV_ORDER: readonly NavKey[] = NAV_KEYS;

export type SidebarPreferences = {
  navOrder: NavKey[];
  navHidden: NavKey[];
};

export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  navOrder: [...DEFAULT_NAV_ORDER],
  navHidden: [],
};

function isNavKey(value: string): value is NavKey {
  return (NAV_KEYS as readonly string[]).includes(value);
}

/**
 * A stored order into the list actually rendered.
 *
 * Stored orders are advisory, which is the whole point. Someone who arranged
 * their sidebar today should not lose a destination shipped tomorrow, and
 * should not be left with a broken order when one is retired. So unknown keys
 * are dropped, duplicates collapse to their first appearance, and any known key
 * the stored order never mentions is appended in its default position rather
 * than vanishing.
 *
 * Hiding has a floor of one. A rail with nothing in it is not a preference, it
 * is a dead end, so the last visible link stays visible whatever the stored
 * hidden set says.
 */
export function resolveNavLinks(
  preferences: Partial<SidebarPreferences> | null | undefined,
): Array<NavLink & { hidden: boolean }> {
  const storedOrder = (preferences?.navOrder ?? []).filter(isNavKey);
  const seen = new Set<NavKey>();
  const order: NavKey[] = [];
  for (const key of storedOrder) {
    if (seen.has(key)) continue;
    seen.add(key);
    order.push(key);
  }
  for (const key of DEFAULT_NAV_ORDER) {
    if (!seen.has(key)) order.push(key);
  }

  const hidden = new Set((preferences?.navHidden ?? []).filter(isNavKey));
  if (hidden.size >= order.length) {
    // Everything is put away. Bring the first one back rather than render a
    // rail with no way out of it.
    hidden.delete(order[0]);
  }

  const byKey = new Map(NAV_LINKS.map((link) => [link.key, link]));
  return order
    .map((key) => byKey.get(key))
    .filter((link): link is NavLink => Boolean(link))
    .map((link) => ({ ...link, hidden: hidden.has(link.key) }));
}

/** Just the links that render, in the person's order. */
export function visibleNavLinks(
  preferences: Partial<SidebarPreferences> | null | undefined,
): NavLink[] {
  return resolveNavLinks(preferences).filter((link) => !link.hidden);
}
