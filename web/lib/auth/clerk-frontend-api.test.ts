import { describe, expect, it } from "vitest";
import { clerkFrontendApiHost, clerkPolicyOrigins } from "./clerk-frontend-api";

// A key of the documented shape: pk_test_ + base64("<host>$").
const key = (host: string) => `pk_test_${Buffer.from(`${host}$`).toString("base64")}`;

describe("clerkFrontendApiHost", () => {
  it("reads the Frontend API host out of a publishable key", () => {
    expect(clerkFrontendApiHost(key("clever-otter-12.clerk.accounts.dev"))).toBe(
      "clever-otter-12.clerk.accounts.dev",
    );
    expect(clerkFrontendApiHost(`pk_live_${Buffer.from("clerk.meltingpot.io$").toString("base64")}`)).toBe(
      "clerk.meltingpot.io",
    );
  });

  it("refuses anything that is not a key, or not a bare host", () => {
    expect(clerkFrontendApiHost(undefined)).toBeNull();
    expect(clerkFrontendApiHost("")).toBeNull();
    expect(clerkFrontendApiHost("sk_test_notapublishablekey")).toBeNull();
    expect(clerkFrontendApiHost(`pk_test_${Buffer.from("https://evil.test/path$").toString("base64")}`)).toBeNull();
  });
});

describe("clerkPolicyOrigins", () => {
  it("names the Frontend API, the bot check and the avatar host, and nothing without a key", () => {
    const origins = clerkPolicyOrigins(key("clever-otter-12.clerk.accounts.dev"));
    expect(origins.script).toEqual([
      "https://clever-otter-12.clerk.accounts.dev",
      "https://challenges.cloudflare.com",
      "https://*.protect.clerk.com",
    ]);
    expect(origins.connect).toEqual(["https://clever-otter-12.clerk.accounts.dev", "https://*.protect.clerk.com:*"]);
    expect(origins.frame).toEqual(["https://challenges.cloudflare.com", "https://*.protect.clerk.com"]);
    expect(origins.img).toEqual(["https://img.clerk.com"]);
    expect(origins.worker).toEqual(["blob:"]);
    expect(clerkPolicyOrigins(undefined)).toEqual({ script: [], connect: [], frame: [], img: [], worker: [] });
  });
});
