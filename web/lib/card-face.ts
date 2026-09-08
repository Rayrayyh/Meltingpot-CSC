/**
 * The color of a flashcard's face, chosen in settings.
 *
 * A flashcard is a printed card, so its face keeps the light theme's ink in
 * either theme and only its paper changes. Every color here has been checked
 * against the four ink tokens the face uses (lib/card-face.test.ts holds the
 * numbers): each pair clears 4.5 to 1, the level body text needs, so a color
 * that would make a hint or a label hard to read never reaches the list. The
 * choice is kept the way the theme is: in this browser, applied before first
 * paint by the script in app/layout.tsx, and read by CSS alone.
 */

export const CARD_FACE_STORAGE_KEY = "mp-card-face";
export const CARD_FACE_EVENT = "mp-card-face-change";

export type CardFaceId = "peach" | "white" | "cream" | "butter" | "sage" | "sky";

export const CARD_FACES: { id: CardFaceId; label: string; hex: string }[] = [
  { id: "peach", label: "Peach", hex: "#f7dfc6" },
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "cream", label: "Cream", hex: "#faf4e6" },
  { id: "butter", label: "Butter", hex: "#f8edc4" },
  { id: "sage", label: "Sage", hex: "#dfe9d6" },
  { id: "sky", label: "Sky", hex: "#dbe7f2" },
];

/** The lighter orange the owner asked for as the starting point. */
export const DEFAULT_CARD_FACE: CardFaceId = "peach";

/**
 * The ink the face paints over every color above. Slightly deeper than the
 * page's own faint and primary tokens, which sit at the edge of legibility on
 * a tinted card.
 */
export const CARD_FACE_INK = {
  ink: "#24222c",
  muted: "#5c5952",
  faint: "#665f50",
  primary: "#964d10",
} as const;

export const CARD_FACE_IDS = CARD_FACES.map((face) => face.id);

export function isCardFaceId(value: unknown): value is CardFaceId {
  return typeof value === "string" && (CARD_FACE_IDS as string[]).includes(value);
}

export function readCardFace(): CardFaceId {
  try {
    const stored = localStorage.getItem(CARD_FACE_STORAGE_KEY);
    if (isCardFaceId(stored)) return stored;
  } catch {
    // Private browsing can refuse storage; the default still applies.
  }
  return DEFAULT_CARD_FACE;
}

/** Applies a choice to the document and remembers it. The default carries no attribute. */
export function applyCardFace(next: CardFaceId) {
  const root = document.documentElement;
  if (next === DEFAULT_CARD_FACE) root.removeAttribute("data-card-face");
  else root.setAttribute("data-card-face", next);
  try {
    localStorage.setItem(CARD_FACE_STORAGE_KEY, next);
  } catch {
    // Persistence is best-effort; the attribute still applies for the session.
  }
  window.dispatchEvent(new Event(CARD_FACE_EVENT));
}

/** Fires on this tab's own changes and on another tab's. */
export function subscribeToCardFace(onChange: () => void) {
  window.addEventListener(CARD_FACE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CARD_FACE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** WCAG relative luminance of a six digit hex color. */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const channel = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** WCAG contrast ratio between two six digit hex colors. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
