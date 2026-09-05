// A stand in for Google Classroom and Canvas, for the end to end suite and for
// development in a container that cannot reach the real ones. Plain node:http,
// no dependencies, fixtures from lib/classwork/fixtures. POST /__control
// changes its mood: an expired grant, a throttle, a slow answer, a moved due
// date. Nothing here is clever; it answers the exact requests the adapters
// make and refuses everything else, which is how a wrong request shows up.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const google = JSON.parse(readFileSync(path.join(here, "..", "..", "lib", "classwork", "fixtures", "google.json"), "utf8"));
const canvas = JSON.parse(readFileSync(path.join(here, "..", "..", "lib", "classwork", "fixtures", "canvas.json"), "utf8"));
const port = Number(process.env.STUB_PORT ?? 3112);
const ORIGIN = `http://localhost:${port}`;

// Canvas dates, like Google's, land in the month the suite runs in.
function shiftIntoThisMonth(iso) {
  if (!iso) return iso;
  const d = new Date(iso);
  const now = new Date();
  const day = mood.dueDay !== null ? Number(mood.dueDay) : d.getUTCDate();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, d.getUTCHours(), d.getUTCMinutes())).toISOString();
}
function canvasAssignments(page) {
  return page.map((a) =>
    a.due_at
      ? { ...a, due_at: shiftIntoThisMonth(a.due_at), updated_at: mood.dueDay !== null ? shiftIntoThisMonth("2026-01-01T09:00:00Z") : a.updated_at }
      : a,
  );
}

const mood = { invalidGrant: false, throttle: 0, slowMs: 0, dueDay: null, refreshCount: 0, tokenCount: 0 };

function json(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

// Due dates land in the month the suite runs in, so the calendar's current
// month always shows them. The day comes from the fixture unless the dueDay
// mood moves it, and a moved item gets a new updateTime the way it would
// upstream, derived from the day so the same mood hashes the same twice.
function withDue(page) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return {
    ...page,
    courseWork: page.courseWork.map((w) => {
      if (!w.dueDate) return w;
      const moved = mood.dueDay !== null;
      const day = moved ? Number(mood.dueDay) : w.dueDate.day;
      return {
        ...w,
        dueDate: { year, month, day },
        updateTime: moved ? new Date(Date.UTC(year, month - 1, day, 9)).toISOString() : w.updateTime,
      };
    }),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const p = url.pathname;

  if (p === "/__control") {
    if (req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      Object.assign(mood, body);
      return json(res, 200, mood);
    }
    return json(res, 200, mood);
  }

  if (mood.slowMs > 0) await new Promise((r) => setTimeout(r, mood.slowMs));

  // ---- Google: consent, token, revoke ----
  if (p === "/google/o/oauth2/v2/auth") {
    const redirect = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    if (!redirect || !state) return json(res, 400, { error: "missing redirect_uri or state" });
    const back = new URL(redirect);
    back.searchParams.set("code", "stub-code");
    back.searchParams.set("state", state);
    back.searchParams.set("scope", url.searchParams.get("scope") ?? "");
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }
  if (p === "/google/token" && req.method === "POST") {
    const form = new URLSearchParams(await readBody(req));
    mood.tokenCount += 1;
    if (form.get("grant_type") === "authorization_code") {
      if (form.get("code") !== "stub-code") return json(res, 400, { error: "invalid_grant" });
      return json(res, 200, google.token.exchange);
    }
    if (form.get("grant_type") === "refresh_token") {
      mood.refreshCount += 1;
      if (mood.invalidGrant) return json(res, 400, google.token.invalidGrant);
      return json(res, 200, google.token.refresh);
    }
    return json(res, 400, { error: "unsupported_grant_type" });
  }
  if (p === "/google/revoke" && req.method === "POST") return json(res, 200, {});

  // ---- Google Classroom API ----
  if (p.startsWith("/google/classroom/v1/")) {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer at-")) return json(res, 401, { error: { code: 401, status: "UNAUTHENTICATED" } });
    if (mood.throttle > 0) {
      mood.throttle -= 1;
      return json(res, 429, { error: { code: 429, status: "RESOURCE_EXHAUSTED" } }, { "retry-after": "0" });
    }
    if (p === "/google/classroom/v1/courses") {
      return json(res, 200, url.searchParams.has("teacherId") ? google.courses.teacher : google.courses.student);
    }
    const m = p.match(/^\/google\/classroom\/v1\/courses\/([^/]+)\/(courseWork|courseWorkMaterials|announcements)$/);
    if (m) {
      const [, course, kind] = m;
      if (course !== "c-bio" && course !== "c-hist") return json(res, 404, { error: { code: 404 } });
      if (course === "c-hist") return json(res, 200, {});
      if (kind === "courseWork") {
        return json(res, 200, withDue(url.searchParams.get("pageToken") === "cw-page-2" ? google.courseWork.page2 : google.courseWork.page1));
      }
      if (kind === "courseWorkMaterials") return json(res, 200, google.courseWorkMaterials);
      return json(res, 200, google.announcements);
    }
  }

  // ---- Canvas: consent, token, revoke ----
  if (p === "/canvas/login/oauth2/auth") {
    const redirect = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    if (!redirect || !state) return json(res, 400, { error: "missing redirect_uri or state" });
    const back = new URL(redirect);
    back.searchParams.set("code", "stub-canvas-code");
    back.searchParams.set("state", state);
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }
  if (p === "/canvas/login/oauth2/token" && req.method === "POST") {
    const form = new URLSearchParams(await readBody(req));
    mood.tokenCount += 1;
    if (form.get("grant_type") === "authorization_code") {
      if (form.get("code") !== "stub-canvas-code") return json(res, 400, { error: "invalid_grant" });
      return json(res, 200, canvas.token.exchange);
    }
    if (form.get("grant_type") === "refresh_token") {
      mood.refreshCount += 1;
      if (mood.invalidGrant) return json(res, 400, canvas.token.invalidGrant);
      return json(res, 200, canvas.token.refresh);
    }
    return json(res, 400, { error: "unsupported_grant_type" });
  }
  if (p === "/canvas/login/oauth2/token" && req.method === "DELETE") return json(res, 200, {});

  // ---- Canvas API ----
  if (p.startsWith("/canvas/api/v1/")) {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer cat-")) return json(res, 401, { errors: [{ message: "Invalid access token." }] });
    if (mood.throttle > 0) {
      mood.throttle -= 1;
      return json(res, 403, { status: "throttled" }, { "x-rate-limit-remaining": "0", "retry-after": "0" });
    }
    const quota = { "x-rate-limit-remaining": "700", "x-request-cost": "0.5" };
    if (p === "/canvas/api/v1/courses") return json(res, 200, canvas.courses, quota);
    const course = p.match(/^\/canvas\/api\/v1\/courses\/(\d+)\/(assignments|modules)$/);
    if (course) {
      const [, id, kind] = course;
      if (id !== "101") return json(res, 200, [], quota);
      if (kind === "assignments") {
        if (url.searchParams.get("page") === "2") return json(res, 200, canvasAssignments(canvas.assignments.page2), quota);
        const next = `${ORIGIN}/canvas/api/v1/courses/101/assignments?page=2&per_page=50`;
        return json(res, 200, canvasAssignments(canvas.assignments.page1), { ...quota, link: `<${next}>; rel="next"` });
      }
      return json(res, 200, canvas.modules, quota);
    }
    if (p === "/canvas/api/v1/announcements") {
      return json(res, 200, url.searchParams.get("context_codes[]") === "course_101" ? canvas.announcements : [], quota);
    }
    if (p === "/canvas/api/v1/calendar_events") {
      if (url.searchParams.get("context_codes[]") !== "course_101") return json(res, 200, [], quota);
      return json(res, 200, canvas.events.map((e) => ({ ...e, start_at: shiftIntoThisMonth(e.start_at), end_at: shiftIntoThisMonth(e.end_at) })), quota);
    }
  }

  json(res, 404, { error: `stub has no ${req.method} ${p}` });
});

server.listen(port, () => {
  console.log(`stub lms listening on http://localhost:${port}`);
});
