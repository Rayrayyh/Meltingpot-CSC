import type { useClerk } from "@clerk/nextjs";

/** Clerk's browser client, once ClerkProvider has loaded it onto window. */
export type LoadedClerk = ReturnType<typeof useClerk>;

/**
 * Waits for ClerkProvider to have loaded Clerk onto the window. clerk-js
 * arrives from Clerk's Frontend API host some time after hydration, so
 * anything that reads the session, the seam's browser half and the Supabase
 * client's token supplier alike, has to wait for it rather than read
 * window.Clerk and find nothing. Resolves null when the wait runs out.
 */
export async function clerkOnWindow(timeoutMs = 10_000): Promise<LoadedClerk | null> {
  if (typeof window === "undefined") return null;
  // Once a full wait has come up empty (clerk-js blocked, say) every later
  // caller waits a beat rather than the full ten seconds each: a page with
  // several queries on mount used to sit for a minute before failing.
  const deadline = Date.now() + (gaveUpOnce ? Math.min(timeoutMs, 1_000) : timeoutMs);
  for (;;) {
    const instance = (window as unknown as { Clerk?: LoadedClerk }).Clerk;
    if (instance?.loaded) return instance;
    if (Date.now() > deadline) {
      gaveUpOnce = true;
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

let gaveUpOnce = false;
