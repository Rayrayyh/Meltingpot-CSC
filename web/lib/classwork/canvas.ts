import { getClassworkConfig, providerOrigins } from "@/lib/classwork/config";
import { htmlToText } from "@/lib/classwork/html-to-text";
import { providerFetch, readJson } from "@/lib/classwork/http";
import { allDayAt, externalId, normaliseItem } from "@/lib/classwork/reconcile";
import {
  ClassworkError,
  type AdapterContext,
  type ClassworkAdapter,
  type ClassworkKind,
  type ConnectResult,
  type ImportedItem,
  type ImportedMaterial,
  type ProviderCourse,
  type SyncCursor,
  type SyncPage,
} from "@/lib/classwork/types";

/**
 * Canvas LMS, read-only, against one school's instance.
 *
 * Canvas's policy forbids asking people for manually generated tokens, so
 * this is OAuth2 against a developer key the school's admin issues. A course
 * is walked in four phases, assignments, announcements, modules and calendar
 * events, each paged on the Link header the API sends, and the cursor the
 * sync stores is that header's next URL. Requests go one at a time, and when
 * the quota header gets low the adapter pauses before the next one, which is
 * what Canvas asks of clients.
 *
 * Descriptions arrive as HTML and are flattened. The links inside them come
 * along as materials, so a handout linked from an assignment is one click
 * away, but nothing is ever downloaded: a file is its Canvas URL, which opens
 * for anyone the course lets in.
 */
export const CANVAS_SCOPES = [
  "url:GET|/api/v1/users/self",
  "url:GET|/api/v1/courses",
  "url:GET|/api/v1/courses/:course_id/assignments",
  "url:GET|/api/v1/courses/:course_id/modules",
  "url:GET|/api/v1/announcements",
  "url:GET|/api/v1/calendar_events",
];

const PHASES = ["assignments", "announcements", "modules", "events"] as const;
type Phase = (typeof PHASES)[number];
const PER_PAGE = 50;
const QUOTA_FLOOR = 100;
const QUOTA_PAUSE_MS = 750;
const DAY_MS = 24 * 3_600_000;

type Assignment = {
  id: number;
  name?: string;
  description?: string | null;
  due_at?: string | null;
  unlock_at?: string | null;
  html_url?: string;
  published?: boolean;
  workflow_state?: string;
  submission_types?: string[];
  is_quiz_assignment?: boolean;
  quiz_id?: number | null;
  discussion_topic?: unknown;
  created_at?: string;
  updated_at?: string;
};

type Announcement = {
  id: number;
  title?: string;
  message?: string | null;
  html_url?: string;
  posted_at?: string | null;
  created_at?: string;
  delayed_post_at?: string | null;
};

type ModuleItem = {
  id: number;
  title?: string;
  type?: string;
  html_url?: string;
  external_url?: string;
  published?: boolean;
};

type CourseModule = {
  id: number;
  name?: string;
  published?: boolean;
  items?: ModuleItem[];
};

type CalendarEvent = {
  id: number;
  title?: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  all_day?: boolean;
  all_day_date?: string | null;
  html_url?: string;
  updated_at?: string;
  created_at?: string;
  workflow_state?: string;
};

type Course = {
  id: number;
  name?: string;
  course_code?: string;
  workflow_state?: string;
  enrollments?: Array<{ type?: string; enrollment_state?: string }>;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: number; name?: string; global_id?: string };
};

function credentials() {
  const c = getClassworkConfig();
  if (!c.CANVAS_OAUTH_CLIENT_ID || !c.CANVAS_OAUTH_CLIENT_SECRET) {
    throw new ClassworkError("Canvas is not set up on this site", "not_configured");
  }
  return { clientId: c.CANVAS_OAUTH_CLIENT_ID, clientSecret: c.CANVAS_OAUTH_CLIENT_SECRET };
}

/** Where calls go: the school's host, or the stub in stub mode. */
function base(instanceUrl?: string): string {
  const host = instanceUrl ?? getClassworkConfig().CANVAS_INSTANCE_URL;
  if (!host) throw new ClassworkError("Canvas is not set up on this site", "not_configured");
  return providerOrigins().canvas(host);
}

/** The person-facing host, for the URLs a course gets. */
function publicBase(instanceUrl?: string): string {
  const host = instanceUrl ?? getClassworkConfig().CANVAS_INSTANCE_URL ?? "";
  return host.replace(/\/$/, "");
}

function nextLink(response: Response): string | null {
  const header = response.headers.get("link") ?? "";
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function apiGet<T>(ctx: AdapterContext, url: string, label: string): Promise<{ body: T; next: string | null }> {
  const response = await providerFetch(url, {
    method: "GET",
    headers: { authorization: `Bearer ${ctx.accessToken}`, accept: "application/json" },
    deadlineAt: ctx.deadlineAt,
    fetch: ctx.fetch,
    label,
  });
  // A missing header is not an empty bucket: Number(null) is 0, which would
  // pause every request against an instance or proxy that drops the header.
  const remainingHeader = response.headers.get("x-rate-limit-remaining");
  const remaining = remainingHeader === null ? Number.NaN : Number(remainingHeader);
  const body = await readJson<T>(response, label);
  // Canvas asks clients to slow down before the bucket is empty. A short
  // pause here costs less than the 403 that follows an empty one.
  if (Number.isFinite(remaining) && remaining < QUOTA_FLOOR && ctx.deadlineAt - Date.now() > QUOTA_PAUSE_MS + 2_000) {
    await new Promise((resolve) => setTimeout(resolve, QUOTA_PAUSE_MS));
  }
  return { body, next: nextLink(response) };
}

async function tokenPost(
  instanceUrl: string | undefined,
  body: Record<string, string>,
  deadlineAt: number,
  label: string,
  doFetch?: typeof fetch,
): Promise<TokenResponse> {
  const response = await providerFetch(`${base(instanceUrl)}/login/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams(body).toString(),
    deadlineAt,
    fetch: doFetch,
    label,
  }).catch((error: unknown) => {
    // A refresh token Canvas no longer honours (the key revoked, the person
    // removed) comes back as 400 invalid_grant. Here it means reconnect.
    if (error instanceof ClassworkError && error.status === 400 && body.grant_type === "refresh_token") {
      throw new ClassworkError("Canvas needs reconnecting", "reconnect_required", 400);
    }
    throw error;
  });
  return readJson<TokenResponse>(response, label);
}

/** The links inside a Canvas HTML description, as materials. */
export function linksIn(html: string | null | undefined): ImportedMaterial[] {
  if (!html) return [];
  const out: ImportedMaterial[] = [];
  const anchors = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchors.exec(html)) !== null && out.length < 40) {
    const url = match[1].trim();
    if (!/^https:\/\//i.test(url)) continue;
    const title = htmlToText(match[2]).trim() || url;
    const kind: ImportedMaterial["kind"] = /\/files\/\d+/.test(url) ? "file" : /\/pages\//.test(url) ? "page" : "link";
    out.push({ kind, title, url });
  }
  return out;
}

function assignmentKind(a: Assignment): ClassworkKind {
  const types = a.submission_types ?? [];
  if (a.is_quiz_assignment || a.quiz_id || types.includes("online_quiz")) return "quiz";
  if (a.discussion_topic || types.includes("discussion_topic")) return "discussion";
  return "assignment";
}

function assignmentItem(a: Assignment): ImportedItem {
  const kind = assignmentKind(a);
  return normaliseItem({
    externalId: externalId(kind, a.id),
    kind,
    title: a.name ?? "Untitled",
    description: htmlToText(a.description ?? ""),
    dueAt: a.due_at ?? null,
    dueAllDay: false,
    availableFrom: a.unlock_at ?? null,
    postedAt: a.created_at ?? null,
    url: a.html_url ?? null,
    materials: linksIn(a.description),
    externalUpdatedAt: a.updated_at ?? null,
  });
}

function announcementItem(a: Announcement): ImportedItem {
  const text = htmlToText(a.message ?? "");
  return normaliseItem({
    externalId: externalId("announcement", a.id),
    kind: "announcement",
    title: a.title?.trim() || (text.split("\n")[0]?.slice(0, 120) ?? "") || "Announcement",
    description: text,
    dueAt: null,
    dueAllDay: false,
    availableFrom: a.delayed_post_at ?? null,
    postedAt: a.posted_at ?? a.created_at ?? null,
    url: a.html_url ?? null,
    materials: linksIn(a.message),
    externalUpdatedAt: a.posted_at ?? null,
  });
}

const MODULE_LINK_TYPES: Record<string, ImportedMaterial["kind"]> = {
  File: "file",
  Page: "page",
  ExternalUrl: "link",
  ExternalTool: "other",
};

/**
 * A module is one material: its name, its items as the description, and the
 * items that are links as materials. Assignments, quizzes and discussions
 * inside a module are already imported on their own and are not repeated.
 */
function moduleItem(m: CourseModule): ImportedItem {
  const items = (m.items ?? []).filter((i) => i.published !== false && i.type !== "SubHeader");
  const materials: ImportedMaterial[] = [];
  for (const item of items) {
    const kind = MODULE_LINK_TYPES[item.type ?? ""];
    const url = item.external_url ?? item.html_url;
    if (!kind || !url) continue;
    materials.push({ kind, title: item.title ?? url, url });
  }
  return normaliseItem({
    externalId: externalId("material", `module-${m.id}`),
    kind: "material",
    title: m.name ?? "Module",
    description: items.map((i) => i.title ?? "").filter(Boolean).join("\n"),
    dueAt: null,
    dueAllDay: false,
    availableFrom: null,
    postedAt: null,
    url: null,
    materials,
    externalUpdatedAt: null,
  });
}

/**
 * An all-day event is a date. Canvas also sends start_at as that date at
 * midnight in the course's zone, which read in any other zone is the evening
 * before; the date is stored the way a Classroom due date without a time is.
 */
function allDayFrom(date: string, fallback: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? allDayAt(Number(m[1]), Number(m[2]), Number(m[3])) : fallback;
}

function eventItem(e: CalendarEvent): ImportedItem {
  return normaliseItem({
    externalId: externalId("event", e.id),
    kind: "event",
    title: e.title ?? "Event",
    description: htmlToText(e.description ?? ""),
    dueAt: e.all_day && e.all_day_date ? allDayFrom(e.all_day_date, e.start_at ?? null) : (e.start_at ?? null),
    dueAllDay: Boolean(e.all_day),
    availableFrom: null,
    postedAt: e.created_at ?? null,
    url: e.html_url ?? null,
    materials: linksIn(e.description),
    externalUpdatedAt: e.updated_at ?? null,
  });
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function firstUrl(phase: Phase, courseId: string, instanceUrl?: string): string {
  const root = `${base(instanceUrl)}/api/v1`;
  const course = encodeURIComponent(courseId);
  const now = Date.now();
  switch (phase) {
    case "assignments":
      return `${root}/courses/${course}/assignments?per_page=${PER_PAGE}&order_by=due_at`;
    case "announcements":
      // Canvas answers with the last fortnight unless told otherwise.
      return `${root}/announcements?context_codes[]=course_${course}&per_page=${PER_PAGE}&start_date=${isoDate(now - 365 * DAY_MS)}&end_date=${isoDate(now + 365 * DAY_MS)}`;
    case "modules":
      return `${root}/courses/${course}/modules?include[]=items&per_page=${PER_PAGE}`;
    case "events":
      return `${root}/calendar_events?context_codes[]=course_${course}&type=event&per_page=${PER_PAGE}&start_date=${isoDate(now - 30 * DAY_MS)}&end_date=${isoDate(now + 365 * DAY_MS)}`;
  }
}

function afterPhase(phase: Phase): SyncCursor | null {
  const i = PHASES.indexOf(phase);
  return i + 1 < PHASES.length ? { phase: PHASES[i + 1], pageToken: null } : null;
}

function enrollmentOf(course: Course): ProviderCourse["enrollment"] {
  const types = (course.enrollments ?? [])
    .filter((e) => !e.enrollment_state || e.enrollment_state === "active")
    .map((e) => (e.type ?? "").toLowerCase());
  if (types.some((t) => t.includes("teacher") || t.includes("ta") || t.includes("designer"))) return "teacher";
  if (types.some((t) => t.includes("student") || t.includes("observer"))) return "student";
  return "unknown";
}

export const canvasAdapter: ClassworkAdapter = {
  provider: "canvas",

  authorizeUrl({ state, redirectUri, instanceUrl }) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      scope: CANVAS_SCOPES.join(" "),
    });
    return `${base(instanceUrl)}/login/oauth2/auth?${params.toString()}`;
  },

  async exchangeCode({ code, redirectUri, instanceUrl, deadlineAt, fetch: doFetch }): Promise<ConnectResult> {
    const { clientId, clientSecret } = credentials();
    const token = await tokenPost(
      instanceUrl,
      { grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code },
      deadlineAt,
      "Canvas sign in",
      doFetch,
    );
    if (!token.access_token || !token.refresh_token) {
      throw new ClassworkError("Canvas did not return a refresh token", "provider_failed");
    }
    const who = token.user?.global_id ?? (token.user?.id !== undefined ? String(token.user.id) : null);
    if (!who) throw new ClassworkError("Canvas did not say who signed in", "provider_failed");
    return {
      refreshToken: token.refresh_token,
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString(),
      externalUserId: String(who),
      externalDisplay: token.user?.name ?? null,
      scopes: CANVAS_SCOPES,
    };
  },

  async refreshAccessToken({ refreshToken, instanceUrl, deadlineAt, fetch: doFetch }) {
    const { clientId, clientSecret } = credentials();
    const token = await tokenPost(
      instanceUrl,
      { grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken },
      deadlineAt,
      "Canvas",
      doFetch,
    );
    if (!token.access_token) throw new ClassworkError("Canvas needs reconnecting", "reconnect_required");
    return {
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString(),
    };
  },

  async revoke({ refreshToken, instanceUrl, deadlineAt, fetch: doFetch }) {
    // Canvas revokes an access token, so the refresh token buys one last
    // access token whose only job is to be handed back.
    try {
      const { accessToken } = await this.refreshAccessToken({ refreshToken, instanceUrl, deadlineAt, fetch: doFetch });
      await providerFetch(`${base(instanceUrl)}/login/oauth2/token?expire_sessions=1`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${accessToken}` },
        deadlineAt,
        fetch: doFetch,
        label: "Canvas revoke",
      });
    } catch {
      // Best effort by design.
    }
  },

  async listCourses(ctx): Promise<ProviderCourse[]> {
    const out: ProviderCourse[] = [];
    let url: string | null = `${base(ctx.instanceUrl)}/api/v1/courses?enrollment_state=active&per_page=${PER_PAGE}&include[]=term`;
    while (url) {
      const page: { body: Course[]; next: string | null } = await apiGet<Course[]>(ctx, url, "Canvas courses");
      for (const course of page.body ?? []) {
        if (course.workflow_state && course.workflow_state !== "available") continue;
        out.push({
          externalId: String(course.id),
          name: course.name ?? course.course_code ?? "Untitled course",
          url: `${publicBase(ctx.instanceUrl)}/courses/${course.id}`,
          enrollment: enrollmentOf(course),
          section: course.course_code ?? null,
        });
      }
      url = page.next;
    }
    return out;
  },

  async fetchPage(ctx, courseId, cursor): Promise<SyncPage> {
    const phase: Phase = cursor && PHASES.includes(cursor.phase as Phase) ? (cursor.phase as Phase) : "assignments";
    const url = cursor?.pageToken ?? firstUrl(phase, courseId, ctx.instanceUrl);
    const following = (next: string | null): SyncCursor | null => (next ? { phase, pageToken: next } : afterPhase(phase));

    if (phase === "assignments") {
      const page = await apiGet<Assignment[]>(ctx, url, "Canvas assignments");
      const items = (page.body ?? [])
        .filter((a) => a.published !== false && a.workflow_state !== "deleted" && a.workflow_state !== "unpublished")
        .map(assignmentItem);
      return { items, next: following(page.next) };
    }
    if (phase === "announcements") {
      const page = await apiGet<Announcement[]>(ctx, url, "Canvas announcements");
      return { items: (page.body ?? []).map(announcementItem), next: following(page.next) };
    }
    if (phase === "modules") {
      const page = await apiGet<CourseModule[]>(ctx, url, "Canvas modules");
      const items = (page.body ?? []).filter((m) => m.published !== false).map(moduleItem);
      return { items, next: following(page.next) };
    }
    const page = await apiGet<CalendarEvent[]>(ctx, url, "Canvas events");
    const items = (page.body ?? []).filter((e) => e.workflow_state !== "deleted").map(eventItem);
    return { items, next: following(page.next) };
  },

  async publish(): Promise<never> {
    throw new ClassworkError("Writing back to Canvas is not built yet", "not_configured");
  },
};
