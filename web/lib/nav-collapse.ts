/**
 * The one place that knows whether the sidebar is collapsed.
 *
 * Stored per browser, stamped on the document as data-nav="collapsed" so the
 * shell, the nav rows and the notification card can all react from CSS
 * without threading state through server components. The inline script in
 * app/layout.tsx applies the stored value before first paint, so a collapsed
 * sidebar never flashes open on load.
 */

export const NAV_STORAGE_KEY = "mp:nav-collapsed";
const EVENT = "mp-nav-change";

export function readNavCollapsed(): boolean {
  try {
    return localStorage.getItem(NAV_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function applyNavCollapsed(next: boolean) {
  const root = document.documentElement;
  if (next) root.setAttribute("data-nav", "collapsed");
  else root.removeAttribute("data-nav");
  try {
    localStorage.setItem(NAV_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Best effort; the attribute still applies for the session.
  }
  markAnimating(root);
  window.dispatchEvent(new Event(EVENT));
}

/**
 * The rail's width is animated for a second. While it moves, the nav inside it
 * reflows at widths it was never laid out for, so its content briefly stands
 * taller than the scroller and a scrollbar flashes down the edge. The bar is
 * real, not a rendering artefact, and it is gone by the time anyone could use
 * it. This marks the root for the length of the transition so the scroller can
 * be told to keep quiet, and clears the mark on the transition's own end event
 * rather than on a guessed duration, with a timer only as a backstop for the
 * case where the transition never fires at all.
 */
let animationTimer: ReturnType<typeof setTimeout> | undefined;

function markAnimating(root: HTMLElement) {
  const side = document.querySelector(".mp-side");
  root.setAttribute("data-nav-animating", "");
  const done = () => {
    root.removeAttribute("data-nav-animating");
    clearTimeout(animationTimer);
    side?.removeEventListener("transitionend", onEnd);
  };
  const onEnd = (event: Event) => {
    if ((event as TransitionEvent).propertyName === "width") done();
  };
  clearTimeout(animationTimer);
  side?.addEventListener("transitionend", onEnd);
  animationTimer = setTimeout(done, 1200);
}

export function subscribeToNav(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
