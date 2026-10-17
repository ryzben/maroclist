import type { MetadataRoute } from "next";
import { LOCALES, SITE_URL } from "@/lib/seo";

// Private / per-user pages that should never be crawled
const PRIVATE = ["/my-listings", "/my-favourites", "/login", "/signup", "/forgot-password", "/reset-password", "/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...LOCALES.flatMap((l) => PRIVATE.map((p) => `/${l}${p}`))],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
