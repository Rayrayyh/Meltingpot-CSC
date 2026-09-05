"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Notes when this class was last opened.
 *
 * Once per class per tab, not once per navigation. Moving between a Pot's feed,
 * members and admin is one visit as far as "the class I was in last" is
 * concerned, and writing on every one of those would be a database round trip
 * for every tab click to record something that has not changed.
 *
 * It writes from the browser because it is the browser's own row: the policy on
 * pot_preferences is the caller's user id and nothing else, so there is nothing
 * a server action would be protecting.
 */
const seen = new Set<string>();

export function RecordPotVisit({ userId, potId }: { userId: string; potId: string }) {
  const wrote = useRef(false);

  useEffect(() => {
    if (wrote.current || seen.has(potId)) return;
    wrote.current = true;
    seen.add(potId);
    // The id comes from the server render rather than a round trip to
    // auth.getUser(); the policy on the table checks it against the session
    // anyway, so a wrong id writes nothing.
    void supabaseBrowser()
      .from("pot_preferences")
      .upsert(
        { user_id: userId, pot_id: potId, last_viewed_at: new Date().toISOString() },
        { onConflict: "user_id,pot_id" },
      );
  }, [userId, potId]);

  return null;
}
