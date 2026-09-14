import Link from "next/link";
import { MeltFrame } from "@/components/errors/melt-frame";

export const metadata = { title: "Page not found" };

/** The 404, from the supplied design file. The frame holds the design. */
export default function NotFound() {
  return (
    <MeltFrame
      digits={["4", "4"]}
      title="This page melted away."
      body={
        <>
          The page you&rsquo;re trying to reach doesn&rsquo;t exist or has been
          moved. Everything worth reading is back in the Pot.
        </>
      }
      idPrefix="mp-pot-404"
    >
      <Link href="/" className="mp-404-cta">
        Go to homepage
      </Link>
    </MeltFrame>
  );
}
