import { toPayload } from "@/lib/classwork/reconcile";
import { ClassworkError, type ClassworkAdapter, type SyncCursor } from "@/lib/classwork/types";

/**
 * One sync pass, or as much of one as the budget allows.
 *
 * The database owns the pass: lms_sync_begin claims the link and hands back
 * the token and the cursor, lms_sync_apply lands one page and either stores
 * the cursor or closes the pass, lms_sync_finish records an outcome the pass
 * could not record itself. This code walks the provider between those calls,
 * inside an absolute deadline shared with every request it makes, and stops
 * with a page to spare rather than be severed mid-page. A pass cut short is
 * "partial": the link stays running with its cursor, and the next trigger
 * carries on from there. Removal is decided only when a pass completes.
 */
export type RpcResult = { data: unknown; error: { message: string } | null };
export type SyncRpc = (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;

export type SyncDeps = {
  rpc: SyncRpc;
  adapter: ClassworkAdapter;
  serverKey: string;
  deadlineAt: number;
  fetch?: typeof fetch;
  now?: () => number;
  /**
   * Which doors land a page and record an outcome. A person's request uses
   * the lms_sync_* doors, which ask who is calling; the hourly job has no
   * person and uses the keyed lms_cron_* doors from 0052.
   */
  fns?: { apply: string; finish: string };
};

const PERSON_DOORS = { apply: "lms_sync_apply", finish: "lms_sync_finish" };

export type SyncOutcome = {
  status: "ok" | "partial" | "skipped" | "reconnect" | "error";
  inserted: number;
  changed: number;
  removed: number;
  message?: string;
};

/** What lms_sync_begin and lms_sync_claim_due hand the engine for one pass. */
export type BeginPayload = {
  connectionId: string;
  provider: string;
  instanceUrl: string | null;
  externalCourseId: string;
  refreshToken: string;
  cursor: { passStartedAt?: string; phase?: string; pageToken?: string | null };
};

/** Leave this much for the apply call and the reply. */
const PAGE_RESERVE_MS = 4_000;

/**
 * What lands in sync_error, which every member of a linked Pot can read. Only
 * phrases this codebase wrote get through; a provider's own error text, or a
 * stack's, is not the class's business.
 */
function messageOf(error: unknown): string {
  if (error instanceof ClassworkError) return error.message;
  return "Something went wrong";
}

/** A person's pass: claim the link through lms_sync_begin, then run it. */
export async function runSync(linkId: string, force: boolean, deps: SyncDeps): Promise<SyncOutcome> {
  const counts = { inserted: 0, changed: 0, removed: 0 };
  const begun = await deps.rpc("lms_sync_begin", {
    p_link_id: linkId,
    p_force: force,
    p_server_key: deps.serverKey,
  });
  if (begun.error) {
    const m = begun.error.message;
    if (m.includes("sync_too_soon") || m.includes("sync_in_progress")) {
      return { status: "skipped", ...counts };
    }
    if (m.includes("reconnect_required")) return { status: "reconnect", ...counts };
    throw new ClassworkError(m, "provider_failed");
  }
  return runPass(linkId, begun.data as BeginPayload, deps);
}

/**
 * The pass itself, for a link already claimed: refresh the token, walk pages
 * until done or out of time, record how it went. Shared by a person's request
 * and the hourly job, which differ only in how the link was claimed and which
 * doors they land pages through.
 */
export async function runPass(linkId: string, begin: BeginPayload, deps: SyncDeps): Promise<SyncOutcome> {
  const now = deps.now ?? Date.now;
  const doors = deps.fns ?? PERSON_DOORS;
  const counts = { inserted: 0, changed: 0, removed: 0 };

  const finish = async (status: "ok" | "error" | "reconnect", message: string | null) => {
    await deps.rpc(doors.finish, {
      p_link_id: linkId,
      p_status: status,
      p_error: message,
      p_server_key: deps.serverKey,
    });
  };

  let accessToken: string;
  try {
    const refreshed = await deps.adapter.refreshAccessToken({
      refreshToken: begin.refreshToken,
      instanceUrl: begin.instanceUrl ?? undefined,
      deadlineAt: deps.deadlineAt,
      fetch: deps.fetch,
    });
    accessToken = refreshed.accessToken;
  } catch (error) {
    const reconnect = error instanceof ClassworkError && error.code === "reconnect_required";
    await finish(reconnect ? "reconnect" : "error", messageOf(error));
    return { status: reconnect ? "reconnect" : "error", ...counts, message: messageOf(error) };
  }

  const ctx = {
    accessToken,
    instanceUrl: begin.instanceUrl ?? undefined,
    deadlineAt: deps.deadlineAt,
    fetch: deps.fetch,
  };
  let cursor: SyncCursor | null = begin.cursor.phase
    ? { phase: begin.cursor.phase, pageToken: begin.cursor.pageToken ?? null }
    : null;

  try {
    while (deps.deadlineAt - now() > PAGE_RESERVE_MS) {
      const page = await deps.adapter.fetchPage(ctx, begin.externalCourseId, cursor);
      const done = page.next === null;
      const applied = await deps.rpc(doors.apply, {
        p_link_id: linkId,
        p_items: page.items.map(toPayload),
        p_cursor: page.next ?? {},
        p_done: done,
        p_server_key: deps.serverKey,
      });
      if (applied.error) throw new ClassworkError(applied.error.message, "provider_failed");
      const c = applied.data as { inserted?: number; changed?: number; removed?: number };
      counts.inserted += c.inserted ?? 0;
      counts.changed += c.changed ?? 0;
      counts.removed += c.removed ?? 0;
      if (done) return { status: "ok", ...counts };
      cursor = page.next;
    }
    // Out of time with pages left. The last apply stored the cursor and the
    // link is still running; the next trigger continues from there.
    return { status: "partial", ...counts };
  } catch (error) {
    const reconnect = error instanceof ClassworkError && error.code === "reconnect_required";
    const message = messageOf(error);
    await finish(reconnect ? "reconnect" : "error", message);
    return { status: reconnect ? "reconnect" : "error", ...counts, message };
  }
}
