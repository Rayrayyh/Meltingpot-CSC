"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * A line whose letters roll over vertically, staggered out from the middle
 * towards both ends, when it comes into view.
 *
 * Give it one phrase and every letter turns over onto itself, so the line
 * reads the same before and after. Give it several and each letter rolls onto
 * the letter standing in the same place in the next phrase, which is the
 * cycling behaviour in the owner's reference recording.
 *
 * The owner asked for skiper-ui's skiper27. Its source is behind that
 * project's Pro licence (the registry answers 401, "Missing license key"), so
 * this is not their code: it is the behaviour their page documents and their
 * recording shows, built on the GSAP already in this repo, keeping their prop
 * names so a licensed component could replace it without touching call sites.
 *
 * Every letter is a clipped box over a column holding that letter once per
 * phrase. Rolling is one translate of the column by exactly one letter's
 * height. The first phrase is what sits in the box at rest, so the line is
 * readable in the first painted frame: this is the landing's largest text and
 * therefore what the browser measures as the largest contentful paint, and a
 * headline that arrives from nothing does not count as painted until it does.
 */
export function RollingText({
  text,
  speed = 0.055,
  duration = 1.15,
  loop = false,
  hold = 2.2,
  className,
}: {
  /** One phrase to turn over in place, or several to cycle through. */
  text: string | string[];
  /** Seconds between one letter starting and the next. */
  speed?: number;
  /** How long a single letter takes to turn over and settle. */
  duration?: number;
  /** Keep cycling rather than rolling once when the line is reached. */
  loop?: boolean;
  /** Seconds a phrase rests before the next roll, when looping. */
  hold?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);

  // One phrase still needs two faces: a letter has to have somewhere to roll
  // to, and rolling onto a copy of itself is what "in place" means.
  const phrases = Array.isArray(text) ? text : [text, text];
  const rest = phrases[0];
  const width = Math.max(...phrases.map((p) => p.length));
  const step = 100 / phrases.length;

  useGSAP(
    () => {
      const el = host.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tracks = gsap.utils.toArray<HTMLElement>("[data-roll-track]", el);
        if (!tracks.length) return;

        const state = { index: 0 };
        const rollOnce = () => {
          state.index += 1;
          return gsap.to(tracks, {
            yPercent: -step * state.index,
            duration,
            // Measured off skiper-ui's own landing on 2026-09-12: their
            // columns do not run a symmetric curve, they leave quickly and
            // settle asymptotically, still closing the last hundredth of an
            // em a second later. That long soft tail is the whole difference
            // between a letter flipping and a letter coming to rest.
            ease: "expo.out",
            // The middle letter goes first and the turn spreads outwards,
            // which is what makes it read as one motion and not a wave.
            stagger: { each: speed, from: "center" },
            onComplete: () => {
              // The column ends on a copy of the phrase it started on, so
              // snapping back to zero is invisible and the column never has
              // to be longer than the phrase list.
              if (state.index >= phrases.length) {
                state.index = 0;
                gsap.set(tracks, { yPercent: 0 });
              }
            },
          });
        };

        const timeline = gsap.timeline({
          repeat: loop ? -1 : 0,
          repeatDelay: hold,
          scrollTrigger: { trigger: el, start: "top 92%", once: !loop },
        });
        timeline.add(rollOnce);
        return () => timeline.kill();
      });
      return () => mm.revert();
    },
    { scope: host },
  );

  // A span per word, so a line still breaks between words and never inside
  // one, and the resting phrase once more for anything that reads rather
  // than looks.
  const columns = Array.from({ length: width }, (_, i) =>
    phrases.map((phrase) => phrase[i] ?? " "),
  );
  const words: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < width; i++) {
    if (rest[i] === " ") {
      if (current.length) words.push(current);
      words.push([]);
      current = [];
    } else {
      current.push(i);
    }
  }
  if (current.length) words.push(current);

  return (
    <span ref={host} className={cn("inline", className)}>
      <span className="sr-only">{rest}</span>
      <span aria-hidden className="inline">
        {words.map((word, w) =>
          word.length === 0 ? (
            <span key={`gap-${w}`} className="inline-block">
              &nbsp;
            </span>
          ) : (
            <span key={`word-${w}`} className="inline-block whitespace-nowrap">
              {word.map((i) => (
                <span key={i} className="roll-letter">
                  <span data-roll-track className="roll-track">
                    {columns[i].map((letter, face) =>
                      // Only the resting phrase is a real text node. Every
                      // face under it is painted by CSS from an attribute, so
                      // the document's text is the headline once rather than
                      // every letter repeated once per phrase, which is what
                      // a crawler, a text selection and a copy all see.
                      face === 0 ? (
                        <span key={face} className="roll-face">
                          {letter}
                        </span>
                      ) : (
                        <span key={face} className="roll-face" data-face={letter} />
                      ),
                    )}
                  </span>
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
