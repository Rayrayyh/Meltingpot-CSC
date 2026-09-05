import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The OAuth state parameter, signed.
 *
 * It carries who started the flow, for which provider, a nonce that is also
 * set as an httpOnly cookie, when it was minted, and where to return. The
 * callback verifies the signature, the age, that the nonce matches the cookie
 * and that the person signed in is the person who started, so a code cannot be
 * bound to someone else's account and a stale link cannot be replayed.
 */
export type StatePayload = {
  uid: string;
  provider: string;
  nonce: string;
  iat: number;
  next?: string;
};

const MAX_AGE_MS = 10 * 60 * 1000;

function b64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export function newNonce(): string {
  return b64url(randomBytes(16));
}

export function signState(payload: StatePayload, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const mac = createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

export type VerifyResult =
  | { ok: true; payload: StatePayload }
  | { ok: false; reason: "malformed" | "signature" | "expired" };

export function verifyState(
  token: string,
  secret: string,
  now: number = Date.now(),
  maxAgeMs: number = MAX_AGE_MS,
): VerifyResult {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };
  const body = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = createHmac("sha256", secret).update(body).digest();
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "signature" };
  }
  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload.uid !== "string" ||
    typeof payload.provider !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.iat !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (now - payload.iat > maxAgeMs || payload.iat > now + 60_000) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
