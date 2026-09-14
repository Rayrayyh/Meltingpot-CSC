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
 * A redirect within the site. On Netlify's Next runtime both request.url and
 * nextUrl carry the deploy's internal permalink host, so a Location built
 * from either sends a person to a host where their session cookie does not
 * exist (lesson 014). With APP_ORIGIN set the Location is absolute on the
 * site's own address; without it the Location is relative, which every
 * browser resolves against the host the person is actually on.
 */
export function redirectTo(path: string): NextResponse {
  const configured = getClassworkConfig().APP_ORIGIN;
  const location = configured ? new URL(path, `${configured.replace(/\/$/, "")}/`).toString() : path;
  return new NextResponse(null, { status: 307, headers: { location } });
}

/** Whether the person reached us over https, for the cookies a redirect sets. */
export function overHttps(request: NextRequest): boolean {
  const forwarded = request.headers.get("x-forwarded-proto") ?? "";
  return request.nextUrl.protocol === "https:" || forwarded.split(",")[0].trim() === "https";
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
