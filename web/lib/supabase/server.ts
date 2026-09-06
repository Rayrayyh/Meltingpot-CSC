import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { usingClerk } from "@/lib/auth/provider";

/** Clerk's session token for this request, when Clerk is the provider. */
async function clerkToken(): Promise<string | null> {
  const { auth } = await import("@clerk/nextjs/server");
  return (await auth()).getToken();
}

/**
 * Server-side Supabase client bound to the request cookies. Server
 * Components cannot write cookies; session refresh happens in proxy.ts.
 *
 * Under Clerk the cookies carry no Supabase session; the client instead
 * sends Clerk's token, which Supabase verifies through third-party auth, and
 * public.current_uid() (migration 0054) turns its subject into the profile
 * id every policy keys on. That client is built from supabase-js directly:
 * the ssr wrapper subscribes to auth events as it constructs, and supabase-js
 * refuses every auth call once a token supplier is set, so the two cannot be
 * combined (lib/supabase/access-token.test.ts holds that fact). Nothing is
 * lost; the wrapper exists to move a Supabase session between cookies, and
 * under Clerk there is none.
 */
export const supabaseServer = cache(async function supabaseServer(): Promise<SupabaseClient<Database>> {
  if (usingClerk()) {
    return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: clerkToken,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component; proxy.ts handles refresh.
          }
        },
      },
    },
  );
});
