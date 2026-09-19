"use client";

import { useEffect } from "react";

/**
 * Sends "Watch the demo" to the film rather than to the section.
 *
 * The hero link points at #demo, and a plain anchor jump puts the top of the
 * section under the top of the viewport. The section leads with a heading and
 * a standfirst, so what that actually shows is two paragraphs and the first
 * inch of the frame, with the thing the link promised below the fold. A
 * scroll-margin big enough to fix it would have to be the height of whatever
 * sits above the frame, which changes with the breakpoint and with how many
 * lines the heading wraps to.
 *
 * So the target is the frame, and it is centered rather than topped: on a
 * short window the film fills what there is, and on a tall one it sits in the
 * middle with its own heading still above it. That is a measurement only the
 * browser can make, which is why this is script rather than a class.
 *
 * It stays a progressive enhancement. Without JavaScript the anchor still
 * works and still lands on the section, which is the ordinary behavior this
 * improves on rather than replaces.
 */

const LINK = 'a[href="#demo"]';
const FRAME = "#demo-frame";

export function DemoFocus() {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timers: ReturnType<typeof setTimeout>[] = [];

    const box = () => document.querySelector(FRAME)?.getBoundingClientRect();

    const center = (behavior: ScrollBehavior) => {
      const frame = document.querySelector(FRAME);
      if (!frame) return false;
      // "instant" rather than "auto": auto defers to the page, and
      // globals.css sets scroll-behavior: smooth on the root, so a
      // correction meant to be invisible would glide for two seconds.
      frame.scrollIntoView({ block: "center", behavior });
      return true;
    };

    const centered = () => {
      const r = box();
      return !!r && Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2) <= 2;
    };

    /**
     * Correct now and keep checking for a moment.
     *
     * Once is not enough in either of the cases that need it. On a fresh load
     * the router has not finished with the scroll position, fonts are still
     * swapping and the sections above have entrance transforms, so the first
     * pass lands on a layout that is about to move. On a fragment navigation
     * the browser is running its own smooth scroll to the section, which
     * carries on after an instant correction and overrides it.
     *
     * Each pass is a no-op once the frame is where it belongs, so what a
     * reader sees is one correction rather than five.
     */
    const settle = () => {
      const correct = () => {
        if (!centered()) center("instant");
      };
      requestAnimationFrame(correct);
      timers.push(...[90, 250, 500, 850].map((ms) => setTimeout(correct, ms)));
    };

    const onClick = (event: MouseEvent) => {
      // Let the browser have the clicks it should keep: a new tab, a new
      // window, a download, and anything another handler has already taken.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.(LINK);
      if (!link) return;
      if (!center(still.matches ? "instant" : "smooth")) return;
      event.preventDefault();
      // The hash is what makes the link shareable and what the back button
      // reads, so it still gets written; replaceState rather than assignment
      // because assigning it would jump the page we just scrolled.
      history.replaceState(null, "", "#demo");
    };

    // Reaching #demo without a click: a pasted link or another page on a
    // fresh document, the back button or a link elsewhere on a live one.
    // Neither runs this effect again, and both land on the section.
    const onHash = () => {
      if (window.location.hash === "#demo") settle();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#demo") {
      settle();
      window.addEventListener("load", settle, { once: true });
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("load", settle);
      timers.forEach(clearTimeout);
      timers = [];
    };
  }, []);

  return null;
}
