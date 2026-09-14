import { describe, expect, it } from "vitest";
import { bearerMatches } from "@/lib/classwork/trigger";

const SECRET = "t".repeat(44);

describe("bearerMatches", () => {
  it("accepts the exact bearer, whatever the scheme's case", () => {
    expect(bearerMatches(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(bearerMatches(`bearer ${SECRET}`, SECRET)).toBe(true);
    expect(bearerMatches(`Bearer   ${SECRET}  `, SECRET)).toBe(true);
  });

  it("refuses a wrong, missing, truncated or differently shaped header", () => {
    expect(bearerMatches(null, SECRET)).toBe(false);
    expect(bearerMatches("", SECRET)).toBe(false);
    expect(bearerMatches(`Bearer ${SECRET.slice(0, -1)}`, SECRET)).toBe(false);
    expect(bearerMatches(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(bearerMatches(SECRET, SECRET)).toBe(false);
    expect(bearerMatches(`Basic ${SECRET}`, SECRET)).toBe(false);
    expect(bearerMatches(`Bearer ${SECRET}`, "")).toBe(false);
  });
});
