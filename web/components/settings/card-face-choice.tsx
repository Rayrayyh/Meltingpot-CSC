"use client";

import { useSyncExternalStore } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import {
  applyCardFace,
  CARD_FACES,
  DEFAULT_CARD_FACE,
  readCardFace,
  subscribeToCardFace,
} from "@/lib/card-face";

/**
 * Flashcard colour picker for the settings page. Six swatches, each already
 * checked to keep the card's ink readable, with a small card beside them that
 * shows the choice as it will look, in the light ink the face always uses.
 */
export function CardFaceChoice() {
  const choice = useSyncExternalStore(subscribeToCardFace, readCardFace, () => DEFAULT_CARD_FACE);
  const current = CARD_FACES.find((face) => face.id === choice) ?? CARD_FACES[0];

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div role="radiogroup" aria-label="Flashcard colour" className="flex flex-wrap gap-2">
        {CARD_FACES.map((face) => {
          const active = choice === face.id;
          return (
            <button
              key={face.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={face.label}
              title={face.label}
              onClick={() => applyCardFace(face.id)}
              style={{ backgroundColor: face.hex }}
              className={cn(
                "relative size-10 rounded-full border transition-shadow",
                active
                  ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]"
                  : "border-edge-strong hover:shadow-[0_0_0_3px_var(--sunken)]",
              )}
            >
              {active ? (
                <Check
                  className="absolute inset-0 m-auto size-[18px]"
                  weight="bold"
                  style={{ color: "#24222c" }}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        aria-hidden
        className="mp-flashcard-face flex h-[72px] w-[120px] flex-col items-center justify-center gap-1 rounded-(--radius-card) border border-edge px-3 text-center"
      >
        <span className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">{current.label}</span>
        <span className="text-[13px] font-medium leading-tight text-ink">What is osmosis?</span>
      </div>
    </div>
  );
}
