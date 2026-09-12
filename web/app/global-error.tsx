"use client";

import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { MeltFrame } from "@/components/errors/melt-frame";
import "./globals.css";

// The root boundary replaces the root layout, fonts included, so the two
// faces the frame uses are loaded here again. Not preloaded: this file is a
// client module in the shared bundle, so its font declarations put a preload
// link on every page in the site for a surface that only renders when the
// root layout itself has crashed. That was 41KB of Bricolage ahead of the
// hero on every visit.
// The weight lists match the root layout's exactly. next/font hashes a file
// per family and weight set, so asking for a different subset of the same
// family here produced a second copy of Figtree, 20KB, downloaded alongside
// the first on every page.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  preload: false,
});
const figtree = Figtree({
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  preload: false,
});

/**
 * What renders when the root layout itself fails. It cannot lean on anything
 * the layout provides, so it is a whole document: the frame, its fonts, and
 * the stylesheet the frame's classes live in.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body style={{ margin: 0 }}>
        <MeltFrame
          digits={["5", "0"]}
          title="Something boiled over."
          body={
            <>
              Nothing was lost. Try again, or head back and pick up where you
              left off.
              {error.digest ? (
                <span style={{ display: "block", marginTop: 10, fontSize: 14, color: "#8A7561" }}>
                  Reference {error.digest}
                </span>
              ) : null}
            </>
          }
          idPrefix="mp-pot-global-error"
        >
          <button type="button" onClick={reset} className="mp-404-cta">
            Try again
          </button>
          <Link href="/" className="mp-404-cta mp-404-cta-quiet">
            Go to homepage
          </Link>
        </MeltFrame>
      </body>
    </html>
  );
}
