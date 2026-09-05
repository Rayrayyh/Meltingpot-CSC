import {
  ClassworkError,
  type ClassworkAdapter,
  type ClassworkProvider,
  type ProviderCourse,
  type SyncCursor,
  type SyncPage,
} from "@/lib/classwork/types";

/**
 * The third adapter: fed by fixtures, talks to nothing. The sync engine's
 * tests run on it, and it fails on request so the failure paths are tested
 * the same way the happy one is.
 */
export type FixtureScript = {
  provider?: ClassworkProvider;
  courses?: ProviderCourse[];
  /** Pages in order; the cursor is the index into this list. */
  pages: SyncPage[];
  refresh?: "ok" | "reconnect" | "fail";
  failPageAt?: number;
};

export function fixtureAdapter(script: FixtureScript): ClassworkAdapter & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    provider: script.provider ?? "google_classroom",
    authorizeUrl: ({ state }) => `https://fixture.local/auth?state=${state}`,
    async exchangeCode() {
      calls.push("exchange");
      return {
        refreshToken: "fixture-refresh",
        accessToken: "fixture-access",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        externalUserId: "fixture-user",
        externalDisplay: "fixture@example.org",
        scopes: [],
      };
    },
    async refreshAccessToken() {
      calls.push("refresh");
      if (script.refresh === "reconnect") {
        throw new ClassworkError("Google Classroom needs reconnecting", "reconnect_required", 400);
      }
      if (script.refresh === "fail") throw new ClassworkError("Provider down", "provider_failed", 503);
      return { accessToken: "fixture-access", expiresAt: new Date(Date.now() + 3600_000).toISOString() };
    },
    async revoke() {
      calls.push("revoke");
    },
    async listCourses() {
      calls.push("courses");
      return script.courses ?? [];
    },
    async fetchPage(_ctx, _courseId, cursor: SyncCursor | null) {
      const index = cursor ? Number(cursor.pageToken ?? 0) : 0;
      calls.push(`page:${index}`);
      if (script.failPageAt === index) throw new ClassworkError("Busy right now", "rate_limited", 429);
      const page = script.pages[index];
      if (!page) throw new ClassworkError("No such page", "provider_failed");
      const hasNext = index + 1 < script.pages.length;
      return { items: page.items, next: hasNext ? { phase: "fixture", pageToken: String(index + 1) } : null };
    },
    async publish(): Promise<never> {
      throw new ClassworkError("Not built", "not_configured");
    },
  };
}
