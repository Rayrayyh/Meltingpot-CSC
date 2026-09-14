import { describe, expect, it } from "vitest";
import { allDayAt, contentHash, externalId, normaliseItem, toPayload } from "@/lib/classwork/reconcile";
import type { ImportedItem } from "@/lib/classwork/types";

const base: ImportedItem = {
  externalId: "assignment:1",
  kind: "assignment",
  title: "  Lab report ",
  description: " Write it up. ",
  dueAt: "2026-09-12T06:59:00.000Z",
  dueAllDay: false,
  availableFrom: null,
  postedAt: "2026-09-01T15:00:00Z",
  url: "https://classroom.google.com/c/bio/a/1",
  materials: [
    { kind: "link", title: "B", url: "https://example.org/b" },
    { kind: "drive", title: "A", url: "https://drive.google.com/a" },
  ],
  externalUpdatedAt: "2026-09-02T09:30:00Z",
};

describe("normaliseItem", () => {
  it("trims, caps and sorts materials by url", () => {
    const item = normaliseItem(base);
    expect(item.title).toBe("Lab report");
    expect(item.description).toBe("Write it up.");
    expect(item.materials.map((m) => m.url)).toEqual(["https://drive.google.com/a", "https://example.org/b"]);
  });

  it("drops insecure and duplicate links and gives a nameless one its url", () => {
    const item = normaliseItem({
      ...base,
      url: "http://insecure.example",
      materials: [
        { kind: "link", title: "", url: "https://x.example/1" },
        { kind: "link", title: "again", url: "https://x.example/1" },
        { kind: "link", title: "nope", url: "javascript:alert(1)" },
      ],
    });
    expect(item.url).toBeNull();
    expect(item.materials).toEqual([{ kind: "link", title: "https://x.example/1", url: "https://x.example/1" }]);
  });

  it("never lets a title be empty and caps a long description", () => {
    const item = normaliseItem({ ...base, title: "   ", description: "x".repeat(30_000) });
    expect(item.title).toBe("Untitled");
    expect(item.description).toHaveLength(20_000);
  });
});

describe("contentHash", () => {
  it("is stable across material order and whitespace", () => {
    const a = contentHash(normaliseItem(base));
    const b = contentHash(normaliseItem({ ...base, title: "Lab report", materials: [...base.materials].reverse() }));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when anything a person could see changes", () => {
    const a = contentHash(normaliseItem(base));
    expect(contentHash(normaliseItem({ ...base, dueAt: "2026-09-13T06:59:00.000Z" }))).not.toBe(a);
    expect(contentHash(normaliseItem({ ...base, description: "Write it up, with drawings." }))).not.toBe(a);
    expect(contentHash(normaliseItem({ ...base, materials: [] }))).not.toBe(a);
  });

  it("does not change with the provider's own updated stamp alone", () => {
    const a = contentHash(normaliseItem(base));
    expect(contentHash(normaliseItem({ ...base, externalUpdatedAt: "2026-09-05T00:00:00Z" }))).toBe(a);
  });
});

describe("helpers", () => {
  it("namespaces ids by kind and places an all day date at noon UTC", () => {
    expect(externalId("quiz", 12)).toBe("quiz:12");
    expect(allDayAt(2026, 9, 8)).toBe("2026-09-08T12:00:00.000Z");
    expect(toPayload(normaliseItem(base)).contentHash).toHaveLength(64);
  });
});
