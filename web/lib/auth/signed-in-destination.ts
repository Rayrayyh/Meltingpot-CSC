import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { safeNextPath } from "@/lib/auth/next-path";

/**
 * Where a signed in person goes when they reach the sign in or sign up page.
 *
 * It is the same place the form's own finish would send them, on purpose.
 * Under Clerk, opening a session refreshes the current route from the
 * server before the form has finished, so the page's redirect and the form's
 * push run at once; if they disagreed, whichever landed last would win and
 * `next` would be lost. Agreeing makes the order irrelevant. A member who
 * arrives with their own class code goes straight in (join_pot_with_code
 * only returns the id for a member); anyone else sees the Pot preview first,
 * as the product rule says, and nothing is written for them here.
 */
export async function signedInDestination(
  supabase: SupabaseClient<Database>,
  code: string,
  next?: string,
): Promise<string> {
  if (code.length === 6) {
    const { data } = await supabase.rpc("lookup_pot_by_code", { p_code: code });
    const found = data as { is_member?: boolean } | null;
    if (found?.is_member) {
      const { data: potId } = await supabase.rpc("join_pot_with_code", { p_code: code });
      if (typeof potId === "string") return `/p/${potId}`;
    }
    return `/join/${code}`;
  }
  return safeNextPath(next) ?? "/home";
}
