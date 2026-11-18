import type { Metadata } from "next";
import { CITIES, type City } from "@/types/property";

export const SITE_URL = "https://maroclist.com";
export const LOCALES = ["en", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
/** hreflang x-default target — visitors outside Morocco land on English (see middleware). */
export const X_DEFAULT_LOCALE: Locale = "en";

export type CityPageTx = "sale" | "rent";

// /en/buy/casablanca · /fr/acheter/casablanca · /ar/buy/casablanca (Latin slugs keep Arabic URLs shareable)
export const TX_SLUGS: Record<CityPageTx, Record<Locale, string>> = {
  sale: { en: "buy", fr: "acheter", ar: "buy" },
  rent: { en: "rent", fr: "louer", ar: "rent" },
};

/** The cities that always get an indexable page (they have hand-written market copy in cityData). */
export const PRIORITY_CITIES: City[] = ["casablanca", "marrakech", "rabat", "tanger", "agadir", "fes"];

export function asLocale(locale: string): Locale {
  return (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : DEFAULT_LOCALE;
}

/** Locale-less path, for next-intl <Link href>. */
export function cityPagePath(locale: string, tx: CityPageTx, city: string): string {
  return `/${TX_SLUGS[tx][asLocale(locale)]}/${city}`;
}

export function parseTxSlug(locale: string, slug: string): CityPageTx | null {
  const l = asLocale(locale);
  if (TX_SLUGS.sale[l] === slug) return "sale";
  if (TX_SLUGS.rent[l] === slug) return "rent";
  return null;
}

/** A slug that's valid in *some* locale — used to redirect /fr/buy/x → /fr/acheter/x. */
export function parseAnyTxSlug(slug: string): CityPageTx | null {
  for (const tx of ["sale", "rent"] as const) {
    if (Object.values(TX_SLUGS[tx]).includes(slug)) return tx;
  }
  return null;
}

export function isCityPageCity(city: string): city is City {
  return city !== "other" && (CITIES as string[]).includes(city);
}

/**
 * canonical + hreflang (en/fr/ar + x-default) for a page whose path differs per locale.
 * `pathFor` returns the locale-less path, e.g. l => `/listings/${id}`.
 */
export function localeAlternates(locale: string, pathFor: (l: Locale) => string): Metadata["alternates"] {
  const url = (l: Locale) => `${SITE_URL}/${l}${pathFor(l)}`;
  return {
    canonical: url(asLocale(locale)),
    languages: {
      en: url("en"),
      fr: url("fr"),
      ar: url("ar"),
      "x-default": url(X_DEFAULT_LOCALE),
    },
  };
}

/**
 * Pages whose generateMetadata emits their own hreflang set (query-aware or with per-locale slugs).
 * Every other page gets the generic same-path set from <HreflangLinks /> in the locale layout.
 * `path` is locale-less, as returned by next-intl's usePathname().
 */
export function pageSetsOwnAlternates(path: string): boolean {
  if (path === "/" || path === "" || path === "/listings" || path.startsWith("/listings/")) return true;
  const segs = path.split("/").filter(Boolean);
  return segs.length === 2 && parseAnyTxSlug(segs[0]) !== null;
}

export function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

export const OG_LOCALE: Record<Locale, string> = { en: "en_US", fr: "fr_MA", ar: "ar_MA" };

/** JSON-LD for a <script> tag — escapes "<" so seller-written text can't close the tag. */
export function jsonLdHtml(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
