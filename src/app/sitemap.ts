import type { MetadataRoute } from "next";
import { createSupabasePublicClient } from "@/lib/supabase-public";
import { LOCALES, PRIORITY_CITIES, SITE_URL, cityPagePath, isCityPageCity, type CityPageTx, type Locale } from "@/lib/seo";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** One <url> per locale, each carrying the full en/fr/ar + x-default hreflang set. */
function localized(pathFor: (l: Locale) => string, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages = {
    en: `${SITE_URL}/en${pathFor("en")}`,
    fr: `${SITE_URL}/fr${pathFor("fr")}`,
    ar: `${SITE_URL}/ar${pathFor("ar")}`,
    "x-default": `${SITE_URL}/fr${pathFor("fr")}`,
  };
  return LOCALES.map((l) => ({ url: `${SITE_URL}/${l}${pathFor(l)}`, alternates: { languages }, ...rest }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: { path: string; priority: number; freq: Entry["changeFrequency"] }[] = [
    { path: "",          priority: 1.0, freq: "daily" },
    { path: "/listings", priority: 0.9, freq: "daily" },
    { path: "/sell",     priority: 0.6, freq: "monthly" },
    { path: "/agences",  priority: 0.5, freq: "monthly" },
    { path: "/post",     priority: 0.5, freq: "monthly" },
    { path: "/post/quick", priority: 0.6, freq: "monthly" },
    { path: "/privacy",  priority: 0.2, freq: "yearly" },
    { path: "/terms",    priority: 0.2, freq: "yearly" },
  ];
  const staticEntries = staticRoutes.flatMap(({ path, priority, freq }) =>
    localized(() => path, { lastModified: now, changeFrequency: freq, priority })
  );

  const supabase = createSupabasePublicClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, city, transaction_type, updated_at")
    .eq("is_active", true);

  const listingEntries = (properties ?? []).flatMap((p) =>
    localized(() => `/listings/${p.id}`, { lastModified: new Date(p.updated_at), changeFrequency: "weekly", priority: 0.6 })
  );

  // City pages: priority cities always, other cities only once they have inventory (matches the page's noindex rule)
  const cityTx = new Map<string, Date>();
  for (const tx of ["sale", "rent"] as const) for (const c of PRIORITY_CITIES) cityTx.set(`${tx}:${c}`, now);
  for (const p of properties ?? []) {
    const tx: CityPageTx = p.transaction_type === "sale" ? "sale" : "rent";
    if (p.transaction_type === "holiday_rental" || !isCityPageCity(p.city)) continue;
    const key = `${tx}:${p.city}`;
    const d = new Date(p.updated_at);
    if (!cityTx.has(key) || cityTx.get(key)! < d) cityTx.set(key, d);
  }
  const cityEntries = [...cityTx.entries()].flatMap(([key, lastModified]) => {
    const [tx, city] = key.split(":") as [CityPageTx, string];
    return localized((l) => cityPagePath(l, tx, city), { lastModified, changeFrequency: "daily", priority: 0.8 });
  });

  return [...staticEntries, ...cityEntries, ...listingEntries];
}
