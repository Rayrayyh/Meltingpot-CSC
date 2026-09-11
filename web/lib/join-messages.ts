/**
 * What a failed class code says, in one place both sides can read.
 *
 * These used to live in join-card.tsx. That file is a client component, and
 * an export of one reaches a server component as a reference to the module
 * rather than the value itself: /home read INVALID_CODE_MESSAGE and got
 * nothing, and the landing's lookup of JOIN_ERRORS came back empty, so a
 * dead invite link rendered the landing as though nothing had gone wrong.
 * Plain strings belong in a plain module.
 */

export const INVALID_CODE_MESSAGE =
  "We couldn't find that Pot. Check the code and try again.";

/** Said when the code is real but the owner has closed joining for now. */
export const CLOSED_POT_MESSAGE =
  "That class is not taking new members right now. Ask whoever runs it to open joining again.";

/**
 * The failures a dead or blocked invite link can carry back, keyed by the
 * `error` search param /join/[code] redirects with. The landing used to
 * render these under its own code field; since the bento replaced that
 * field, the landing hands them to the pages that still have one.
 */
export const JOIN_ERRORS: Record<string, string> = {
  notfound: INVALID_CODE_MESSAGE,
  closed: CLOSED_POT_MESSAGE,
  busy: "Too many tries from this network. Wait a few minutes and try again.",
  error: "We couldn't reach that Pot just now. Try again in a moment.",
};
