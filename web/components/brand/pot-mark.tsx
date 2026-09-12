/* eslint-disable @next/next/no-img-element */

/**
 * The MeltingPot brand mark: the owner's pot artwork, orange with liquid
 * blobs and the lowercase m, on a transparent ground so it sits on any
 * surface: cream, dark, or the browser's tab strip.
 *
 * This used to be a hand-drawn SVG approximation of that artwork. The owner
 * asked for the real logo everywhere (2026-08-29), so the component now
 * renders the artwork itself; the favicon and app icon were already built
 * from the same file, so every surface finally agrees. The idPrefix prop
 * survives as a no-op so existing call sites do not churn.
 */
export function PotMark(props: {
  className?: string;
  title?: string;
  /** Kept for call-site compatibility; the raster mark has no SVG defs to
   *  namespace. */
  idPrefix?: string;
}) {
  const { className, title } = props;
  return (
    <img
      // 192 square, which covers the biggest slot the mark ever fills (the
      // route loader's size-22, 88px) on a 2x screen with room over. The
      // 610px master is still in public/brand/pot-logo.png; it was what this
      // rendered until 2026-09-11, at 165KB for a mark that is usually drawn
      // at 28px, and React hoists a preload for every eager image, so it was
      // the first thing every page fetched. The WebP is 15KB.
      src="/brand/pot-logo.webp"
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={192}
      height={192}
      className={className}
      draggable={false}
    />
  );
}
