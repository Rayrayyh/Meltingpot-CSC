"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { clerkOnWindow } from "@/lib/auth/clerk-window";
import { usingClerk } from "@/lib/auth/provider";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Clerk's session token, when Clerk is the provider; Supabase trusts it
 * through third-party auth. It waits for clerk-js, which arrives some time
 * after hydration: a query that runs on mount would otherwise go out under the
 * anon key and be refused by every policy, silently.
 */
async function clerkToken(): Promise<string | null> {
  const instance = await clerkOnWindow();
  return (await instance?.session?.getToken()) ?? null;
}

export function supabaseBrowser() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // With a token supplier set, supabase-js sends that token and refuses its
    // own auth calls, which under Clerk nothing makes: identity lives behind
    // lib/auth. Without one the client is exactly what it always was.
    usingClerk() ? { accessToken: clerkToken } : undefined,
  );
  return client;
}
