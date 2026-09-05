import { describe, expect, it } from "vitest";
import {
  DEFAULT_NAV_ORDER,
  NAV_KEYS,
  resolveNavLinks,
  visibleNavLinks,
} from "@/lib/sidebar-links";

describe("resolveNavLinks", () => {
  it("returns the default order for someone who has never changed anything", () => {
    expect(resolveNavLinks(null).map((l) => l.key)).toEqual([...DEFAULT_NAV_ORDER]);
    expect(resolveNavLinks(null).every((l) => !l.hidden)).toBe(true);
  });

  it("honours a stored order", () => {
    const links = resolveNavLinks({ navOrder: ["study", "home"], navHidden: [] });
    expect(links.slice(0, 2).map((l) => l.key)).toEqual(["study", "home"]);
  });

  it("appends a link the stored order has never heard of", () => {
    // The case that breaks naive implementations: an order saved before a
    // destination existed must not make that destination invisible.
    const links = resolveNavLinks({ navOrder: ["home", "study"], navHidden: [] });
    expect(links.map((l) => l.key).sort()).toEqual([...NAV_KEYS].sort());
  });

  it("drops a key that no longer exists rather than rendering a hole", () => {
    const links = resolveNavLinks({
      navOrder: ["home", "retired-thing", "study"] as never,
      navHidden: [],
    });
    expect(links.map((l) => l.key)).not.toContain("retired-thing");
    expect(links).toHaveLength(NAV_KEYS.length);
  });

  it("collapses a duplicated key to its first appearance", () => {
    const links = resolveNavLinks({ navOrder: ["study", "home", "study"], navHidden: [] });
    expect(links.filter((l) => l.key === "study")).toHaveLength(1);
    expect(links[0].key).toBe("study");
  });

  it("marks hidden links without removing them from the arrangement", () => {
    const links = resolveNavLinks({ navOrder: [], navHidden: ["calendar"] });
    expect(links.find((l) => l.key === "calendar")?.hidden).toBe(true);
    expect(visibleNavLinks({ navOrder: [], navHidden: ["calendar"] }).map((l) => l.key)).not.toContain(
      "calendar",
    );
  });

  it("keeps one link visible when everything has been put away", () => {
    const visible = visibleNavLinks({ navOrder: [], navHidden: [...NAV_KEYS] });
    expect(visible).toHaveLength(1);
    expect(visible[0].key).toBe(DEFAULT_NAV_ORDER[0]);
  });
});
