import { NextResponse } from "next/server";
import { z } from "zod";
import { getClassworkAdapter } from "@/lib/classwork";
import { classworkErrorResponse, rpcFor, rpcReason, reasonResponse, serverKey } from "@/lib/classwork/route-helpers";
import { runSync } from "@/lib/classwork/sync";
import { ClassworkError } from "@/lib/classwork/types";
import { parseOrNull, uuidSchema } from "@/lib/validation/inputs";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * One pass, or as much of one as fits. 26 is the platform's ceiling for a
 * synchronous function; the engine stops with a page to spare and the next
 * open continues from the stored cursor, so a long course never fails, it
 * just takes two opens.
 */
export const maxDuration = 26;
const SYNC_BUDGET_MS = 22_000;

const bodySchema = z.object({
  linkId: uuidSchema,
  force: z.boolean().optional(),
});

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = parseOrNull(bodySchema, await request.json().catch(() => null));
  if (!body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  // The provider decides the adapter, and reading the link under row level
  // security is also the first "can you see this" check; the functions ask
  // again with the key.
  const { data: link } = await supabase
    .from("lms_course_links")
    .select("id, provider")
    .eq("id", body.linkId)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: "link_not_found" }, { status: 404 });

  try {
    const outcome = await runSync(link.id, body.force === true, {
      rpc: rpcFor(supabase),
      adapter: getClassworkAdapter(link.provider),
      serverKey: serverKey(),
      deadlineAt: Date.now() + SYNC_BUDGET_MS,
    });
    return NextResponse.json(outcome);
  } catch (error) {
    if (error instanceof ClassworkError) {
      const reason = rpcReason(error.message);
      if (reason) return reasonResponse(reason);
    }
    return classworkErrorResponse(error);
  }
}
