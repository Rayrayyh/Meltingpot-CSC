"use client";

import { useState } from "react";
import { motion, useAnimationControls, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * A link underline that ducks out one side and comes back in from the other
 * when the pointer arrives. Ported from fancycomponents.dev's
 * "underline goes out comes in".
 *
 * It uses framer-motion rather than the `motion` package, and this app's own
 * `cn`, so it adds no dependency: pulling the original through the shadcn
 * registry would have installed a second animation library alongside the one
 * already here, and clsx beside it.
 *
 * It honours prefers-reduced-motion. The underline still sits under the word,
 * it simply stops moving, so nothing is lost for a reader who asked for
 * stillness.
 *
 * Three things in the original did not survive the port, each because it did
 * not work here rather than on taste.
 *
 * It takes an `as` prop and builds its element with motion.create() during
 * render, which this repo's lint rightly refuses: a component made that way is
 * a new type on every render and drops its state. It is always a span here,
 * sitting inside the Link that already carries the href, so the prop is gone.
 *
 * It sizes the rule by measuring the computed font size in an effect and
 * writing two custom properties. Those never populated, so the bar resolved to
 * height 0 and nothing was drawn at all. em is what that measurement was
 * approximating, and it needs no ref, no resize listener and no second render.
 *
 * It animates `width` while also setting width in the style prop, which
 * framer-motion v13 will not move: pointer events arrive, the sweep never
 * starts. This uses scaleX against a switched transform origin instead, which
 * draws the same picture and composites on the GPU rather than relaying out
 * the line on every frame.
 */
export function GoesOutComesInUnderline({
  children,
  direction = "left",
  className,
  thickness = "0.07em",
  offset = "-0.16em",
  transition = { duration: 0.4, ease: "easeOut" },
  ...props
}: {
  children: React.ReactNode;
  /** Which edge the underline returns from. It leaves by the other one. */
  direction?: "left" | "right";
  className?: string;
  /** Rule thickness, in em so it tracks the text it sits under. */
  thickness?: string;
  /** How far below the text box the rule sits. */
  offset?: string;
  transition?: Transition;
}) {
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  // One sweep at a time. Without this a pointer crossing the word twice
  // restarts the run half finished and the rule stutters instead of sweeping.
  const [running, setRunning] = useState(false);

  const leavesBy = direction === "left" ? "100% 50%" : "0% 50%";
  const returnsFrom = direction === "left" ? "0% 50%" : "100% 50%";

  const animate = async () => {
    if (running || reduced) return;
    setRunning(true);

    // The origin has to be set before each leg rather than after it, or the
    // rule collapses and reappears from the same side.
    controls.set({ transformOrigin: leavesBy });
    await controls.start({ scaleX: 0, transition });
    controls.set({ transformOrigin: returnsFrom });
    await controls.start({ scaleX: 1, transition });

    setRunning(false);
  };

  return (
    <motion.span
      className={cn("relative inline-block", className)}
      onHoverStart={animate}
      {...props}
    >
      <span>{children}</span>
      <motion.span
        aria-hidden
        className="absolute left-0 w-full bg-current"
        style={{ height: thickness, bottom: offset, transformOrigin: returnsFrom }}
        initial={{ scaleX: 1 }}
        animate={controls}
      />
    </motion.span>
  );
}
