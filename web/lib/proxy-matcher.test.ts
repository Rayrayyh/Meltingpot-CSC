import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The proxy's matcher is a literal Next reads at build time, so it is tested
 * as text: which paths reach the middleware. The first pattern skips anything
 * that ends in an image or text extension, and an attachment route ends in
 * the file's own name, which under Clerk left members without their images
 * (the session is only readable on requests the middleware saw).
 */
function matchers(): string[] {
  const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  const block = source.slice(source.indexOf("matcher: ["));
  return [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
}

describe("proxy matcher", () => {
  it("runs for every API route, whatever the path ends in", () => {
    const api = matchers().find((m) => m.startsWith("/api"));
    expect(api).toBe("/api/:path*");
  });

  it("still skips static files elsewhere", () => {
    const [first] = matchers();
    const pattern = new RegExp(`^${first}$`);
    expect(pattern.test("/p/abc/feed")).toBe(true);
    expect(pattern.test("/favicon.ico")).toBe(false);
    expect(pattern.test("/opengraph-image.png")).toBe(false);
    // Without the second entry these two never reached the middleware.
    expect(pattern.test("/api/attachments/pot/contribution/photo.png")).toBe(false);
    expect(pattern.test("/api/attachments/pot/contribution/notes.txt")).toBe(false);
  });
});
