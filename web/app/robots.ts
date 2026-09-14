import type { MetadataRoute } from "next";
import { PRIVATE_PREFIXES, SITE_ORIGIN } from "@/lib/site";

/**
 * Who may read what. Every crawler, the search engines' and the language
 * models' alike, is welcome on the public pages: what the product is, how a
 * class uses it, the privacy and terms pages. Nothing behind a sign in is
 * offered, and the sign in doors themselves are not worth an index entry.
 * /llms.txt is the same offer written for a model.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PREFIXES] }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
