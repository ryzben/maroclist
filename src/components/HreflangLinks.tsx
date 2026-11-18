"use client";

import { usePathname } from "@/i18n/navigation";
import { LOCALES, SITE_URL, X_DEFAULT_LOCALE, pageSetsOwnAlternates } from "@/lib/seo";

/**
 * hreflang alternates for every page whose path is identical across locales. React hoists these
 * <link>s into <head>. Pages with query- or slug-specific alternates set them via generateMetadata.
 */
export default function HreflangLinks() {
  const pathname = usePathname();
  if (pageSetsOwnAlternates(pathname)) return null;
  const url = (l: string) => `${SITE_URL}/${l}${pathname === "/" ? "" : pathname}`;

  return (
    <>
      {LOCALES.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={url(l)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url(X_DEFAULT_LOCALE)} />
    </>
  );
}
