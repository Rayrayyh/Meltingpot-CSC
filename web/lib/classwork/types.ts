/**
 * Classwork from elsewhere: the contract every provider adapter fills.
 *
 * One interface, two live implementations (Google Classroom and Canvas) and a
 * fixture implementation for tests, the way lib/organizer and lib/auth are
 * shaped. Everything here is read-only against the provider; publish() is
 * reserved on the interface for the day the owner asks for write back and
 * throws not_configured until then.
 */

export type ClassworkProvider = "google_classroom" | "canvas";

export type ClassworkKind =
  | "assignment"
  | "quiz"
  | "discussion"
  | "announcement"
  | "material"
  | "event";

export type ProviderCourse = {
  externalId: string;
  name: string;
  url: string | null;
  enrollment: "teacher" | "student" | "unknown";
  section?: string | null;
};

export type ImportedMaterial = {
  kind: "drive" | "link" | "youtube" | "form" | "file" | "page" | "other";
  title: string;
  url: string;
};

/** One thing a course published, in the shape lms_sync_apply accepts. */
export type ImportedItem = {
  /** Namespaced as `${kind}:${providerId}` so kinds cannot collide. */
  externalId: string;
  kind: ClassworkKind;
  title: string;
  /** Plain text. Canvas HTML is flattened before it gets here. */
  description: string;
  dueAt: string | null;
  dueAllDay: boolean;
  availableFrom: string | null;
  postedAt: string | null;
  url: string | null;
  materials: ImportedMaterial[];
  externalUpdatedAt: string | null;
};

/** Where a pass got to. The adapter owns the phase names. */
export type SyncCursor = { phase: string; pageToken: string | null };

export type SyncPage = { items: ImportedItem[]; next: SyncCursor | null };

export type AdapterContext = {
  accessToken: string;
  instanceUrl?: string;
  /** Absolute time, so several calls share one clock. */
  deadlineAt: number;
  /** Injected in tests. */
  fetch?: typeof fetch;
};

export type ConnectResult = {
  refreshToken: string;
  accessToken: string;
  expiresAt: string;
  externalUserId: string;
  externalDisplay: string | null;
  scopes: string[];
};

export type PublishInput = {
  courseId: string;
  title: string;
  body: string;
  url: string;
};

export type ClassworkErrorCode =
  | "not_configured"
  | "reconnect_required"
  | "rate_limited"
  | "provider_failed"
  | "timed_out"
  | "forbidden";

export class ClassworkError extends Error {
  constructor(
    message: string,
    readonly code: ClassworkErrorCode,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ClassworkError";
  }
}

export interface ClassworkAdapter {
  readonly provider: ClassworkProvider;
  authorizeUrl(input: { state: string; redirectUri: string; instanceUrl?: string }): string;
  exchangeCode(input: {
    code: string;
    redirectUri: string;
    instanceUrl?: string;
    deadlineAt: number;
    fetch?: typeof fetch;
  }): Promise<ConnectResult>;
  refreshAccessToken(input: {
    refreshToken: string;
    instanceUrl?: string;
    deadlineAt: number;
    fetch?: typeof fetch;
  }): Promise<{ accessToken: string; expiresAt: string }>;
  revoke(input: {
    refreshToken: string;
    instanceUrl?: string;
    deadlineAt: number;
    fetch?: typeof fetch;
  }): Promise<void>;
  listCourses(ctx: AdapterContext): Promise<ProviderCourse[]>;
  fetchPage(ctx: AdapterContext, courseId: string, cursor: SyncCursor | null): Promise<SyncPage>;
  /** Reserved for write back. Throws not_configured in every adapter today. */
  publish(ctx: AdapterContext, input: PublishInput): Promise<never>;
}
