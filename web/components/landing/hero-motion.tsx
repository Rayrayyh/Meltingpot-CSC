"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The hero's arrival, and the drift under it.
 *
 * Both are GSAP rather than framer because both are timelines: the three
 * headline lines rise out of their own masks in sequence, the supporting copy
 * and the two calls to action follow into the gap the last line leaves, and
 * the product shot settles last and then travels slower than the page as it
 * scrolls away.
 *
 * The start state is set inside useGSAP, which runs in a layout effect, so it
 * lands before the browser paints and nobody sees the finished hero flash
 * first. The markup itself ships readable: if this never runs, because the
 * script failed or the reader asked for no motion, the hero is simply static.
 */
export function HeroMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      const support = gsap.utils.toArray<HTMLElement>("[data-hero-support]");
      const shot = document.querySelector<HTMLElement>("[data-hero-shot]");
      if (!lines.length) return;

      gsap.set(lines, { yPercent: 108 });
      gsap.set(support, { opacity: 0, y: 14 });
      if (shot) gsap.set(shot, { opacity: 0, y: 36 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(lines, { yPercent: 0, duration: 0.9, stagger: 0.085 })
        .to(support, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09 }, "-=0.45");
      if (shot) tl.to(shot, { opacity: 1, y: 0, duration: 1 }, "-=0.55");

      // The shot is already carrying a y from the line above, so the drift
      // rides on yPercent and the two never fight over the same property.
      if (shot) {
        gsap.to(shot, {
          yPercent: -7,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }
    });

    return () => mm.revert();
  });

  return null;
}
