"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Sync on open. The server decides which links are worth a call and hands
 * their ids down; this posts for each after paint, one at a time, and asks
 * the page to re-render only when something actually changed. The database
 * still refuses anything too soon or already running, so a second tab or a
 * fast reload costs a refused call and nothing else.
 *
 * A tab remembers what it just synced for a few minutes so wandering between
 * Home, the Calendar and a Pot does not post for the same link three times.
 */
const RECENT_MS = 4 * 60_000;
const PER_MOUNT = 3;

function recently(linkId: string, now: number): boolean {
  try {
    const at = Number(sessionStorage.getItem(`mp-sync:${linkId}`));
    return Number.isFinite(at) && at > now - RECENT_MS;
  } catch {
    return false;
  }
}

function remember(linkId: string, now: number) {
  try {
    sessionStorage.setItem(`mp-sync:${linkId}`, String(now));
  } catch {
    // Private windows and blocked storage: sync a little more often, which
    // the database throttles anyway.
  }
}

export function ClassworkAutoSync({ linkIds }: { linkIds: string[] }) {
  const router = useRouter();
  const key = linkIds.join(",");
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!key || done.current === key) return;
    done.current = key;
    let cancelled = false;
    const now = Date.now();
    const pending = key.split(",").filter((id) => !recently(id, now)).slice(0, PER_MOUNT);
    if (pending.length === 0) return;

    (async () => {
      let changed = false;
      for (const linkId of pending) {
        remember(linkId, now);
        try {
          const response = await fetch("/api/classwork/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ linkId }),
          });
          if (!response.ok) continue;
          const outcome = (await response.json()) as { inserted?: number; changed?: number; removed?: number };
          if ((outcome.inserted ?? 0) + (outcome.changed ?? 0) + (outcome.removed ?? 0) > 0) changed = true;
        } catch {
          // The next open tries again; nothing to say here.
        }
        if (cancelled) return;
      }
      if (changed && !cancelled) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [key, router]);

  return null;
}
