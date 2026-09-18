"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClosedCaptioning,
  CornersIn,
  CornersOut,
  Gear,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * The demo player.
 *
 * Two states, after ramp.com/view-demo. Before anything is pressed the frame
 * is quiet: a still, or a short silent loop when one is supplied, with one
 * pill over it. Pressing the pill starts the real film with sound and hands
 * over a control bar this file draws rather than the browser's own.
 *
 * Why not the browser's: native controls cannot be styled, so on a cream page
 * they arrive as a slab of somebody else's design language, and they differ
 * between Safari, Chrome and Firefox, which means the one piece of the page
 * every visitor is asked to touch is the one piece nobody designed. The cost
 * of drawing them is that every affordance has to be rebuilt honestly, which
 * is what the aria labels, the real range input and the keyboard handling
 * below are for.
 *
 * The bar is a fixed dark rather than a theme token on purpose: it sits over
 * film, not over the page, so it has to hold up against whatever frame is
 * behind it in either theme.
 *
 * Reduced motion reaches the preview loop, which is the only thing here that
 * moves on its own. The film itself never autoplays under any preference,
 * because a person pressing play is the whole contract of this component.
 */

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/** Hides the bar once a film is running and nobody is reaching for it. */
const IDLE_MS = 2_600;

export function DemoPlayer({
  src,
  /** The frame it rests on. Without one the frame is blank until play. */
  poster,
  captions,
  /**
   * A short silent loop for the resting state. Without one the poster is the
   * resting state, which is the same picture holding still.
   */
  previewSrc,
  className,
}: {
  src: string;
  poster?: string;
  captions?: string;
  previewSrc?: string;
  className?: string;
}) {
  const film = useRef<HTMLVideoElement>(null);
  const loop = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const resume = useRef<HTMLButtonElement>(null);
  const gear = useRef<HTMLButtonElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set while focus is inside the bar, which is a reason never to hide it. */
  const held = useRef(false);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [resting, setResting] = useState(false);

  // The bar stays put whenever somebody might be about to use it: paused,
  // pointer inside, or focus somewhere in it. Driven from the events that
  // actually change that rather than from an effect watching `playing`,
  // which would be a second source of truth for the same fact.
  const wake = useCallback(() => {
    setResting(false);
    if (idle.current) clearTimeout(idle.current);
    // Focus inside the bar means somebody is using it with a keyboard, and
    // they get no pointer move to bring it back. Pin it until focus leaves.
    if (held.current) return;
    idle.current = setTimeout(() => setResting(true), IDLE_MS);
  }, []);

  const settle = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    setResting(false);
    setSpeedOpen(false);
  }, []);

  useEffect(() => () => {
    if (idle.current) clearTimeout(idle.current);
  }, []);

  useEffect(() => {
    const onFullscreen = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const start = () => {
    const node = film.current;
    if (!node) return;
    setStarted(true);
    node.muted = false;
    setMuted(false);
    // This runs inside a click, so the autoplay policy is already satisfied
    // and the realistic rejection is an AbortError: somebody pressed pause,
    // or seeked, before the first frame arrived. Putting the pill back there
    // would yank the controls off a film that is doing exactly what it was
    // told. Leaving `started` true lands on the bar with a play button
    // instead, which is both honest and recoverable. A file that genuinely
    // cannot play is caught by onError below, which is the only thing that
    // should return the pill.
    void node.play().catch(() => setPlaying(false));
    // Keyboard focus was on the pill, which is about to unmount. Hand it to
    // the control that replaces it rather than dropping it on the body.
    requestAnimationFrame(() => resume.current?.focus({ preventScroll: true }));
  };

  const toEnd = () => {
    const node = film.current;
    setPlaying(false);
    setStarted(false);
    setAt(0);
    // `at` is our number; this is the element's. Without it the pill comes
    // back over the last frame rather than over the poster.
    if (node) node.currentTime = 0;
    // The whole bar is about to unmount, so no blur handler inside it will
    // run. Clearing this by hand keeps a film that ended under a focused
    // control from pinning the bar open for the rest of the page's life.
    held.current = false;
    settle();
    // Same handoff as the pill's, in the other direction: the bar is going,
    // and the pill is what replaces it.
    requestAnimationFrame(() => pill.current?.focus({ preventScroll: true }));
  };

  const toggle = () => {
    const node = film.current;
    if (!node) return;
    if (node.paused) void node.play().catch(() => setPlaying(false));
    else {
      node.pause();
      setPlaying(false);
    }
  };

  const seek = (to: number) => {
    const node = film.current;
    if (!node) return;
    node.currentTime = to;
    setAt(to);
  };

  const toggleCaptions = () => {
    const node = film.current;
    const track = node?.textTracks?.[0];
    if (!track) return;
    const next = !captionsOn;
    track.mode = next ? "showing" : "hidden";
    setCaptionsOn(next);
  };

  const toggleFullscreen = () => {
    // Both of these reject when the browser or an embedding policy refuses,
    // and a bare `void` leaves that as an unhandled rejection. There is
    // nothing to do about a refusal except stay where we are.
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void frame.current?.requestFullscreen?.().catch(() => {});
  };

  const pick = (rate: number) => {
    setSpeed(rate);
    setSpeedOpen(false);
    if (film.current) film.current.playbackRate = rate;
    // The button that took this click unmounts with the menu. Focus belongs
    // back on the control that opened it, not on the body.
    requestAnimationFrame(() => gear.current?.focus({ preventScroll: true }));
  };

  // Invisible is not stopped. A loop left running keeps decoding under the
  // film, and if the viewer unmuted it before pressing play it keeps its
  // audio too, so two soundtracks play at once.
  useEffect(() => {
    const node = loop.current;
    if (!node) return;
    if (started) node.pause();
    else void node.play().catch(() => {});
  }, [started]);

  const barHidden = started && playing && resting && !speedOpen;

  return (
    <div
      ref={frame}
      onPointerMove={() => started && wake()}
      onPointerLeave={() => {
        if (!started || !playing || held.current) return;
        setSpeedOpen(false);
        setResting(true);
      }}
      className={cn(
        "group/player relative overflow-hidden rounded-(--radius-card) border border-edge bg-paper shadow-(--shadow-raised)",
        full && "flex h-full w-full items-center justify-center rounded-none border-0 bg-black",
        className,
      )}
    >
      {/* The resting picture. A loop when one is supplied and motion is
          welcome; the poster otherwise, which is the same frame holding
          still. Hidden rather than unmounted once the film starts, so the
          swap does not flash the cream through. */}
      {previewSrc ? (
        <video
          ref={loop}
          aria-hidden
          tabIndex={-1}
          className={cn(
            "absolute inset-0 h-full w-full object-contain motion-reduce:hidden",
            started && "invisible",
          )}
          poster={poster}
          src={previewSrc}
          autoPlay
          loop
          muted={previewMuted}
          playsInline
          preload="metadata"
        />
      ) : null}

      <video
        ref={film}
        className={cn(
          "block w-full bg-paper object-contain",
          // A forced 16:9 box is right in the page and wrong in fullscreen.
          // The fullscreen element is the size of the screen, so on anything
          // wider than 16:9 a 16:9 box computed from that width is taller
          // than the screen, and the frame's overflow-hidden crops the film.
          // Filling the frame and letting object-contain letterbox is the
          // only shape that is correct on every display.
          full ? "h-full" : "aspect-video",
          // Hidden behind the loop, but only where the loop is actually
          // showing. motion-reduce hides the loop, and without the matching
          // exception here both would be hidden and the resting frame would
          // be an empty box: no loop, no poster, nothing.
          !started && previewSrc && "invisible motion-reduce:visible",
        )}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        onClick={() => {
          if (!started) return;
          if (speedOpen) {
            setSpeedOpen(false);
            return;
          }
          // On a pointer device the bar has already woken on the move in, so
          // this is a pause. On touch there is no move, so the first tap has
          // to be the one that brings the controls back rather than one that
          // silently pauses the film somebody just started.
          if (barHidden) wake();
          else toggle();
        }}
        onLoadedMetadata={(e) => {
          setLength(e.currentTarget.duration);
          // The track's mode is the truth about whether captions are on;
          // this state only labels a button. A browser that restores a
          // caption preference would otherwise have the button announcing
          // the opposite of what the film is doing.
          const track = e.currentTarget.textTracks[0];
          if (track) setCaptionsOn(track.mode === "showing");
        }}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onError={() => {
          // The one case where the pill should come back: the file will not
          // play at all, so there is nothing for the controls to control.
          setStarted(false);
          setPlaying(false);
        }}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true);
          wake();
        }}
        onPause={() => {
          setPlaying(false);
          settle();
        }}
        onEnded={toEnd}
      >
        {captions ? (
          <track kind="captions" src={captions} srcLang="en" label="English" default={false} />
        ) : null}
        {/* Reached only by a browser that will not play the file at all. */}
        <p className="p-6 text-[15px] leading-relaxed text-ink-muted">
          Your browser cannot play this video.{" "}
          <a className="text-primary underline underline-offset-4" href={src}>
            Open the file directly
          </a>{" "}
          instead.
        </p>
      </video>

      {/* Resting state: one pill, and a sound control only when there is
          actually a loop running to unmute. */}
      {!started ? (
        <>
          <button
            ref={pill}
            type="button"
            onClick={start}
            className="group/cta absolute inset-0 grid place-items-center focus-visible:outline-none"
          >
            <span className="sr-only">Watch the demo</span>
            <span
              aria-hidden
              className="pointer-events-none inline-flex items-center gap-2.5 rounded-full border border-black/5 bg-white/90 py-1.5 pl-1.5 pr-5 shadow-[0_10px_30px_rgb(0_0_0/0.18)] backdrop-blur-md transition-transform duration-300 ease-out group-focus-visible/cta:ring-2 group-focus-visible/cta:ring-white group-focus-visible/cta:ring-offset-2 group-focus-visible/cta:ring-offset-[#24222c] motion-safe:group-hover/player:scale-[1.03] sm:gap-3 sm:py-2 sm:pl-2 sm:pr-6"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#ab5a14] text-white sm:size-11">
                <Play weight="fill" className="ml-0.5 size-4 sm:size-5" />
              </span>
              <span className="text-[14px] font-medium tracking-tight text-[#24222c] sm:text-[16px]">
                Watch the demo
              </span>
            </span>
          </button>
          {previewSrc ? (
            <button
              type="button"
              onClick={() => setPreviewMuted((m) => !m)}
              aria-label={previewMuted ? "Unmute the preview" : "Mute the preview"}
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/70 motion-reduce:hidden"
            >
              {previewMuted ? (
                <SpeakerSlash weight="fill" className="size-4" />
              ) : (
                <SpeakerHigh weight="fill" className="size-4" />
              )}
            </button>
          ) : null}
        </>
      ) : null}

      {/* The bar. Fixed dark because it sits over film rather than over the
          page, so it has to read in both themes against any frame. */}
      {started ? (
        <div
          onPointerMove={wake}
          onFocusCapture={() => {
            held.current = true;
            settle();
          }}
          onBlurCapture={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            held.current = false;
            wake();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Escape" || !speedOpen) return;
            e.stopPropagation();
            setSpeedOpen(false);
          }}
          className={cn(
            "absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-full bg-[rgb(18_16_22/0.86)] px-2 py-1.5 text-white shadow-[0_6px_24px_rgb(0_0_0/0.28)] backdrop-blur-md transition-[opacity,translate] duration-300 sm:inset-x-3 sm:bottom-3 sm:gap-4 sm:px-4 sm:py-2",
            barHidden ? "pointer-events-none opacity-0 motion-safe:translate-y-2" : "opacity-100",
          )}
        >
          <button
            ref={resume}
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid size-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/15 sm:size-8"
          >
            {playing ? (
              <Pause weight="fill" className="size-4" />
            ) : (
              <Play weight="fill" className="ml-0.5 size-4" />
            )}
          </button>

          <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/85 sm:text-[12px]">
            {clock(at)}
          </span>

          {/* A real range input: it carries the keyboard, the screen reader
              and the pointer for free, and only its skin is ours. */}
          <input
            type="range"
            min={0}
            max={Math.max(length, 0.1)}
            step={0.1}
            value={Math.min(at, length || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            onKeyDown={(e) => {
              // The step that suits a dragged pointer is useless to a
              // keyboard: 0.1s an arrow press is over a thousand presses to
              // cross a two minute film. Arrows jump five seconds and
              // Home/End go to the ends, which is what every player does.
              const jump =
                e.key === "ArrowRight" || e.key === "ArrowUp"
                  ? 5
                  : e.key === "ArrowLeft" || e.key === "ArrowDown"
                    ? -5
                    : 0;
              if (jump) {
                e.preventDefault();
                seek(Math.min(Math.max(at + jump, 0), length));
              } else if (e.key === "Home") {
                e.preventDefault();
                seek(0);
              } else if (e.key === "End") {
                e.preventDefault();
                seek(length);
              }
            }}
            aria-label="Seek"
            aria-valuetext={`${clock(at)} of ${clock(length)}`}
            className="mp-scrub h-1 w-full min-w-0 grow cursor-pointer appearance-none rounded-full bg-white/25"
            style={{
              backgroundImage: "linear-gradient(currentColor, currentColor)",
              backgroundSize: `${length ? (at / length) * 100 : 0}% 100%`,
              backgroundRepeat: "no-repeat",
            }}
          />

          <div className="flex shrink-0 items-center gap-0 sm:gap-1.5">
            {captions ? (
              <button
                type="button"
                onClick={toggleCaptions}
                aria-pressed={captionsOn}
                aria-label={captionsOn ? "Turn captions off" : "Turn captions on"}
                className={cn(
                  "grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15 sm:size-8",
                  captionsOn && "bg-white/20",
                )}
              >
                <ClosedCaptioning weight={captionsOn ? "fill" : "regular"} className="size-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const node = film.current;
                if (!node) return;
                node.muted = !node.muted;
                setMuted(node.muted);
              }}
              aria-label={muted ? "Unmute" : "Mute"}
              className="grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15 sm:size-8"
            >
              {muted ? (
                <SpeakerSlash weight="fill" className="size-4" />
              ) : (
                <SpeakerHigh weight="fill" className="size-4" />
              )}
            </button>

            <div className="relative">
              <button
                ref={gear}
                type="button"
                onClick={() => setSpeedOpen((o) => !o)}
                aria-expanded={speedOpen}
                aria-label={`Playback speed, ${speed === 1 ? "normal" : `${speed}x`}`}
                className={cn(
                  "grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15 sm:size-8",
                  speedOpen && "bg-white/20",
                )}
              >
                <Gear weight="fill" className="size-4" />
              </button>
              {speedOpen ? (
                /* A group of toggles rather than role="menu". A menu
                   promises arrow key roving, type ahead and a focus trap,
                   and a control that claims a contract it does not keep is
                   worse to a screen reader user than one that never claimed
                   it. As a group these are five ordinary buttons: Tab
                   reaches each, Enter picks it, Escape closes. */
                <div
                  role="group"
                  aria-label="Playback speed"
                  className="absolute bottom-9 right-0 flex rounded-xl bg-[rgb(18_16_22/0.96)] p-1 shadow-[0_10px_28px_rgb(0_0_0/0.45)] backdrop-blur-md sm:bottom-11 sm:min-w-28 sm:flex-col"
                >
                  {SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      aria-pressed={speed === rate}
                      onClick={() => pick(rate)}
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-center text-[12px] transition-colors hover:bg-white/15 sm:block sm:w-full sm:px-3 sm:py-1.5 sm:text-left sm:text-[13px]",
                        speed === rate ? "text-white" : "text-white/70",
                      )}
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={full ? "Leave full screen" : "Full screen"}
              className="grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15 sm:size-8"
            >
              {full ? <CornersIn className="size-4" /> : <CornersOut className="size-4" />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
