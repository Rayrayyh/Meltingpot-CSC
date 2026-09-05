import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getClassworkConfig } from "@/lib/classwork/config";
import { ClassworkError } from "@/lib/classwork/types";
import type { SyncRpc } from "@/lib/classwork/sync";

/**
 * What the classwork routes share: the server key, a way to call the keyed
 * functions by name, and one mapping from what went wrong to what the browser
 * is told. Provider error text never reaches a reply; the codes below are the
 * whole vocabulary.
 */

/** The nonce the connect route sets and the callback route checks. */
export const NONCE_COOKIE = "mp-classwork-nonce";
export const NONCE_COOKIE_PATH = "/api/classwork/callback";

/**
 * The address a redirect should carry. On Netlify's Next runtime request.url
 * is the deploy's internal permalink host, so a Location built from it sends
 * a person to a host where their session cookie does not exist. APP_ORIGIN
 * is the site's own address and wins; failing that, nextUrl, which Next
 * builds from the forwarded host, the way proxy.ts already redirects.
 */
export function siteOrigin(request: NextRequest): string {
  const configured = getClassworkConfig().APP_ORIGIN;
  return configured ? configured.replace(/\/$/, "") : request.nextUrl.origin;
}

export function serverKey(): string {
  const key = getClassworkConfig().CLASSWORK_SERVER_KEY;
  if (!key) throw new ClassworkError("Classwork is not set up on this site", "not_configured");
  return key;
}

/** The keyed functions are called by name; the names are the SQL's. */
export function rpcFor(supabase: SupabaseClient<Database>): SyncRpc {
  return async (fn, args) => {
    const result = await supabase.rpc(fn as "lms_sync_finish", args as never);
    return {
      data: result.data as unknown,
      error: result.error ? { message: result.error.message } : null,
    };
  };
}

/** A bare snake_case reason from a definer function, or null. */
export function rpcReason(message: string): string | null {
  const match = message.match(/\b(not_authenticated|not_authorised|rate_limited|reconnect_required|sync_too_soon|sync_in_progress|link_not_found|connection_not_found|pot_archived|course_invalid|not_pot_maintainer)\b/);
  return match ? match[1] : null;
}

export function classworkErrorResponse(error: unknown): NextResponse {
  if (error instanceof ClassworkError) {
    const reason = rpcReason(error.message);
    if (reason) return reasonResponse(reason);
    const status =
      error.code === "not_configured" ? 503
        : error.code === "reconnect_required" ? 409
          : error.code === "rate_limited" ? 429
            : error.code === "timed_out" ? 504
              : error.code === "forbidden" ? 403
                : 502;
    return NextResponse.json({ error: error.code }, { status });
  }
  return NextResponse.json({ error: "classwork_failed" }, { status: 502 });
}

export function reasonResponse(reason: string): NextResponse {
  const status =
    reason === "not_authenticated" ? 401
      : reason === "not_authorised" || reason === "not_pot_maintainer" ? 403
        : reason === "link_not_found" || reason === "connection_not_found" ? 404
          : reason === "rate_limited" ? 429
            : reason === "reconnect_required" || reason === "pot_archived" ? 409
              : 400;
  return NextResponse.json({ error: reason }, { status });
}
