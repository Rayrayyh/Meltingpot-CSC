import { createHash } from "node:crypto";
import type { ClassworkKind, ImportedItem, ImportedMaterial } from "@/lib/classwork/types";

/**
 * The shape lms_sync_apply accepts, and the hash it compares.
 *
 * The hash is over everything a person could see change, canonically ordered,
 * so two fetches of the same thing hash the same whatever order the provider
 * listed the materials in, and a change anywhere lands as a change.
 */
export const TITLE_MAX = 500;
export const DESCRIPTION_MAX = 20_000;
export const MATERIALS_MAX = 40;

export type ItemInput = Omit<ImportedItem, "materials"> & { materials: ImportedMaterial[] };

function cleanUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^https:\/\//i.test(trimmed) ? trimmed : null;
}

function cleanMaterials(materials: ImportedMaterial[]): ImportedMaterial[] {
  const seen = new Set<string>();
  const out: ImportedMaterial[] = [];
  for (const m of materials) {
    const url = cleanUrl(m.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ kind: m.kind, title: (m.title || url).slice(0, 300), url });
    if (out.length >= MATERIALS_MAX) break;
  }
  return out.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

/** Trim, cap and order, so the hash below is stable. */
export function normaliseItem(input: ItemInput): ImportedItem {
  return {
    externalId: input.externalId.slice(0, 200),
    kind: input.kind,
    title: (input.title || "Untitled").trim().slice(0, TITLE_MAX) || "Untitled",
    description: (input.description ?? "").trim().slice(0, DESCRIPTION_MAX),
    dueAt: input.dueAt,
    dueAllDay: Boolean(input.dueAllDay),
    availableFrom: input.availableFrom ?? null,
    postedAt: input.postedAt ?? null,
    url: cleanUrl(input.url),
    materials: cleanMaterials(input.materials ?? []),
    externalUpdatedAt: input.externalUpdatedAt ?? null,
  };
}

export function contentHash(item: ImportedItem): string {
  const canonical = JSON.stringify([
    item.kind,
    item.title,
    item.description,
    item.dueAt,
    item.dueAllDay,
    item.availableFrom,
    item.postedAt,
    item.url,
    item.materials.map((m) => [m.kind, m.title, m.url]),
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

/** What the sync sends the database for one item. */
export type ItemPayload = ImportedItem & { contentHash: string };

export function toPayload(item: ImportedItem): ItemPayload {
  return { ...item, contentHash: contentHash(item) };
}

export function externalId(kind: ClassworkKind, providerId: string | number): string {
  return `${kind}:${String(providerId)}`;
}

/**
 * A Classroom due date with no time is a date, not a moment. It is stored at
 * noon UTC with dueAllDay set, so that cutting it into any reader's zone
 * within twelve hours of UTC lands on the same calendar day, and the display
 * shows no clock.
 */
export function allDayAt(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}T12:00:00.000Z`;
}
