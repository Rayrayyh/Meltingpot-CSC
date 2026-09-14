"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

/**
 * Leans whatever it wraps a little way towards the pointer, and lets go when
 * the pointer leaves.
 *
 * `quickTo` is the reason this is GSAP: it keeps one tween per axis alive and
 * re-aims it, so a pointer moving across the control costs two property
 * writes a frame instead of a new animation every event. The pull is capped
 * well under the control's own padding, so the hit area never runs away from
 * the label, and it is off entirely for touch and for reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.3,
  limit = 7,
  className,
}: {
  children: ReactNode;
  /** How much of the distance from the centre the control travels. */
  strength?: number;
  /** The furthest it will ever go, in pixels. */
  limit?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = host.current;
      if (!el) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

      const onMove = (event: PointerEvent) => {
        const box = el.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        moveX(gsap.utils.clamp(-limit, limit, dx * strength));
        moveY(gsap.utils.clamp(-limit, limit, dy * strength));
      };
      const onLeave = () => {
        moveX(0);
        moveY(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: host },
  );

  return (
    <span ref={host} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
