"use client";

import { useEffect } from "react";

/**
 * The soft light that follows the pointer across whichever tile it is over.
 *
 * One listener on the grid rather than eight, writing two custom properties
 * on one element per frame, so a hover costs a style recalculation and
 * nothing else. Deliberately not the React Bits Magic Bento the owner looked
 * at on 2026-09-10: no tilt, no magnetism, no particles, and no GSAP. Those
 * moved the tiles off the reference sheet's alignment, which is the one thing
 * decision 046 says this block has to keep.
 */
export function BentoPointer() {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>("[data-testid='feature-bento']");
    if (!grid) return;
    // A finger has no hover, and a light chasing a tap is noise. Reduced
    // motion turns the whole thing off rather than shortening it: the point
    // of the effect is the movement.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: { tile: HTMLElement; x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      pending.tile.style.setProperty("--mx", `${pending.x}px`);
      pending.tile.style.setProperty("--my", `${pending.y}px`);
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const tile = target?.closest<HTMLElement>("[data-bento-tile]");
      if (!tile) return;
      const box = tile.getBoundingClientRect();
      pending = { tile, x: event.clientX - box.left, y: event.clientY - box.top };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    grid.addEventListener("pointermove", onMove);
    return () => {
      grid.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
