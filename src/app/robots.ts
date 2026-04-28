import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/en/my-listings", "/fr/my-listings", "/ar/my-listings"],
    },
    sitemap: "https://maroclist.com/sitemap.xml",
  };
}
