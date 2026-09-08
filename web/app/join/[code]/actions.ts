"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { classCodeSchema, parseOrNull } from "@/lib/validation/inputs";

/** Finalizes membership for a signed-in user and opens the Pot. */
export async function joinPotAction(code: string) {
  // Checked here as well as in the RPC: a malformed code should never become
  // a database round trip, and the redirect below needs a value it can put
  // in a query string safely.
  const parsed = parseOrNull(classCodeSchema, code);
  if (!parsed) redirect("/?error=notfound");

  const supabase = await supabaseServer();
  const { data: potId, error } = await supabase.rpc("join_pot_with_code", {
    p_code: parsed,
  });
  // The function says why it refused, and each reason has its own sentence
  // on the landing and on Home. A closed door used to read as a code that
  // does not exist, which sent people asking for a fresh code that would
  // have been refused just the same.
  if (error) {
    const reason = error.message;
    if (reason.includes("not_authenticated")) {
      redirect(`/login?code=${encodeURIComponent(parsed)}`);
    }
    const key = reason.includes("pot_closed")
      ? "closed"
      : reason.includes("rate_limited")
        ? "busy"
        : reason.includes("pot_not_found")
          ? "notfound"
          : "error";
    redirect(`/?code=${encodeURIComponent(parsed)}&error=${key}`);
  }
  if (!potId) {
    redirect(`/?code=${encodeURIComponent(parsed)}&error=notfound`);
  }
  redirect(`/p/${potId}`);
}
