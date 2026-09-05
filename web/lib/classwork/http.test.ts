import { describe, expect, it, vi } from "vitest";

// server.ts and config.ts import "server-only", which throws outside a server component.
vi.mock("server-only", () => ({}));
import { ClassworkError } from "@/lib/classwork/types";
import { providerFetch } from "@/lib/classwork/http";

function response(status: number, headers: Record<string, string> = {}, body = "{}") {
  return new Response(body, { status, headers });
}

describe("providerFetch", () => {
  it("returns the first good response untouched", async () => {
    const doFetch = vi.fn(async () => response(200, {}, '{"ok":true}'));
    const res = await providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: doFetch, label: "test" });
    expect(await res.json()).toEqual({ ok: true });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 inside the budget and honours Retry-After", async () => {
    const doFetch = vi
      .fn()
      .mockResolvedValueOnce(response(429, { "retry-after": "0" }))
      .mockResolvedValueOnce(response(200));
    const res = await providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: doFetch, label: "test" });
    expect(res.status).toBe(200);
    expect(doFetch).toHaveBeenCalledTimes(2);
  });

  it("treats a Canvas 403 with a quota header as a throttle, and a bare 403 as forbidden", async () => {
    const throttled = vi
      .fn()
      .mockResolvedValueOnce(response(403, { "x-rate-limit-remaining": "0", "retry-after": "0" }))
      .mockResolvedValueOnce(response(200));
    expect((await providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: throttled, label: "t" })).status).toBe(200);

    const forbidden = vi.fn(async () => response(403));
    await expect(providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: forbidden, label: "t" }))
      .rejects.toMatchObject({ code: "forbidden", status: 403 } satisfies Partial<ClassworkError>);
    expect(forbidden).toHaveBeenCalledTimes(1);
  });

  it("never retries a 401, which means reconnect", async () => {
    const doFetch = vi.fn(async () => response(401));
    await expect(providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: doFetch, label: "t" }))
      .rejects.toMatchObject({ code: "reconnect_required" });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 400", async () => {
    const doFetch = vi.fn(async () => response(400));
    await expect(providerFetch("https://p/x", { deadlineAt: Date.now() + 10_000, fetch: doFetch, label: "t" }))
      .rejects.toMatchObject({ code: "provider_failed", status: 400 });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it("gives up with timed_out when the budget is already spent", async () => {
    const doFetch = vi.fn(async () => response(200));
    await expect(providerFetch("https://p/x", { deadlineAt: Date.now() + 100, fetch: doFetch, label: "t" }))
      .rejects.toMatchObject({ code: "timed_out" });
    expect(doFetch).not.toHaveBeenCalled();
  });

  it("aborts a hanging call at the deadline", async () => {
    const doFetch = vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    );
    await expect(providerFetch("https://p/x", { deadlineAt: Date.now() + 1_600, fetch: doFetch as unknown as typeof fetch, label: "t" }))
      .rejects.toMatchObject({ code: "timed_out" });
  });
});
