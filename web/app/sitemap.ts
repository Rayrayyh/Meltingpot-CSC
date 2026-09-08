import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, SITE_ORIGIN } from "@/lib/site";

/** The public pages, with the landing first. Dated at build, which is when they change. */
export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified: built,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/privacy" || path === "/terms" ? 0.3 : 0.7,
  }));
}
