import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "ar"],
  defaultLocale: "fr",
  localePrefix: "always",
  // hreflang is emitted as <link> tags instead (x-default → /en, localized city slugs) — see HreflangLinks
  alternateLinks: false,
});
