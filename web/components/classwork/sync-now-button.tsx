"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A forced pass for one link, for the person who linked it or a maintainer
 * of the Pot. The database refuses anyone else, so this never has to. What it
 * says afterwards comes from the pass outcome and nothing else.
 */
const OUTCOME_COPY: Record<string, string> = {
  ok: "Up to date.",
  partial: "Still catching up. Open it again in a moment.",
  skipped: "Synced a moment ago.",
  reconnect: "Needs reconnecting from account settings.",
  error: "We couldn't reach the course just now.",
};

export function SyncNowButton({ linkId, size = "sm", className }: { linkId: string; size?: "sm" | "md"; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function sync() {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/classwork/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkId, force: true }),
      });
      const payload = (await response.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!response.ok) {
        setNote(
          payload.error === "rate_limited"
            ? "That is a lot of syncs. Give it a while."
            : payload.error === "not_authorised"
              ? "Only the person who linked it or a maintainer can sync now."
              : OUTCOME_COPY.error,
        );
        return;
      }
      setNote(OUTCOME_COPY[payload.status ?? "error"] ?? OUTCOME_COPY.error);
      router.refresh();
    } catch {
      setNote(OUTCOME_COPY.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <Button variant="secondary" size={size} onClick={sync} disabled={busy}>
        <ArrowsClockwise className={cn("size-3.5", busy && "animate-spin")} aria-hidden />
        Sync now
      </Button>
      <span role="status" aria-live="polite" className={cn("text-[12px] text-ink-muted", !note && "sr-only")}>
        {note ?? ""}
      </span>
    </span>
  );
}
