import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixtures from "@/lib/classwork/fixtures/google.json";

vi.mock("server-only", () => ({}));

const ENV = { ...process.env };
const STUB = "http://stub.local";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

async function adapter() {
  return (await import("@/lib/classwork/google")).googleClassroomAdapter;
}

beforeEach(() => {
  vi.resetModules();
  process.env.APP_ORIGIN = "https://app.example";
  process.env.CLASSWORK_STATE_SECRET = "s".repeat(44);
  process.env.CLASSWORK_SERVER_KEY = "k".repeat(44);
  process.env.CLASSROOM_OAUTH_CLIENT_ID = "client-id";
  process.env.CLASSROOM_OAUTH_CLIENT_SECRET = "client-secret";
  process.env.CLASSWORK_PROVIDER_MODE = "stub";
  process.env.CLASSWORK_STUB_ORIGIN = STUB;
});
afterEach(() => {
  process.env = { ...ENV };
});

const deadlineAt = () => Date.now() + 10_000;

describe("googleClassroomAdapter", () => {
  it("builds a consent url with the read-only scopes and offline access", async () => {
    const url = new URL((await adapter()).authorizeUrl({ state: "st", redirectUri: "https://app.example/cb" }));
    expect(url.origin + url.pathname).toBe(`${STUB}/google/o/oauth2/v2/auth`);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("st");
    const scope = url.searchParams.get("scope") ?? "";
    expect(scope).toContain("classroom.coursework.me.readonly");
    expect(scope).not.toContain("drive");
    expect(scope).not.toMatch(/classroom\.[a-z.]+(?<!readonly)$/);
  });

  it("exchanges a code and reads who signed in from the id token", async () => {
    const doFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(`${STUB}/google/token`);
      expect(String(init?.body)).toContain("grant_type=authorization_code");
      return jsonResponse(fixtures.token.exchange);
    });
    const result = await (await adapter()).exchangeCode({ code: "abc", redirectUri: "https://app.example/cb", deadlineAt: deadlineAt(), fetch: doFetch as unknown as typeof fetch });
    expect(result.refreshToken).toBe("rt-1");
    expect(result.externalUserId).toBe("1024");
    expect(result.externalDisplay).toBe("ava@example.org");
    expect(result.scopes).toContain("openid");
  });

  it("turns invalid_grant on refresh into reconnect_required", async () => {
    const doFetch = vi.fn(async () => jsonResponse(fixtures.token.invalidGrant, 400));
    await expect(
      (await adapter()).refreshAccessToken({ refreshToken: "rt-1", deadlineAt: deadlineAt(), fetch: doFetch as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: "reconnect_required" });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it("lists courses for both roles and marks the one taught", async () => {
    const doFetch = vi.fn(async (url: string) => {
      const u = new URL(url);
      expect(u.pathname).toBe("/google/classroom/v1/courses");
      return jsonResponse(u.searchParams.has("teacherId") ? fixtures.courses.teacher : fixtures.courses.student);
    });
    const courses = await (await adapter()).listCourses({ accessToken: "at", deadlineAt: deadlineAt(), fetch: doFetch as unknown as typeof fetch });
    expect(courses.map((c) => [c.externalId, c.enrollment])).toEqual([
      ["c-bio", "teacher"],
      ["c-hist", "student"],
    ]);
    expect(courses[0].section).toBe("Period 2");
  });

  it("walks course work, materials and announcements, paging on the provider's token", async () => {
    const seen: string[] = [];
    const doFetch = vi.fn(async (url: string, init?: RequestInit) => {
      const u = new URL(url);
      seen.push(u.pathname + (u.searchParams.get("pageToken") ? "?" + u.searchParams.get("pageToken") : ""));
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer at");
      if (u.pathname.endsWith("/courseWork")) {
        return jsonResponse(u.searchParams.get("pageToken") === "cw-page-2" ? fixtures.courseWork.page2 : fixtures.courseWork.page1);
      }
      if (u.pathname.endsWith("/courseWorkMaterials")) return jsonResponse(fixtures.courseWorkMaterials);
      if (u.pathname.endsWith("/announcements")) return jsonResponse(fixtures.announcements);
      return jsonResponse({}, 404);
    });
    const a = await adapter();
    const ctx = { accessToken: "at", deadlineAt: deadlineAt(), fetch: doFetch as unknown as typeof fetch };

    const p1 = await a.fetchPage(ctx, "c-bio", null);
    expect(p1.next).toEqual({ phase: "coursework", pageToken: "cw-page-2" });
    expect(p1.items.map((i) => i.externalId)).toEqual(["assignment:cw-1", "quiz:cw-2"]);
    const lab = p1.items[0];
    expect(lab.dueAt).toBe("2026-09-12T06:59:00.000Z");
    expect(lab.dueAllDay).toBe(false);
    expect(lab.materials).toEqual([
      { kind: "drive", title: "Lab handout.pdf", url: "https://drive.google.com/file/d/d1/view" },
      { kind: "link", title: "Mitosis explainer", url: "https://example.org/mitosis" },
    ]);
    const quiz = p1.items[1];
    expect(quiz.kind).toBe("quiz");
    expect(quiz.dueAt).toBe("2026-09-08T12:00:00.000Z");
    expect(quiz.dueAllDay).toBe(true);

    const p2 = await a.fetchPage(ctx, "c-bio", p1.next);
    expect(p2.items.map((i) => i.externalId)).toEqual(["assignment:cw-3"]);
    expect(p2.items[0].dueAt).toBeNull();
    expect(p2.next).toEqual({ phase: "materials", pageToken: null });

    const p3 = await a.fetchPage(ctx, "c-bio", p2.next);
    expect(p3.items[0]).toMatchObject({ externalId: "material:m-1", kind: "material" });
    expect(p3.items[0].materials[0]).toMatchObject({ kind: "form" });
    expect(p3.next).toEqual({ phase: "announcements", pageToken: null });

    const p4 = await a.fetchPage(ctx, "c-bio", p3.next);
    expect(p4.items[0]).toMatchObject({ externalId: "announcement:an-1", kind: "announcement", title: "Lab moved to Thursday." });
    expect(p4.items[0].description).toBe("Lab moved to Thursday.\nBring goggles.");
    expect(p4.next).toBeNull();

    expect(seen).toEqual([
      "/google/classroom/v1/courses/c-bio/courseWork",
      "/google/classroom/v1/courses/c-bio/courseWork?cw-page-2",
      "/google/classroom/v1/courses/c-bio/courseWorkMaterials",
      "/google/classroom/v1/courses/c-bio/announcements",
    ]);
  });

  it("refuses to publish", async () => {
    await expect((await adapter()).publish({ accessToken: "at", deadlineAt: deadlineAt() }, { courseId: "c", title: "t", body: "b", url: "https://x" }))
      .rejects.toMatchObject({ code: "not_configured" });
  });
});
