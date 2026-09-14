import { describe, expect, it } from "vitest";
import { collapsedPotDestination, type PotChoice } from "@/lib/pot-destination";

function pot(id: string, extra: Partial<PotChoice> = {}): PotChoice {
  return { id, position: null, favoritedAt: null, lastViewedAt: null, ...extra };
}

describe("collapsedPotDestination", () => {
  it("has nowhere to go with no classes", () => {
    expect(collapsedPotDestination([])).toBeNull();
  });

  it("goes to the only class, whatever else is set", () => {
    expect(collapsedPotDestination([pot("a", { position: 7 })])).toBe("a");
  });

  it("prefers an arranged order over a marked class", () => {
    expect(
      collapsedPotDestination([
        pot("a", { favoritedAt: "2026-09-01T00:00:00Z" }),
        pot("b", { position: 0 }),
      ]),
    ).toBe("b");
  });

  it("lets an arranged order outrank a favourite even when every class is arranged", () => {
    // The state a saved settings panel produces. This is the owner's rule,
    // and it is why the panel writes positions only when the classes were
    // actually arranged: otherwise one save would retire favourites for good.
    expect(
      collapsedPotDestination([
        pot("a", { position: 0 }),
        pot("b", { position: 1, favoritedAt: "2026-09-01T00:00:00Z" }),
      ]),
    ).toBe("a");
  });

  it("takes the lowest position, not the first arranged row", () => {
    expect(
      collapsedPotDestination([pot("a", { position: 3 }), pot("b", { position: 1 })]),
    ).toBe("b");
  });

  it("prefers a marked class over one merely opened more recently", () => {
    expect(
      collapsedPotDestination([
        pot("a", { lastViewedAt: "2026-09-04T00:00:00Z" }),
        pot("b", { favoritedAt: "2026-01-01T00:00:00Z" }),
      ]),
    ).toBe("b");
  });

  it("breaks a tie between marked classes on the one opened last", () => {
    expect(
      collapsedPotDestination([
        pot("a", { favoritedAt: "2026-01-01T00:00:00Z", lastViewedAt: "2026-08-01T00:00:00Z" }),
        pot("b", { favoritedAt: "2026-01-01T00:00:00Z", lastViewedAt: "2026-09-01T00:00:00Z" }),
      ]),
    ).toBe("b");
  });

  it("falls back to the most recently marked when neither has been opened", () => {
    expect(
      collapsedPotDestination([
        pot("a", { favoritedAt: "2026-01-01T00:00:00Z" }),
        pot("b", { favoritedAt: "2026-02-01T00:00:00Z" }),
      ]),
    ).toBe("b");
  });

  it("falls back to the class opened last", () => {
    expect(
      collapsedPotDestination([
        pot("a", { lastViewedAt: "2026-08-01T00:00:00Z" }),
        pot("b", { lastViewedAt: "2026-09-01T00:00:00Z" }),
        pot("c"),
      ]),
    ).toBe("b");
  });

  it("falls back to the first class when nothing has been opened at all", () => {
    expect(collapsedPotDestination([pot("a"), pot("b")])).toBe("a");
  });
});
