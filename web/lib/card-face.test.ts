import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CARD_FACES,
  CARD_FACE_INK,
  CARD_FACE_STORAGE_KEY,
  DEFAULT_CARD_FACE,
  contrastRatio,
  isCardFaceId,
  readCardFace,
} from "./card-face";

describe("the card face colors", () => {
  it("every color keeps every ink the face uses at body text contrast", () => {
    for (const face of CARD_FACES) {
      for (const [name, ink] of Object.entries(CARD_FACE_INK)) {
        expect(contrastRatio(face.hex, ink), `${face.id} under ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("offers between three and seven choices, the default among them", () => {
    expect(CARD_FACES.length).toBeGreaterThanOrEqual(3);
    expect(CARD_FACES.length).toBeLessThanOrEqual(7);
    expect(CARD_FACES.some((face) => face.id === DEFAULT_CARD_FACE)).toBe(true);
    expect(CARD_FACES.some((face) => face.id === "white")).toBe(true);
  });

  it("measures contrast the WCAG way", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });
});

describe("readCardFace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function storage(value: string | null) {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === CARD_FACE_STORAGE_KEY ? value : null),
    });
  }

  it("answers the stored choice when it is one of the list", () => {
    storage("sky");
    expect(readCardFace()).toBe("sky");
  });

  it("falls back to the default for nothing, nonsense, or refused storage", () => {
    storage(null);
    expect(readCardFace()).toBe(DEFAULT_CARD_FACE);
    storage("neon");
    expect(readCardFace()).toBe(DEFAULT_CARD_FACE);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("refused");
      },
    });
    expect(readCardFace()).toBe(DEFAULT_CARD_FACE);
  });

  it("knows its own ids", () => {
    expect(isCardFaceId("peach")).toBe(true);
    expect(isCardFaceId("PEACH")).toBe(false);
    expect(isCardFaceId(null)).toBe(false);
  });
});
