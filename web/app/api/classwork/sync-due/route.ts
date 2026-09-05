import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getClassworkAdapter, isClassworkProvider } from "@/lib/classwork";
import { getClassworkConfig } from "@/lib/classwork/config";
import { reasonResponse, rpcFor, rpcReason, serverKey } from "@/lib/classwork/route-helpers";
import { runPass, type BeginPayload, type SyncOutcome } from "@/lib/classwork/sync";
import { bearerMatches } from "@/lib/classwork/trigger";
import { ClassworkError } from "@/lib/classwork/types";

/**
 * The hourly door (0052). Postgres calls this through pg_net with a bearer;
 * nobody is signed in. The route runs as anon with the anon key, asks
 * lms_sync_claim_due for up to five links an hour overdue, and runs each pass
 * through the keyed lms_cron_* doors. Tokens live in this request's memory
 * and nothing about them is echoed back; the reply is counts and statuses.
 */
export const maxDuration = 26;
const BUDGET_MS = 22_000;
/** Do not start a link this close to the ceiling; it waits for the next hour. */
const PER_LINK_RESERVE_MS = 6_000;
const CRON_DOORS = { apply: "lms_cron_apply", finish: "lms_cron_finish" };

type Claimed = BeginPayload & { linkId: string };

export async function POST(request: Request) {
  const secret = getClassworkConfig().CLASSWORK_SYNC_TRIGGER_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "not_authorised" }, { status: 401 });
  }

  let key: string;
  try {
    key = serverKey();
  } catch {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const deadlineAt = Date.now() + BUDGET_MS;

  const claimed = await supabase.rpc("lms_sync_claim_due", { p_server_key: key });
  if (claimed.error) {
    const reason = rpcReason(claimed.error.message);
    return reason ? reasonResponse(reason) : NextResponse.json({ error: "classwork_failed" }, { status: 502 });
  }
  const links = (Array.isArray(claimed.data) ? claimed.data : []) as unknown as Claimed[];

  const outcomes: Array<{ linkId: string } & (SyncOutcome | { status: "deferred" })> = [];
  for (const begin of links) {
    if (Date.now() > deadlineAt - PER_LINK_RESERVE_MS) {
      // Claimed but out of time: it reads as running for two minutes and
      // then the next hour picks it up again.
      outcomes.push({ linkId: begin.linkId, status: "deferred" });
      continue;
    }
    if (!isClassworkProvider(begin.provider)) continue;
    try {
      const outcome = await runPass(begin.linkId, begin, {
        rpc: rpcFor(supabase),
        adapter: getClassworkAdapter(begin.provider),
        serverKey: key,
        deadlineAt,
        fns: CRON_DOORS,
      });
      outcomes.push({ linkId: begin.linkId, ...outcome });
    } catch (error) {
      outcomes.push({
        linkId: begin.linkId,
        status: "error",
        inserted: 0,
        changed: 0,
        removed: 0,
        message: error instanceof ClassworkError ? error.message : "Something went wrong",
      });
    }
  }

  return NextResponse.json({ claimed: links.length, outcomes });
}
