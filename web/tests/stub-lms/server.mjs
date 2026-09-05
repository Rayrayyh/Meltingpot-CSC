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
const port = Number(process.env.STUB_PORT ?? 3112);

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

function withDue(page) {
  if (mood.dueDay === null) return page;
  return {
    ...page,
    courseWork: page.courseWork.map((w) => (w.dueDate ? { ...w, dueDate: { ...w.dueDate, day: mood.dueDay }, updateTime: new Date().toISOString() } : w)),
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

  json(res, 404, { error: `stub has no ${req.method} ${p}` });
});

server.listen(port, () => {
  console.log(`stub lms listening on http://localhost:${port}`);
});
