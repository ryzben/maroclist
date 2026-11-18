import { TX_SLUGS, asLocale, parseAnyTxSlug, type Locale } from "@/lib/seo";

/**
 * Locale-less href for the language switcher: the same page in `target`, with the query string
 * kept intact (filters, sort, page, `next=`, …). Pass it to next-intl's <Link locale={target}>.
 *
 * Paths whose slug differs per locale are translated, e.g. /acheter/casablanca → /buy/casablanca.
 *
 * @param pathname locale-less path, as returned by next-intl's usePathname()
 * @param search   query string with or without the leading "?"
 */
export function localeSwitchHref(pathname: string, search: string, target: Locale | string): string {
  const path = translatePath(pathname || "/", asLocale(target));
  const query = search.startsWith("?") ? search.slice(1) : search;
  return query ? `${path}?${query}` : path;
}

function translatePath(pathname: string, target: Locale): string {
  const segs = pathname.split("/").filter(Boolean);
  // City pages: /<tx-slug>/<city>
  if (segs.length === 2) {
    const tx = parseAnyTxSlug(segs[0]);
    if (tx) return `/${TX_SLUGS[tx][target]}/${segs[1]}`;
  }
  return pathname;
}
