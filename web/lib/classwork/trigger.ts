import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The hourly job's bearer, compared without letting its length or its first
 * differing byte show in the timing. Both sides are hashed first, so two
 * strings of any length compare in the same time.
 */
export function bearerMatches(header: string | null | undefined, secret: string): boolean {
  if (!header || !secret) return false;
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  if (!match) return false;
  const given = createHash("sha256").update(match[1]).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(given, expected);
}
