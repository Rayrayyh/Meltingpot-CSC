import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixtures from "@/lib/classwork/fixtures/canvas.json";

vi.mock("server-only", () => ({}));

const ENV = { ...process.env };
const STUB = "http://stub.local";
const INSTANCE = "https://school.instructure.com";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

async function adapter() {
  return (await import("@/lib/classwork/canvas")).canvasAdapter;
}

beforeEach(() => {
  vi.resetModules();
  process.env.APP_ORIGIN = "https://app.example";
  process.env.CLASSWORK_STATE_SECRET = "s".repeat(44);
  process.env.CLASSWORK_SERVER_KEY = "k".repeat(44);
  process.env.CANVAS_OAUTH_CLIENT_ID = "canvas-key-id";
  process.env.CANVAS_OAUTH_CLIENT_SECRET = "canvas-key-secret";
  process.env.CANVAS_INSTANCE_URL = INSTANCE;
  process.env.CLASSWORK_PROVIDER_MODE = "stub";
  process.env.CLASSWORK_STUB_ORIGIN = STUB;
});
afterEach(() => {
  process.env = { ...ENV };
});

const deadlineAt = () => Date.now() + 10_000;
const ctx = (doFetch: unknown) => ({
  accessToken: "cat-1",
  instanceUrl: INSTANCE,
  deadlineAt: deadlineAt(),
  fetch: doFetch as typeof fetch,
});

describe("canvasAdapter", () => {
  it("builds a consent url on the instance with the read-only scope list", async () => {
    const url = new URL((await adapter()).authorizeUrl({ state: "st", redirectUri: "https://app.example/cb", instanceUrl: INSTANCE }));
    expect(url.origin + url.pathname).toBe(`${STUB}/canvas/login/oauth2/auth`);
    expect(url.searchParams.get("client_id")).toBe("canvas-key-id");
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.get("scope")).toContain("url:GET|/api/v1/courses");
    expect(url.searchParams.get("scope")).not.toMatch(/url:(POST|PUT|DELETE)/);
  });

  it("exchanges a code and reads who signed in from the token's user", async () => {
    const doFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(`${STUB}/canvas/login/oauth2/token`);
      expect(String(init?.body)).toContain("grant_type=authorization_code");
      return jsonResponse(fixtures.token.exchange);
    });
    const result = await (await adapter()).exchangeCode({
      code: "abc",
      redirectUri: "https://app.example/cb",
      instanceUrl: INSTANCE,
      deadlineAt: deadlineAt(),
      fetch: doFetch as unknown as typeof fetch,
    });
    expect(result.refreshToken).toBe("crt-1");
    expect(result.externalUserId).toBe("10000000000042");
    expect(result.externalDisplay).toBe("Ava Morgan");
  });

  it("turns invalid_grant on refresh into reconnect_required", async () => {
    const doFetch = vi.fn(async () => jsonResponse(fixtures.token.invalidGrant, 400));
    await expect(
      (await adapter()).refreshAccessToken({ refreshToken: "crt-1", instanceUrl: INSTANCE, deadlineAt: deadlineAt(), fetch: doFetch as unknown as typeof fetch }),
    ).rejects.toMatchObject({ code: "reconnect_required" });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it("lists active courses with the enrollment the school reports and a person-facing url", async () => {
    const doFetch = vi.fn(async (url: string) => {
      const u = new URL(url);
      expect(u.pathname).toBe("/canvas/api/v1/courses");
      expect(u.searchParams.get("enrollment_state")).toBe("active");
      return jsonResponse(fixtures.courses);
    });
    const courses = await (await adapter()).listCourses(ctx(doFetch));
    expect(courses.map((c) => [c.externalId, c.enrollment])).toEqual([
      ["101", "student"],
      ["202", "teacher"],
    ]);
    expect(courses[0].url).toBe(`${INSTANCE}/courses/101`);
    expect(courses[0].section).toBe("BIO-101");
  });

  it("walks assignments, announcements, modules and events, paging on the Link header", async () => {
    const seen: string[] = [];
    const page2 = `${STUB}/canvas/api/v1/courses/101/assignments?page=2&per_page=50`;
    const doFetch = vi.fn(async (url: string, init?: RequestInit) => {
      const u = new URL(url);
      seen.push(u.pathname + (u.searchParams.get("page") ? `?page=${u.searchParams.get("page")}` : ""));
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer cat-1");
      if (u.pathname.endsWith("/assignments")) {
        return u.searchParams.get("page") === "2"
          ? jsonResponse(fixtures.assignments.page2)
          : jsonResponse(fixtures.assignments.page1, 200, { link: `<${page2}>; rel="next", <${STUB}/x?page=1>; rel="first"` });
      }
      if (u.pathname.endsWith("/announcements")) {
        expect(u.searchParams.get("context_codes[]")).toBe("course_101");
        expect(u.searchParams.get("start_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        return jsonResponse(fixtures.announcements);
      }
      if (u.pathname.endsWith("/modules")) return jsonResponse(fixtures.modules);
      if (u.pathname.endsWith("/calendar_events")) return jsonResponse(fixtures.events);
      throw new Error(`unexpected ${url}`);
    });
    const a = await adapter();
    const c = ctx(doFetch);

    const first = await a.fetchPage(c, "101", null);
    expect(first.items.map((i) => [i.externalId, i.kind])).toEqual([
      ["assignment:1", "assignment"],
      ["quiz:2", "quiz"],
    ]);
    expect(first.items[0].description).toBe("Write up the mitosis lab. See Lab handout.pdf and the Mitosis explainer.");
    expect(first.items[0].materials.map((m) => [m.kind, m.title])).toEqual([
      ["link", "Mitosis explainer"],
      ["file", "Lab handout.pdf"],
    ]);
    expect(first.items[0].dueAt).toBe("2026-09-12T06:59:00Z");
    expect(first.next).toEqual({ phase: "assignments", pageToken: page2 });

    const second = await a.fetchPage(c, "101", first.next);
    expect(second.items.map((i) => i.externalId)).toEqual(["assignment:3"]);
    expect(second.next).toEqual({ phase: "announcements", pageToken: null });

    const third = await a.fetchPage(c, "101", second.next);
    expect(third.items[0]).toMatchObject({ externalId: "announcement:7", kind: "announcement", title: "Lab moved to Thursday", description: "Bring goggles." });
    expect(third.next).toEqual({ phase: "modules", pageToken: null });

    const fourth = await a.fetchPage(c, "101", third.next);
    expect(fourth.items[0]).toMatchObject({ externalId: "material:module-11", kind: "material", title: "Unit 1: Cells" });
    // The assignment inside the module is already imported on its own; the
    // sub header is nothing at all.
    expect(fourth.items[0].materials.map((m) => m.kind).sort()).toEqual(["file", "link", "page"]);
    expect(fourth.items[0].description).toContain("Cell theory");
    expect(fourth.next).toEqual({ phase: "events", pageToken: null });

    const fifth = await a.fetchPage(c, "101", fourth.next);
    expect(fifth.items[0]).toMatchObject({ externalId: "event:21", kind: "event", dueAt: "2026-09-18T14:00:00Z", dueAllDay: false });
    // An all-day event keeps its date, not the course zone's midnight, which
    // read from anywhere east of it is the evening before.
    expect(fifth.items[1]).toMatchObject({ externalId: "event:22", kind: "event", dueAt: "2026-09-25T12:00:00.000Z", dueAllDay: true });
    expect(fifth.next).toBeNull();

    expect(seen).toEqual([
      "/canvas/api/v1/courses/101/assignments",
      "/canvas/api/v1/courses/101/assignments?page=2",
      "/canvas/api/v1/announcements",
      "/canvas/api/v1/courses/101/modules",
      "/canvas/api/v1/calendar_events",
    ]);
  });

  it("treats a spent quota (403 with the rate limit header) as busy and tries again", async () => {
    let calls = 0;
    const doFetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ status: "throttled" }, 403, { "x-rate-limit-remaining": "0", "retry-after": "0" });
      }
      return jsonResponse(fixtures.assignments.page2);
    });
    const page = await (await adapter()).fetchPage(ctx(doFetch), "101", null);
    expect(calls).toBe(2);
    expect(page.items.map((i) => i.externalId)).toEqual(["assignment:3"]);
  });

  it("refuses when the school's host is not configured", async () => {
    delete process.env.CANVAS_INSTANCE_URL;
    await expect(async () => (await adapter()).authorizeUrl({ state: "st", redirectUri: "https://app.example/cb" })).rejects.toMatchObject({
      code: "not_configured",
    });
  });
});
