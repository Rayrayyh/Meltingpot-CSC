import { NextResponse } from "next/server";
import { z } from "zod";
import { getClassworkAdapter } from "@/lib/classwork";
import { classworkErrorResponse, reasonResponse, rpcReason, serverKey } from "@/lib/classwork/route-helpers";
import { ClassworkError } from "@/lib/classwork/types";
import { parseOrNull, uuidSchema } from "@/lib/validation/inputs";
import { getAuthUser } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export const maxDuration = 26;
const COURSES_BUDGET_MS = 12_000;

/**
 * Refresh the cached course list for one of the caller's own connections.
 * The token comes from lms_connection_token (0051) and goes nowhere but the
 * provider; a refusal at the provider marks the connection as needing
 * reconnecting, so Home and settings say so at once.
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

  // Unset on this site is a 503 with a name, as every other classwork route
  // answers, not a bare 500 from the throw.
  let key: string;
  try {
    key = serverKey();
  } catch {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const { data: refreshToken, error } = await supabase.rpc("lms_connection_token", {
    p_connection_id: connection.id,
    p_server_key: key,
  });
  if (error || !refreshToken) {
    const reason = error ? rpcReason(error.message) : "reconnect_required";
    return reason ? reasonResponse(reason) : NextResponse.json({ error: "classwork_failed" }, { status: 502 });
  }

  const deadlineAt = Date.now() + COURSES_BUDGET_MS;
  const adapter = getClassworkAdapter(connection.provider);
  const instanceUrl = connection.instance_url ?? undefined;
  try {
    const { accessToken } = await adapter.refreshAccessToken({ refreshToken, instanceUrl, deadlineAt });
    const courses = await adapter.listCourses({ accessToken, instanceUrl, deadlineAt });
    const saved = await supabase.rpc("lms_set_courses", {
      p_connection_id: connection.id,
      p_courses: courses as unknown as Json,
      p_server_key: key,
    });
    if (saved.error) {
      const reason = rpcReason(saved.error.message);
      return reason ? reasonResponse(reason) : NextResponse.json({ error: "classwork_failed" }, { status: 502 });
    }
    return NextResponse.json({ courses });
  } catch (caught) {
    if (caught instanceof ClassworkError && caught.code === "reconnect_required") {
      await supabase.rpc("lms_connection_needs_reconnect", {
        p_connection_id: connection.id,
        p_error: caught.message,
        p_server_key: key,
      });
    }
    return classworkErrorResponse(caught);
  }
}
