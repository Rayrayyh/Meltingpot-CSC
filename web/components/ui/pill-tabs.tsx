"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A segmented control whose selected state is one shared pill that slides
 * between the items rather than a background each item paints for itself.
 *
 * The pill follows the pointer while it is over the control and settles back
 * on the selected item when it leaves, so hovering previews where a click
 * would land. Keyboard focus moves it the same way, because a keyboard user
 * deserves the same preview.
 *
 * The motion is the part worth explaining. Sliding a box by animating its left
 * edge and its width together gives a box that translates, which is not what
 * the reference does. There the edge facing the destination sets off first and
 * the edge behind it catches up, so the pill stretches across the gap and then
 * contracts onto the target. That is two edges on two springs: the leading one
 * stiff, the trailing one softer. Which edge leads depends on the direction of
 * travel, so the springs are assigned per move rather than per edge.
 *
 * Reduced motion collapses both springs to an instant step. The pill still
 * marks the item, it just stops travelling.
 */

export type PillTab<K extends string> = { key: K; label: string };

const LEAD = { type: "spring", stiffness: 700, damping: 42, mass: 0.6 } as const;
const TRAIL = { type: "spring", stiffness: 280, damping: 34, mass: 0.8 } as const;

export function PillTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly PillTab<K>[];
  value: K;
  onChange: (next: K) => void;
  /** Accessible name for the tablist. */
  label: string;
  className?: string;
}) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<K, HTMLButtonElement>());
  const [hover, setHover] = useState<K | null>(null);
  const reduced = useReducedMotion();

  const left = useMotionValue(0);
  const right = useMotionValue(0);
  // Hidden until the first measurement has placed it, and driven as a motion
  // value rather than state so the reveal never writes state from an effect.
  const visible = useMotionValue(0);
  const lastLeft = useRef<number | null>(null);

  const target = hover ?? value;

  const moveTo = useCallback(
    (key: K, instant: boolean) => {
      const list = listRef.current;
      const item = itemRefs.current.get(key);
      if (!list || !item) return;
      const nextLeft = item.offsetLeft;
      const nextRight = list.clientWidth - (item.offsetLeft + item.offsetWidth);
      if (instant || reduced || lastLeft.current === null) {
        left.set(nextLeft);
        right.set(nextRight);
        visible.set(1);
      } else {
        // Moving right: the right edge leads. Moving left: the left edge does.
        const movingRight = nextLeft > lastLeft.current;
        animate(left, nextLeft, movingRight ? TRAIL : LEAD);
        animate(right, nextRight, movingRight ? LEAD : TRAIL);
      }
      lastLeft.current = nextLeft;
    },
    [left, right, visible, reduced],
  );

  // First placement is a set, not an animation: a pill that slides in from
  // nowhere on mount is a flourish nobody asked for. moveTo handles that by
  // setting rather than animating while it has no previous position.
  useEffect(() => {
    moveTo(target, false);
  }, [moveTo, target]);

  // Fonts landing and the container resizing both move every edge.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const refresh = () => moveTo(target, true);
    const observer = new ResizeObserver(refresh);
    observer.observe(list);
    document.fonts?.addEventListener("loadingdone", refresh);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", refresh);
    };
  }, [moveTo, target]);

  function onKeyDown(event: React.KeyboardEvent) {
    const index = tabs.findIndex((t) => t.key === value);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const key = tabs[next].key;
    onChange(key);
    itemRefs.current.get(key)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      className={cn(
        "relative isolate inline-flex rounded-full border border-edge bg-sunken p-0.5",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 -z-10 rounded-full bg-surface shadow-(--shadow-card)"
        style={{ left, right, opacity: visible }}
      />
      {tabs.map((tab) => {
        const selected = tab.key === value;
        const lit = tab.key === target;
        return (
          <button
            key={tab.key}
            ref={(node) => {
              if (node) itemRefs.current.set(tab.key, node);
              else itemRefs.current.delete(tab.key);
            }}
            id={`${id}-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onMouseEnter={() => setHover(tab.key)}
            onFocus={() => setHover(tab.key)}
            onBlur={() => setHover(null)}
            className={cn(
              "relative h-8 rounded-full px-4 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none",
              lit ? "text-ink" : "text-ink-muted",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
