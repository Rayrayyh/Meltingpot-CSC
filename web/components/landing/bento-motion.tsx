"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The two numbers in the bento count up, and the contribution heatmap fills
 * left to right, the first time each scrolls into view.
 *
 * Both read as the tile waking up rather than as decoration, which is the
 * only kind of motion this block earns: everything it draws is an
 * illustration, and an illustration that animates forever is a distraction.
 * Each runs once and then the tile is still.
 *
 * The counters start at zero rather than at their final value, written in the
 * same layout effect that schedules them, so the markup can keep shipping the
 * real figure for a reader with no JavaScript without it flashing on the way
 * down. Everything here sits inside aria-hidden chrome, so no screen reader
 * hears a number change under it.
 */
export function BentoMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      for (const el of gsap.utils.toArray<HTMLElement>("[data-count-to]")) {
        const target = Number(el.dataset.countTo);
        const prefix = el.dataset.countPrefix ?? "";
        const suffix = el.dataset.countSuffix ?? "";
        const counter = { value: 0 };
        const render = () => {
          el.textContent = `${prefix}${Math.round(counter.value)}${suffix}`;
        };
        render();
        gsap.to(counter, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: render,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      }

      const cells = gsap.utils.toArray<HTMLElement>("[data-heat-cell]");
      if (cells.length) {
        // The cells are in the DOM column by column, so plain source order is
        // already the wipe the months underneath ask for: January to June.
        gsap.from(cells, {
          scale: 0.35,
          opacity: 0,
          duration: 0.45,
          ease: "back.out(1.7)",
          stagger: { each: 0.0045 },
          scrollTrigger: { trigger: cells[0], start: "top 92%", once: true },
        });
      }
    });

    return () => mm.revert();
  });

  return null;
}
