import { canvasAdapter } from "@/lib/classwork/canvas";
import { googleClassroomAdapter } from "@/lib/classwork/google";
import type { ClassworkAdapter, ClassworkProvider } from "@/lib/classwork/types";

export type {
  ClassworkAdapter,
  ClassworkKind,
  ClassworkProvider,
  ImportedItem,
  ImportedMaterial,
  ProviderCourse,
  SyncCursor,
  SyncPage,
} from "@/lib/classwork/types";
export { ClassworkError } from "@/lib/classwork/types";

/**
 * One adapter per provider behind one interface, the way lib/organizer and
 * lib/auth select theirs. Whether a provider is actually usable on this site
 * is a separate question (classworkAvailability in config.ts); an adapter
 * asked to act without its credentials says not_configured, loudly and by
 * name.
 */
export function getClassworkAdapter(provider: ClassworkProvider): ClassworkAdapter {
  return provider === "canvas" ? canvasAdapter : googleClassroomAdapter;
}

export function isClassworkProvider(value: string): value is ClassworkProvider {
  return value === "google_classroom" || value === "canvas";
}
