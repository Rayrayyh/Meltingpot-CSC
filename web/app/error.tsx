"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MeltFrame } from "@/components/errors/melt-frame";

/**
 * The boundary for anything a page throws, on the same design as the 404 so
 * a broken page and a missing one read as one product. Production hides the
 * error's message from the browser; the digest is what the server log can
 * be searched for, so it is printed to the console for whoever is looking.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page]", error.digest ?? error.message);
  }, [error]);

  return (
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
      idPrefix="mp-pot-error"
    >
      <button type="button" onClick={reset} className="mp-404-cta">
        Try again
      </button>
      <Link href="/" className="mp-404-cta mp-404-cta-quiet">
        Go to homepage
      </Link>
    </MeltFrame>
  );
}
