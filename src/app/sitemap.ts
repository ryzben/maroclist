import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BASE = "https://maroclist.com";
const LOCALES = ["en", "fr", "ar"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { path: "",           priority: 1.0,  freq: "daily"   },
    { path: "/listings",  priority: 0.9,  freq: "daily"   },
    { path: "/post",      priority: 0.7,  freq: "monthly" },
    { path: "/login",     priority: 0.4,  freq: "monthly" },
    { path: "/signup",    priority: 0.4,  freq: "monthly" },
    { path: "/privacy",   priority: 0.3,  freq: "yearly"  },
    { path: "/terms",     priority: 0.3,  freq: "yearly"  },
  ];

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticRoutes.map(({ path, priority, freq }) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: freq as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority,
    }))
  );

  const supabase = await createSupabaseServerClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("is_active", true);

  // One canonical entry per listing (English) with hreflang alternates — avoids 3× duplication
  const listingEntries: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${BASE}/en/listings/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        en: `${BASE}/en/listings/${p.id}`,
        fr: `${BASE}/fr/listings/${p.id}`,
        ar: `${BASE}/ar/listings/${p.id}`,
      },
    },
  }));

  return [...staticEntries, ...listingEntries];
}
