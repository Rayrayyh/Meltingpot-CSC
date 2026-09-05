import { googleClassroomAdapter } from "@/lib/classwork/google";
import { ClassworkError, type ClassworkAdapter, type ClassworkProvider } from "@/lib/classwork/types";

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
 * lib/auth select theirs. Canvas arrives in phase 3; until then asking for it
 * fails the same way an unconfigured provider does, loudly and by name.
 */
export function getClassworkAdapter(provider: ClassworkProvider): ClassworkAdapter {
  if (provider === "google_classroom") return googleClassroomAdapter;
  throw new ClassworkError("Canvas is not set up on this site", "not_configured");
}

export function isClassworkProvider(value: string): value is ClassworkProvider {
  return value === "google_classroom" || value === "canvas";
}
