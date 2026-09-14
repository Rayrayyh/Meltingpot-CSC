import { describe, expect, it, vi } from "vitest";
import { fixtureAdapter } from "@/lib/classwork/fixture";
import { runSync, type RpcResult } from "@/lib/classwork/sync";
import type { ImportedItem } from "@/lib/classwork/types";

function item(id: string, title = id): ImportedItem {
  return {
    externalId: `assignment:${id}`,
    kind: "assignment",
    title,
    description: "",
    dueAt: null,
    dueAllDay: false,
    availableFrom: null,
    postedAt: null,
    url: null,
    materials: [],
    externalUpdatedAt: null,
  };
}

/** A database that remembers what it was told, the way lms_sync_* would. */
function fakeDb(options: { beginError?: string; cursor?: Record<string, unknown> } = {}) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const state = { status: "never", cursor: options.cursor ?? { passStartedAt: "2026-09-05T00:00:00Z" } };
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>): Promise<RpcResult> => {
    calls.push({ fn, args });
    if (fn === "lms_sync_begin") {
      if (options.beginError) return { data: null, error: { message: options.beginError } };
      state.status = "running";
      return {
        data: {
          connectionId: "conn", provider: "google_classroom", instanceUrl: null,
          externalCourseId: "c-bio", refreshToken: "rt", cursor: state.cursor,
        },
        error: null,
      };
    }
    if (fn === "lms_sync_apply") {
      const items = args.p_items as unknown[];
      if (args.p_done) { state.status = "ok"; state.cursor = {}; }
      else state.cursor = { ...(args.p_cursor as object), passStartedAt: "2026-09-05T00:00:00Z" };
      return { data: { inserted: items.length, changed: 0, removed: args.p_done ? 1 : 0 }, error: null };
    }
    if (fn === "lms_sync_finish") { state.status = String(args.p_status); return { data: null, error: null }; }
    return { data: null, error: { message: `unknown ${fn}` } };
  });
  return { rpc, calls, state };
}

const key = "k".repeat(44);

describe("runSync", () => {
  it("walks every page, closes the pass and counts", async () => {
    const db = fakeDb();
    const adapter = fixtureAdapter({ pages: [{ items: [item("1"), item("2")], next: null }, { items: [item("3")], next: null }] });
    const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
    expect(out).toEqual({ status: "ok", inserted: 3, changed: 0, removed: 1 });
    expect(adapter.calls).toEqual(["refresh", "page:0", "page:1"]);
    const applies = db.calls.filter((c) => c.fn === "lms_sync_apply");
    expect(applies.map((c) => c.args.p_done)).toEqual([false, true]);
    expect(applies[0].args.p_cursor).toEqual({ phase: "fixture", pageToken: "1" });
    expect((applies[0].args.p_items as Array<{ contentHash: string }>)[0].contentHash).toHaveLength(64);
    expect(db.state.status).toBe("ok");
  });

  it("stops with a page to spare and leaves the link running with its cursor", async () => {
    const db = fakeDb();
    const adapter = fixtureAdapter({ pages: [{ items: [item("1")], next: null }, { items: [item("2")], next: null }] });
    let t = 0;
    const now = () => (t += 3_000);
    const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: 10_000, now });
    expect(out.status).toBe("partial");
    expect(out.inserted).toBe(1);
    expect(db.state.status).toBe("running");
    expect(db.state.cursor).toEqual({ phase: "fixture", pageToken: "1", passStartedAt: "2026-09-05T00:00:00Z" });
    expect(db.calls.some((c) => c.fn === "lms_sync_finish")).toBe(false);
  });

  it("resumes from a stored cursor rather than starting over", async () => {
    const db = fakeDb({ cursor: { passStartedAt: "2026-09-05T00:00:00Z", phase: "fixture", pageToken: "1" } });
    const adapter = fixtureAdapter({ pages: [{ items: [item("1")], next: null }, { items: [item("2")], next: null }] });
    const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
    expect(out.status).toBe("ok");
    expect(adapter.calls).toEqual(["refresh", "page:1"]);
  });

  it("reports skipped when the database says too soon or in progress, without touching the provider", async () => {
    for (const reason of ["sync_too_soon", "sync_in_progress"]) {
      const db = fakeDb({ beginError: reason });
      const adapter = fixtureAdapter({ pages: [] });
      const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
      expect(out.status).toBe("skipped");
      expect(adapter.calls).toEqual([]);
    }
  });

  it("marks reconnect when the refresh is refused", async () => {
    const db = fakeDb();
    const adapter = fixtureAdapter({ pages: [], refresh: "reconnect" });
    const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
    expect(out.status).toBe("reconnect");
    expect(db.calls.at(-1)).toMatchObject({ fn: "lms_sync_finish", args: { p_status: "reconnect" } });
  });

  it("records an error and keeps the cursor when the provider fails mid pass", async () => {
    const db = fakeDb();
    const adapter = fixtureAdapter({ pages: [{ items: [item("1")], next: null }, { items: [item("2")], next: null }], failPageAt: 1 });
    const out = await runSync("link", false, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
    expect(out.status).toBe("error");
    expect(out.message).toBe("Busy right now");
    expect(out.inserted).toBe(1);
    expect(db.state.status).toBe("error");
    expect(db.state.cursor).toMatchObject({ phase: "fixture", pageToken: "1" });
  });

  it("passes force and the server key through to the database", async () => {
    const db = fakeDb();
    const adapter = fixtureAdapter({ pages: [{ items: [], next: null }] });
    await runSync("link", true, { rpc: db.rpc, adapter, serverKey: key, deadlineAt: Date.now() + 10_000 });
    expect(db.calls[0]).toMatchObject({ fn: "lms_sync_begin", args: { p_force: true, p_server_key: key } });
  });
});
