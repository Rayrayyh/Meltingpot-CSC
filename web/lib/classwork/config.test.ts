import { describe, expect, it, vi } from "vitest";

// server.ts and config.ts import "server-only", which throws outside a server component.
vi.mock("server-only", () => ({}));
import { classworkAvailability, getClassworkConfig, providerOrigins, redirectUriFor } from "@/lib/classwork/config";

const full = {
  APP_ORIGIN: "https://meltingpot-csc.netlify.app",
  CLASSWORK_STATE_SECRET: "s".repeat(44),
  CLASSWORK_SERVER_KEY: "k".repeat(44),
  CLASSROOM_OAUTH_CLIENT_ID: "id",
  CLASSROOM_OAUTH_CLIENT_SECRET: "secret",
  CANVAS_OAUTH_CLIENT_ID: "cid",
  CANVAS_OAUTH_CLIENT_SECRET: "csecret",
  CANVAS_INSTANCE_URL: "https://school.instructure.com",
};

describe("classwork config", () => {
  it("reports nothing available on a bare deployment", () => {
    expect(classworkAvailability({})).toEqual({ google_classroom: false, canvas: false });
  });

  it("needs the shared secrets before either provider counts as set up", () => {
    const { CLASSWORK_SERVER_KEY: _, ...withoutKey } = full;
    void _;
    expect(classworkAvailability(withoutKey)).toEqual({ google_classroom: false, canvas: false });
    expect(classworkAvailability(full)).toEqual({ google_classroom: true, canvas: true });
  });

  it("treats a malformed value as unset rather than throwing", () => {
    expect(getClassworkConfig({ APP_ORIGIN: "not a url" })).toEqual({});
    expect(getClassworkConfig({ CLASSWORK_SERVER_KEY: "  " })).toEqual({});
  });

  it("builds redirect URIs from APP_ORIGIN only", () => {
    expect(redirectUriFor("canvas", { ...full, APP_ORIGIN: "https://x.example/" })).toBe(
      "https://x.example/api/classwork/callback/canvas",
    );
    expect(() => redirectUriFor("canvas", {})).toThrow();
  });

  it("points both providers at the stub in stub mode and nowhere else otherwise", () => {
    const live = providerOrigins(full);
    expect(live.googleApi).toBe("https://classroom.googleapis.com/v1");
    expect(live.canvas("https://school.instructure.com/")).toBe("https://school.instructure.com");
    const stub = providerOrigins({ ...full, CLASSWORK_PROVIDER_MODE: "stub", CLASSWORK_STUB_ORIGIN: "http://localhost:3112" });
    expect(stub.googleToken).toBe("http://localhost:3112/google/token");
    expect(stub.canvas("https://school.instructure.com")).toBe("http://localhost:3112/canvas");
  });
});
