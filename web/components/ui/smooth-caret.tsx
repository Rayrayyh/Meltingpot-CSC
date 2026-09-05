"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  type ComponentProps,
  type Ref,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/cn";

/**
 * A text field whose caret is drawn rather than native, so it glides between
 * positions instead of jumping.
 *
 * Adapted from skiper-ui's skiper106. Two things changed on the way in. Their
 * version reads its spring from dialkit, a live control panel for their demo
 * page, so those values are inlined here rather than pulling a dependency that
 * exists to tune a playground. And their PASSWORD_CHAR is computed at module
 * scope from navigator.userAgent, which throws the moment this renders on the
 * server, so it is resolved lazily instead.
 *
 * The native caret is hidden with caret-color and a div takes its place, moved
 * by a spring. Position comes from measuring the text before the caret in a
 * hidden span that copies the input's own computed font, which is the only way
 * to know where a character actually ends.
 *
 * Reduced motion gets a spring stiff enough to arrive instantly, so the caret
 * still tracks the cursor but never appears to travel.
 */

const SPRING = { stiffness: 500, damping: 30, mass: 0.5 } as const;
const RIGID = { stiffness: 10000, damping: 100, mass: 0.1 } as const;

function passwordChar() {
  if (typeof navigator === "undefined") return "•";
  return /firefox|fxios/i.test(navigator.userAgent) ? "●" : "•";
}

/**
 * Every computed property that changes how wide a run of text comes out.
 *
 * The measure span is a sibling of the input rather than a child, so it
 * inherits none of this and every one of them has to be copied or the
 * measurement is wrong by the difference. text-transform is the one that bites
 * hardest: a field styled uppercase renders six wide capitals while the span,
 * fed the same string, measures six narrow lowercase letters.
 *
 * The order matters. Assigning the `font` shorthand resets font-variant,
 * font-kerning, font-feature-settings, font-stretch and font-size-adjust to
 * their initial values, so the shorthand goes on first and these follow it.
 */
function copyMetrics(measure: HTMLSpanElement, styles: CSSStyleDeclaration) {
  measure.style.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  measure.style.fontStretch = styles.fontStretch;
  measure.style.fontVariant = styles.fontVariant;
  measure.style.fontKerning = styles.fontKerning;
  measure.style.fontFeatureSettings = styles.fontFeatureSettings;
  measure.style.fontVariationSettings = styles.fontVariationSettings;
  measure.style.letterSpacing = styles.letterSpacing;
  measure.style.wordSpacing = styles.wordSpacing;
  measure.style.textTransform = styles.textTransform;
  measure.style.textRendering = styles.textRendering;
  measure.style.tabSize = styles.tabSize;
  measure.style.direction = styles.direction;
}

export function SmoothCaretInput({
  className,
  onChange,
  onBlur,
  ref,
  ...props
}: ComponentProps<"input"> & { ref?: Ref<HTMLInputElement> }) {
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  // True between compositionstart and compositionend. A CJK or accent
  // composition shows its own underlined preedit run and moves the selection
  // around inside it, so a second caret drawn over the top is noise.
  const composing = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const springCaretX = useSpring(caretX, prefersReducedMotion ? RIGID : SPRING);

  const update = useCallback(
    (target: HTMLInputElement) => {
      const measure = measureRef.current;
      if (!measure) return;

      const styles = window.getComputedStyle(target);
      // The hidden span has to be the input's font exactly, or every
      // measurement is off by the difference.
      copyMetrics(measure, styles);

      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      const hasSelection = start !== end;
      const index =
        start === end ? start : target.selectionDirection === "backward" ? start : end;

      const masked = target.type === "password";
      const value = masked ? passwordChar().repeat(target.value.length) : target.value;
      const before = masked ? passwordChar().repeat(index) : value.slice(0, index);

      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      // The caret is positioned from the input's border box, clientWidth is
      // measured inside its border, so the border has to be added back or the
      // caret sits a pixel left of every character.
      const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
      const inner = Math.max(0, target.clientWidth - paddingLeft - paddingRight);

      // The caret's height follows the field's type size, not the wrapper's.
      // An em on the caret itself would resolve against the wrapper, which is
      // 16px in a form that sets the class code at 24.
      const caret = caretRef.current;
      if (caret) caret.style.height = `${(parseFloat(styles.fontSize) || 16) * 1.1}px`;

      // Bounding rects keep the fraction that offsetWidth rounds away, which
      // centring then halves into a visible half pixel. They are in viewport
      // space, though, and the caret is placed in the field's own space, so
      // any scale an ancestor is applying (a card mid entrance, say) has to
      // be divided back out or the caret drifts for the length of it.
      const host = containerRef.current;
      const scale =
        host && host.offsetWidth > 0 ? host.getBoundingClientRect().width / host.offsetWidth : 1;
      const width = () => measure.getBoundingClientRect().width / (scale || 1);
      measure.textContent = before;
      const beforeWidth = before.length > 0 ? width() : 0;

      /**
       * Where the text begins inside the content box.
       *
       * Left aligned that is just the left padding, which is what this used to
       * assume for every field. A centered field is the class code box, six
       * wide letter spaced characters in the middle of a sixteen line tall
       * control, and there the run starts wherever the browser put it, so the
       * whole value has to be measured too. Once the value is wider than the
       * box the browser stops centering and scrolls it like a left aligned
       * field, which is what clamping at zero reproduces.
       */
      const align = styles.textAlign;
      const rtl = styles.direction === "rtl";
      const trailing = align === "right" || align === "end" || (rtl && align === "start");
      const centered = align === "center";
      let origin = borderLeft + paddingLeft;
      if (centered || trailing) {
        measure.textContent = value;
        const fullWidth = value.length > 0 ? width() : 0;
        const slack = Math.max(0, inner - fullWidth);
        origin += centered ? slack / 2 : slack;
        measure.textContent = before;
      }

      const absolute = before.length > 0 ? origin + beforeWidth : origin - 1;

      // Keep the caret inside the visible strip when the value is longer than
      // the field, matching what the native caret would do.
      const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
      const visibleRight = target.scrollLeft + borderLeft + target.clientWidth - paddingRight;
      const visibleLeft = target.scrollLeft + borderLeft + paddingLeft;
      if (absolute > visibleRight) {
        target.scrollLeft = Math.min(absolute - visibleRight + target.scrollLeft, maxScroll);
      } else if (absolute < visibleLeft) {
        target.scrollLeft = Math.max(0, absolute - borderLeft - paddingLeft);
      }

      const x = absolute - target.scrollLeft;
      const minX = Math.min(borderLeft + paddingLeft, origin) - 1;
      const maxX = borderLeft + target.clientWidth - paddingRight;
      caretX.set(Math.min(x, maxX));
      // Hidden while a range is selected: the browser draws that highlight and
      // a caret sitting inside it reads as a second cursor. Hidden mid
      // composition for the same reason, the preedit run is its own cursor.
      caretOpacity.set(
        !hasSelection && !composing.current && x >= minX && x <= maxX + 1 ? 1 : 0,
      );
    },
    [caretX, caretOpacity],
  );

  // Assigned in an effect rather than during render: React reserves render
  // for pure work, and the listeners below only ever read this afterwards.
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const refresh = () => {
      if (document.activeElement === input) updateRef.current(input);
    };
    // selectionchange is the only event that fires for arrow keys, clicks into
    // the middle of a value, and select-all alike.
    const onSelectionChange = () => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(refresh);
    };
    const onCompositionStart = () => {
      composing.current = true;
      refresh();
    };
    const onCompositionEnd = () => {
      composing.current = false;
      requestAnimationFrame(refresh);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    input.addEventListener("scroll", refresh);
    input.addEventListener("focus", refresh);
    input.addEventListener("compositionstart", onCompositionStart);
    input.addEventListener("compositionend", onCompositionEnd);
    // Webfonts land after first paint and change every measurement.
    document.fonts?.addEventListener("loadingdone", refresh);
    void document.fonts?.ready.then(refresh);

    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    refresh();

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      input.removeEventListener("scroll", refresh);
      input.removeEventListener("focus", refresh);
      input.removeEventListener("compositionstart", onCompositionStart);
      input.removeEventListener("compositionend", onCompositionEnd);
      document.fonts?.removeEventListener("loadingdone", refresh);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative grid grid-cols-1">
      <input
        {...props}
        // The component owns this ref to measure with, so a caller's ref is
        // filled in alongside rather than replacing it. Search reads the live
        // value off its own ref, and a field it cannot reach is a worse bug
        // than a caret that does not glide.
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onChange={(e) => {
          onChange?.(e);
          const target = e.currentTarget;
          // Two frames. A controlled field whose onChange rewrites the value,
          // as the class code box does when it uppercases and strips
          // separators, has not committed that value to the DOM by the next
          // frame, so measuring then measures the text the user typed rather
          // than the text on screen.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => updateRef.current(target)),
          );
        }}
        onBlur={(e) => {
          caretOpacity.set(0);
          onBlur?.(e);
        }}
        className={cn("col-start-1 row-start-1 [caret-color:transparent]", className)}
      />
      {/* The measure span sits in a box with no size, so a long value in a
          field near the right edge cannot push a horizontal scrollbar onto the
          page. whitespace-pre is load bearing: it is what keeps the span at its
          full text width inside a zero width parent, and without it every
          measurement would silently be 0. */}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <span ref={measureRef} className="invisible whitespace-pre" />
      </span>
      <motion.span
        ref={caretRef}
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1 h-[1.1em] w-0.5 self-center rounded-full bg-primary"
        style={{ x: springCaretX, opacity: caretOpacity }}
      />
    </div>
  );
}
