"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The hero's arrival, and the drift under it.
 *
 * The headline is its own component now (rolling-text.tsx); what is left
 * here is the copy and the two calls to action arriving under it, and the
 * product shot, which settles last and then travels slower than the page as
 * it scrolls away.
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
      const support = gsap.utils.toArray<HTMLElement>("[data-hero-support]");
      const shot = document.querySelector<HTMLElement>("[data-hero-shot]");
      if (!support.length && !shot) return;

      gsap.set(support, { opacity: 0, y: 14 });
      if (shot) gsap.set(shot, { opacity: 0, y: 36 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(support, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, delay: 0.15 });
      if (shot) tl.to(shot, { opacity: 1, y: 0, duration: 1 }, "-=0.35");

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
