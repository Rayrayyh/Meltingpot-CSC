import { getClassworkConfig, providerOrigins } from "@/lib/classwork/config";
import { providerFetch, readJson } from "@/lib/classwork/http";
import { allDayAt, externalId, normaliseItem } from "@/lib/classwork/reconcile";
import {
  ClassworkError,
  type AdapterContext,
  type ClassworkAdapter,
  type ConnectResult,
  type ImportedItem,
  type ImportedMaterial,
  type ProviderCourse,
  type SyncCursor,
  type SyncPage,
} from "@/lib/classwork/types";

/**
 * Google Classroom, read-only.
 *
 * Five scopes, all read-only, none restricted, plus openid and email so the
 * settings panel can say which account is connected. A course is walked in
 * three phases, course work, then materials, then announcements, each paged
 * on the provider's own token, and the cursor the sync stores is exactly
 * that: which phase, which page.
 *
 * Materials come back as links. A Drive file is its alternateLink, which
 * opens in Drive for anyone the teacher shared it with. Nothing is fetched
 * from Drive, because reading a file's content needs a restricted scope.
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.topics.readonly",
];

const PHASES = ["coursework", "materials", "announcements"] as const;
type Phase = (typeof PHASES)[number];
const PAGE_SIZE = 50;

type GoogleMaterial = {
  driveFile?: { driveFile?: { title?: string; alternateLink?: string } };
  youtubeVideo?: { title?: string; alternateLink?: string };
  link?: { url?: string; title?: string };
  form?: { formUrl?: string; title?: string };
};

type CourseWork = {
  id: string;
  title?: string;
  description?: string;
  materials?: GoogleMaterial[];
  state?: string;
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours?: number; minutes?: number };
  workType?: string;
  scheduledTime?: string;
  text?: string;
};

function credentials() {
  const c = getClassworkConfig();
  if (!c.CLASSROOM_OAUTH_CLIENT_ID || !c.CLASSROOM_OAUTH_CLIENT_SECRET) {
    throw new ClassworkError("Google Classroom is not set up on this site", "not_configured");
  }
  return { clientId: c.CLASSROOM_OAUTH_CLIENT_ID, clientSecret: c.CLASSROOM_OAUTH_CLIENT_SECRET };
}

function mapMaterials(materials: GoogleMaterial[] | undefined): ImportedMaterial[] {
  const out: ImportedMaterial[] = [];
  for (const m of materials ?? []) {
    if (m.driveFile?.driveFile?.alternateLink) {
      out.push({ kind: "drive", title: m.driveFile.driveFile.title ?? "Drive file", url: m.driveFile.driveFile.alternateLink });
    } else if (m.youtubeVideo?.alternateLink) {
      out.push({ kind: "youtube", title: m.youtubeVideo.title ?? "Video", url: m.youtubeVideo.alternateLink });
    } else if (m.link?.url) {
      out.push({ kind: "link", title: m.link.title ?? m.link.url, url: m.link.url });
    } else if (m.form?.formUrl) {
      out.push({ kind: "form", title: m.form.title ?? "Form", url: m.form.formUrl });
    }
  }
  return out;
}

function dueOf(work: CourseWork): { dueAt: string | null; dueAllDay: boolean } {
  const d = work.dueDate;
  if (!d) return { dueAt: null, dueAllDay: false };
  if (!work.dueTime) return { dueAt: allDayAt(d.year, d.month, d.day), dueAllDay: true };
  const iso = new Date(
    Date.UTC(d.year, d.month - 1, d.day, work.dueTime.hours ?? 0, work.dueTime.minutes ?? 0),
  ).toISOString();
  return { dueAt: iso, dueAllDay: false };
}

function kindOfWork(work: CourseWork): ImportedItem["kind"] {
  if (work.workType === "SHORT_ANSWER_QUESTION" || work.workType === "MULTIPLE_CHOICE_QUESTION") {
    return "quiz";
  }
  // Classroom has no quiz type of its own: a quiz assignment is an
  // assignment carrying a Google Form, which is how teachers make them.
  if ((work.materials ?? []).some((m) => Boolean(m.form?.formUrl))) return "quiz";
  return "assignment";
}

function courseWorkItem(work: CourseWork): ImportedItem {
  const kind = kindOfWork(work);
  const { dueAt, dueAllDay } = dueOf(work);
  return normaliseItem({
    externalId: externalId(kind, work.id),
    kind,
    title: work.title ?? "Untitled",
    description: work.description ?? "",
    dueAt,
    dueAllDay,
    availableFrom: work.scheduledTime ?? null,
    postedAt: work.creationTime ?? null,
    url: work.alternateLink ?? null,
    materials: mapMaterials(work.materials),
    externalUpdatedAt: work.updateTime ?? null,
  });
}

function materialItem(work: CourseWork): ImportedItem {
  return normaliseItem({
    externalId: externalId("material", work.id),
    kind: "material",
    title: work.title ?? "Untitled",
    description: work.description ?? "",
    dueAt: null,
    dueAllDay: false,
    availableFrom: work.scheduledTime ?? null,
    postedAt: work.creationTime ?? null,
    url: work.alternateLink ?? null,
    materials: mapMaterials(work.materials),
    externalUpdatedAt: work.updateTime ?? null,
  });
}

function announcementItem(work: CourseWork): ImportedItem {
  const text = (work.text ?? "").trim();
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  return normaliseItem({
    externalId: externalId("announcement", work.id),
    kind: "announcement",
    title: firstLine.length > 0 ? firstLine.slice(0, 120) : "Announcement",
    description: text,
    dueAt: null,
    dueAllDay: false,
    availableFrom: work.scheduledTime ?? null,
    postedAt: work.creationTime ?? null,
    url: work.alternateLink ?? null,
    materials: mapMaterials(work.materials),
    externalUpdatedAt: work.updateTime ?? null,
  });
}

function nextCursor(phase: Phase, pageToken: string | undefined): SyncCursor | null {
  if (pageToken) return { phase, pageToken };
  const i = PHASES.indexOf(phase);
  return i + 1 < PHASES.length ? { phase: PHASES[i + 1], pageToken: null } : null;
}

async function apiGet<T>(ctx: AdapterContext, path: string, label: string): Promise<T> {
  const res = await providerFetch(`${providerOrigins().googleApi}${path}`, {
    method: "GET",
    headers: { authorization: `Bearer ${ctx.accessToken}` },
    deadlineAt: ctx.deadlineAt,
    fetch: ctx.fetch,
    label,
  });
  return readJson<T>(res, label);
}

async function tokenPost<T>(
  body: Record<string, string>,
  deadlineAt: number,
  label: string,
  doFetch?: typeof fetch,
): Promise<T> {
  const res = await providerFetch(providerOrigins().googleToken, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    deadlineAt,
    fetch: doFetch,
    label,
  }).catch((error: unknown) => {
    // A refresh token Google no longer honours comes back as 400 invalid_grant,
    // which providerFetch reports as a plain failure. Here it means reconnect.
    if (error instanceof ClassworkError && error.status === 400 && body.grant_type === "refresh_token") {
      throw new ClassworkError("Google Classroom needs reconnecting", "reconnect_required", 400);
    }
    throw error;
  });
  return readJson<T>(res, label);
}

function decodeIdToken(idToken: string | undefined): { sub: string; email?: string; name?: string } | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      name?: string;
    };
    return payload.sub ? { sub: payload.sub, email: payload.email, name: payload.name } : null;
  } catch {
    return null;
  }
}

export const googleClassroomAdapter: ClassworkAdapter = {
  provider: "google_classroom",

  authorizeUrl({ state, redirectUri }) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return `${providerOrigins().googleAuth}?${params.toString()}`;
  },

  async exchangeCode({ code, redirectUri, deadlineAt, fetch: doFetch }): Promise<ConnectResult> {
    const { clientId, clientSecret } = credentials();
    const token = await tokenPost<{
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      id_token?: string;
    }>(
      { code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" },
      deadlineAt,
      "Google sign in",
      doFetch,
    );
    if (!token.access_token || !token.refresh_token) {
      throw new ClassworkError("Google did not return a refresh token", "provider_failed");
    }
    const who = decodeIdToken(token.id_token);
    if (!who) throw new ClassworkError("Google did not say who signed in", "provider_failed");
    return {
      refreshToken: token.refresh_token,
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString(),
      externalUserId: who.sub,
      externalDisplay: who.email ?? who.name ?? null,
      scopes: (token.scope ?? "").split(" ").filter(Boolean),
    };
  },

  async refreshAccessToken({ refreshToken, deadlineAt, fetch: doFetch }) {
    const { clientId, clientSecret } = credentials();
    const token = await tokenPost<{ access_token?: string; expires_in?: number }>(
      { refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" },
      deadlineAt,
      "Google Classroom",
      doFetch,
    );
    if (!token.access_token) throw new ClassworkError("Google Classroom needs reconnecting", "reconnect_required");
    return {
      accessToken: token.access_token,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString(),
    };
  },

  async revoke({ refreshToken, deadlineAt, fetch: doFetch }) {
    await providerFetch(`${providerOrigins().googleRevoke}?token=${encodeURIComponent(refreshToken)}`, {
      method: "POST",
      deadlineAt,
      fetch: doFetch,
      label: "Google revoke",
    }).catch(() => undefined);
  },

  async listCourses(ctx): Promise<ProviderCourse[]> {
    type Course = { id: string; name?: string; section?: string; alternateLink?: string; courseState?: string };
    const out = new Map<string, ProviderCourse>();
    for (const role of ["studentId", "teacherId"] as const) {
      let pageToken: string | undefined;
      do {
        const params = new URLSearchParams({ [role]: "me", courseStates: "ACTIVE", pageSize: String(PAGE_SIZE) });
        if (pageToken) params.set("pageToken", pageToken);
        const page = await apiGet<{ courses?: Course[]; nextPageToken?: string }>(
          ctx,
          `/courses?${params.toString()}`,
          "Google Classroom courses",
        );
        for (const c of page.courses ?? []) {
          out.set(c.id, {
            externalId: c.id,
            name: c.name ?? "Untitled course",
            url: c.alternateLink ?? null,
            enrollment: role === "teacherId" ? "teacher" : (out.get(c.id)?.enrollment ?? "student"),
            section: c.section ?? null,
          });
        }
        pageToken = page.nextPageToken;
      } while (pageToken);
    }
    return [...out.values()];
  },

  async fetchPage(ctx, courseId, cursor): Promise<SyncPage> {
    const phase: Phase = (cursor?.phase as Phase) && PHASES.includes(cursor!.phase as Phase) ? (cursor!.phase as Phase) : "coursework";
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) });
    if (cursor?.pageToken) params.set("pageToken", cursor.pageToken);
    const course = encodeURIComponent(courseId);

    if (phase === "coursework") {
      params.set("courseWorkStates", "PUBLISHED");
      const page = await apiGet<{ courseWork?: CourseWork[]; nextPageToken?: string }>(
        ctx,
        `/courses/${course}/courseWork?${params.toString()}`,
        "Google Classroom course work",
      );
      return { items: (page.courseWork ?? []).map(courseWorkItem), next: nextCursor(phase, page.nextPageToken) };
    }
    if (phase === "materials") {
      params.set("courseWorkMaterialStates", "PUBLISHED");
      const page = await apiGet<{ courseWorkMaterial?: CourseWork[]; nextPageToken?: string }>(
        ctx,
        `/courses/${course}/courseWorkMaterials?${params.toString()}`,
        "Google Classroom materials",
      );
      return { items: (page.courseWorkMaterial ?? []).map(materialItem), next: nextCursor(phase, page.nextPageToken) };
    }
    params.set("announcementStates", "PUBLISHED");
    const page = await apiGet<{ announcements?: CourseWork[]; nextPageToken?: string }>(
      ctx,
      `/courses/${course}/announcements?${params.toString()}`,
      "Google Classroom announcements",
    );
    return { items: (page.announcements ?? []).map(announcementItem), next: nextCursor(phase, page.nextPageToken) };
  },

  async publish(): Promise<never> {
    throw new ClassworkError("Writing back to Google Classroom is not built yet", "not_configured");
  },
};
