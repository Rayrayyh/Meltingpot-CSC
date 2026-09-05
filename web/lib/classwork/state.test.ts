import { describe, expect, it } from "vitest";
import { newNonce, signState, verifyState } from "@/lib/classwork/state";

const secret = "a".repeat(40);
const payload = { uid: "u1", provider: "google_classroom", nonce: newNonce(), iat: 1_000_000, next: "/me/settings" };

describe("OAuth state", () => {
  it("round trips a signed payload", () => {
    const token = signState(payload, secret);
    const result = verifyState(token, secret, 1_000_500);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload).toEqual(payload);
  });

  it("refuses a tampered body", () => {
    const token = signState(payload, secret);
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...payload, uid: "u2" })).toString("base64url");
    expect(verifyState(`${forged}.${mac}`, secret, 1_000_500)).toEqual({ ok: false, reason: "signature" });
    expect(verifyState(`${body}.${mac}x`, secret, 1_000_500).ok).toBe(false);
  });

  it("refuses the wrong secret", () => {
    const token = signState(payload, secret);
    expect(verifyState(token, "b".repeat(40), 1_000_500)).toEqual({ ok: false, reason: "signature" });
  });

  it("expires after ten minutes and refuses a future stamp", () => {
    const token = signState(payload, secret);
    expect(verifyState(token, secret, 1_000_000 + 10 * 60 * 1000 + 1)).toEqual({ ok: false, reason: "expired" });
    expect(verifyState(token, secret, 1_000_000 - 120_000)).toEqual({ ok: false, reason: "expired" });
  });

  it("calls garbage malformed", () => {
    expect(verifyState("nodot", secret)).toEqual({ ok: false, reason: "malformed" });
    expect(verifyState(".", secret)).toEqual({ ok: false, reason: "malformed" });
  });

  it("makes a fresh nonce each time", () => {
    expect(newNonce()).not.toEqual(newNonce());
    expect(newNonce()).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });
});
