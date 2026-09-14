import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// server.ts and providers.ts import "server-only", which throws outside a
// server component. Same shim retry.test.ts uses.
vi.mock("server-only", () => ({}));

import { generateStructured, MixError } from "@/lib/mix/server";

/**
 * What happens when the primary mixer says it is full.
 *
 * The rule the study route relies on: a capacity refusal is somebody else's to
 * answer, a rejected key is ours. These tests pin both sides of that, and the
 * budget split that keeps the standby able to start at all.
 */
const ORIGINAL_ENV = { ...process.env };

const GOOGLE = "generativelanguage.googleapis.com";
const OPENAI = "api.openai.com";

/** A primary reply, in the shape the interactions endpoint returns. */
const primaryUsable = {
  steps: [{ type: "model_output", content: [{ type: "text", text: '{"from":"primary"}' }] }],
};

/** A standby reply, in the shape chat completions returns. */
const standbyUsable = {
  choices: [{ message: { content: '{"from":"standby"}' } }],
};

function reply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Response;
}

/** Routes each call by host, so a test says what each mixer answered. */
function twoMixers(primary: () => Response, standby: () => Response) {
  const impl = (url: string, init?: RequestInit): Promise<Response> => {
    void init;
    if (String(url).includes(OPENAI)) return Promise.resolve(standby());
    if (String(url).includes(GOOGLE)) return Promise.resolve(primary());
    throw new Error(`unexpected host: ${url}`);
  };
  return vi.fn(impl);
}

const callsTo = (mock: ReturnType<typeof vi.fn>, host: string) =>
  mock.mock.calls.filter((call) => String(call[0]).includes(host)).length;

describe("failing over to the standby mixer", () => {
  beforeEach(() => {
    process.env.MODEL_API_KEY = "primary-key";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  function configureStandby() {
    process.env.FALLBACK_MODEL_API_KEY = "standby-key";
    process.env.FALLBACK_FAST_MODEL = "standby-model";
  }

  function ask(allowFallback: boolean) {
    return generateStructured<{ from: string }>({
      model: "primary-model",
      instruction: "make something",
      parts: [{ type: "text", text: "notes" }],
      schema: { type: "object" },
      deadlineAt: Date.now() + 22_000,
      allowFallback,
    });
  }

  async function run<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => {});
    await vi.runAllTimersAsync();
    return promise;
  }

  it("never touches the standby while the primary is answering", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(200, primaryUsable),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).resolves.toEqual({ from: "primary" });
    expect(callsTo(fetchMock, GOOGLE)).toBe(1);
    expect(callsTo(fetchMock, OPENAI)).toBe(0);
  });

  it("hands a full pot to the standby, and the caller never knows", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).resolves.toEqual({ from: "standby" });
    expect(callsTo(fetchMock, OPENAI)).toBe(1);
  });

  it("leaves the primary attempts short so the standby can still start", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await run(ask(true));
    // Four rounds of backoff is right with nowhere to go and wrong with
    // somewhere. Two is enough to ride out one unlucky refusal.
    expect(callsTo(fetchMock, GOOGLE)).toBe(2);
  });

  it("does not fail over on a rejected key, which would fail the same way", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(403, { error: { message: "key rejected" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).rejects.toThrow(MixError);
    expect(callsTo(fetchMock, OPENAI)).toBe(0);
  });

  it("does not fail over when the mixer answered and the answer was unusable", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(200, { steps: [] }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).rejects.toThrow("The mixer returned nothing usable");
    expect(callsTo(fetchMock, OPENAI)).toBe(0);
  });

  it("stays on the primary when the route has not opted in", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(false))).rejects.toThrow(MixError);
    expect(callsTo(fetchMock, OPENAI)).toBe(0);
    // Nowhere to go means the full four attempts, exactly as before.
    expect(callsTo(fetchMock, GOOGLE)).toBe(4);
  });

  it("stays on the primary when no standby is configured", async () => {
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).rejects.toThrow(MixError);
    expect(callsTo(fetchMock, OPENAI)).toBe(0);
    expect(callsTo(fetchMock, GOOGLE)).toBe(4);
  });

  it("reports the standby's failure when both are full", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(429, { error: { message: "standby is rate limited" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(run(ask(true))).rejects.toThrow("standby is rate limited");
  });

  it("sends the standby the schema, since it is asked for JSON rather than bound to it", async () => {
    configureStandby();
    const fetchMock = twoMixers(
      () => reply(503, { error: { message: "model is overloaded" } }),
      () => reply(200, standbyUsable),
    );
    vi.stubGlobal("fetch", fetchMock);

    await run(ask(true));
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes(OPENAI));
    const body = JSON.parse(String(call?.[1]?.body));
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain("JSON");
    expect(body.messages[0].content).toContain('"type":"object"');
    expect(body.model).toBe("standby-model");
  });
});
