/**
 * First-visit language choice for "/". Kept free of Next.js imports so it can be unit-checked in isolation.
 */

export const LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

/** Set whenever the user explicitly picks a language; "/" always honours it over geo. */
export const LANG_COOKIE = "ml_lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(v: string | null | undefined): v is AppLocale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** Country from the edge geo header (Vercel, then Cloudflare). "XX"/"T1" are Cloudflare's unknown/Tor codes. */
export function countryFromHeaders(get: (name: string) => string | null): string | null {
  const raw = get("x-vercel-ip-country") ?? get("cf-ipcountry");
  const c = raw?.trim().toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : null;
}

/** Fallback when there's no geo header: a region subtag in Accept-Language ("fr-MA", "ar-MA") counts as Morocco. */
export function countryFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim();
    const region = tag.split("-").slice(1).find((s) => /^[A-Za-z]{2}$/.test(s));
    if (region?.toUpperCase() === "MA") return "MA";
  }
  return null;
}

/**
 * Locale for a visit to "/": the user's saved pick wins; otherwise Morocco → French, everywhere else → English.
 */
export function pickRootLocale({
  cookie,
  country,
  acceptLanguage,
}: {
  cookie: string | null | undefined;
  country: string | null;
  acceptLanguage: string | null;
}): AppLocale {
  if (isLocale(cookie)) return cookie;
  const c = country ?? countryFromAcceptLanguage(acceptLanguage);
  return c === "MA" ? "fr" : "en";
}
