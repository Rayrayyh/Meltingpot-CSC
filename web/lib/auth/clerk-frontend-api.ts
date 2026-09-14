/**
 * The host Clerk's browser SDK talks to, read off the publishable key.
 *
 * A publishable key is `pk_test_` or `pk_live_` followed by the Frontend API
 * host, base64 encoded with a trailing `$`. The content security policy in
 * next.config.ts needs that host spelled out for scripts, connections and
 * frames, and reading it from the key means one variable to set rather than
 * two that can disagree.
 */
export function clerkFrontendApiHost(publishableKey: string | undefined): string | null {
  if (!publishableKey) return null;
  const match = /^pk_(?:test|live)_([A-Za-z0-9+/=_-]+)$/.exec(publishableKey.trim());
  if (!match) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    return null;
  }
  const host = decoded.replace(/\$$/, "").trim();
  // A host and nothing else: no scheme, no path, no characters a policy
  // could not carry.
  if (!/^[a-z0-9.-]+$/i.test(host)) return null;
  return host;
}

/**
 * The origins a policy must allow for Clerk to load and sign people in. The
 * lists follow the SDK's own defaults (@clerk/nextjs, content-security-policy)
 * minus telemetry, which the root layout turns off rather than allows.
 */
export function clerkPolicyOrigins(publishableKey: string | undefined): {
  script: string[];
  connect: string[];
  frame: string[];
  img: string[];
  worker: string[];
} {
  const host = clerkFrontendApiHost(publishableKey);
  if (!host) return { script: [], connect: [], frame: [], img: [], worker: [] };
  const api = `https://${host}`;
  // Clerk's bot check is a Cloudflare Turnstile widget, loaded in a frame,
  // and its own protection service sits behind the protect host.
  const turnstile = "https://challenges.cloudflare.com";
  const protect = "https://*.protect.clerk.com";
  return {
    script: [api, turnstile, protect],
    connect: [api, `${protect}:*`],
    frame: [turnstile, protect],
    img: ["https://img.clerk.com"],
    // clerk-js keeps the session token fresh from a worker made out of a blob;
    // refused, it falls back to a timer that background tabs throttle.
    worker: ["blob:"],
  };
}
