import { NextResponse } from "next/server";
import { z } from "zod";
import { getClassworkAdapter } from "@/lib/classwork";
import { classworkErrorResponse, reasonResponse, rpcReason, serverKey } from "@/lib/classwork/route-helpers";
import { parseOrNull, uuidSchema } from "@/lib/validation/inputs";
import { getAuthUser } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";

export const maxDuration = 26;
const REVOKE_BUDGET_MS = 6_000;

/**
 * Disconnecting is one database transaction (the secret, the connection, by
 * cascade every link and item) and then a best effort word to the provider
 * to revoke the token. The provider refusing changes nothing here: the token
 * is already gone from Vault, and a person can revoke at the provider too.
 */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = parseOrNull(z.object({ connectionId: uuidSchema }), await request.json().catch(() => null));
  if (!body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { data: connection } = await supabase
    .from("lms_connections")
    .select("id, provider, instance_url")
    .eq("id", body.connectionId)
    .maybeSingle();
  if (!connection) return NextResponse.json({ error: "connection_not_found" }, { status: 404 });

  try {
    const { data: token, error } = await supabase.rpc("lms_disconnect", {
      p_connection_id: connection.id,
      p_server_key: serverKey(),
    });
    if (error) {
      const reason = rpcReason(error.message);
      return reason ? reasonResponse(reason) : NextResponse.json({ error: "classwork_failed" }, { status: 502 });
    }
    if (token) {
      try {
        await getClassworkAdapter(connection.provider).revoke({
          refreshToken: token,
          instanceUrl: connection.instance_url ?? undefined,
          deadlineAt: Date.now() + REVOKE_BUDGET_MS,
        });
      } catch {
        // Best effort by design; see above.
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return classworkErrorResponse(error);
  }
}
