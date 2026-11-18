"use client";

import { Suspense } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from "@/lib/geoLocale";
import { localeSwitchHref } from "@/lib/localeSwitch";

const LOCALES = [
  { code: "fr", short: "FR", full: "Français", lang: "fr" },
  { code: "en", short: "EN", full: "English", lang: "en" },
  { code: "ar", short: "عر", full: "العربية", lang: "ar" },
] as const;

// An explicit pick always beats the country-based default on "/" (see middleware)
function rememberLocale(code: string) {
  document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
}

type Variant = "desktop" | "mobile";

interface Props {
  variant: Variant;
  /** Called after a language is picked (e.g. to close the mobile menu). */
  onPick?: () => void;
}

/**
 * Language links that keep the current path AND query string (filters, sort, page, `next=` …).
 * useSearchParams() needs a Suspense boundary on statically rendered pages; until it resolves the
 * links point at the bare path, which is still correct, just without the query.
 */
export default function LanguageSwitcher(props: Props) {
  return (
    <Suspense fallback={<Links {...props} search="" />}>
      <LinksWithQuery {...props} />
    </Suspense>
  );
}

function LinksWithQuery(props: Props) {
  const searchParams = useSearchParams();
  return <Links {...props} search={searchParams.toString()} />;
}

function Links({ variant, onPick, search }: Props & { search: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return LOCALES.map(({ code, short, full, lang }) => {
    const active = locale === code;
    return (
      <Link
        key={code}
        href={localeSwitchHref(pathname, search, code)}
        locale={code}
        hrefLang={lang}
        lang={lang}
        aria-current={active ? "true" : undefined}
        onClick={() => {
          rememberLocale(code);
          onPick?.();
        }}
        className={cn(
          "font-semibold transition",
          variant === "desktop"
            ? cn(
                "rounded-lg px-2.5 py-1 text-sm whitespace-nowrap",
                active
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm",
              )
            : cn(
                "flex-1 rounded-lg py-2 text-center text-sm",
                active ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50",
              ),
        )}
      >
        {variant === "desktop" ? (
          <>
            <span className="hidden lg:inline">{full}</span>
            <span className="lg:hidden">{short}</span>
          </>
        ) : (
          full
        )}
      </Link>
    );
  });
}
