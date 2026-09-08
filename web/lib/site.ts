/**
 * The address the site is served at, for everything that has to name itself
 * in absolute terms: canonical links, the sitemap, social cards, structured
 * data. One constant rather than APP_ORIGIN, which is a server secret's
 * neighbour and unset in a plain local run; a page's own address is public.
 */
export const SITE_ORIGIN = "https://meltingpots.xyz";

/** The public pages, the ones a crawler or a model may read without an account. */
export const PUBLIC_PATHS = [
  "/",
  "/how-it-works",
  "/classes",
  "/contributions",
  "/privacy",
  "/terms",
] as const;

/** Signed in surfaces and the doors to them, which no index should carry. */
export const PRIVATE_PREFIXES = [
  "/home",
  "/p/",
  "/me",
  "/pots",
  "/study",
  "/calendar",
  "/search",
  "/login",
  "/signup",
  "/join",
  "/api/",
  "/dev/",
] as const;
