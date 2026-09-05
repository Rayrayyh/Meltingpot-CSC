"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PillTabs } from "@/components/ui/pill-tabs";

const TABS = [
  { key: "original", label: "Original" },
  { key: "organized", label: "Organized" },
] as const;

/**
 * The organized version is the default reading surface; the verbatim
 * original is always one tab away and clearly labeled.
 */
export function NoteView({
  organized,
  rawText,
}: {
  organized: ReactNode;
  rawText: string;
}) {
  const [tab, setTab] = useState<"organized" | "original">("organized");
  return (
    <div className="space-y-5">
      {/* Original sits first because it is the source and Organized is what
          was made from it, so left to right reads in the order things
          happened. Organized still opens by default: it is the reading
          surface, and the original is one tab away. */}
      <PillTabs
        label="Note view"
        tabs={TABS}
        value={tab}
        onChange={setTab}
      />
      {tab === "organized" ? (
        organized
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-ink-muted">
            The original submission, exactly as it was written. It is never
            edited or deleted.
          </p>
          <div className="bg-sunken/70 border border-edge rounded-(--radius-card) px-5 py-4">
            <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
              {rawText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
