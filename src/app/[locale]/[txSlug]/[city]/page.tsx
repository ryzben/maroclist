import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import AlertSignup from "@/components/AlertSignup";
import { createSupabasePublicClient } from "@/lib/supabase-public";
import { sortByCompleteness } from "@/lib/listingQuality";
import { computeCityStats, cityCopy } from "@/lib/cityIntro";
import { cityLabel, listingTitle } from "@/lib/listingTitle";
import { CITY_DATA, type CityKey } from "@/lib/cityData";
import {
  LOCALES,
  PRIORITY_CITIES,
  SITE_URL,
  TX_SLUGS,
  asLocale,
  cityPagePath,
  isCityPageCity,
  localeAlternates,
  parseAnyTxSlug,
  parseTxSlug,
  OG_LOCALE,
  jsonLdHtml,
  type CityPageTx,
} from "@/lib/seo";
import type { Metadata } from "next";
import type { Property } from "@/types/property";

// Re-generate at most hourly; priority cities are pre-rendered at build, the rest on first visit
export const revalidate = 3600;

interface CityPageProps {
  params: Promise<{ locale: string; txSlug: string; city: string }>;
}

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    (["sale", "rent"] as const).flatMap((tx) =>
      PRIORITY_CITIES.map((city) => ({ locale, txSlug: TX_SLUGS[tx][locale], city }))
    )
  );
}

async function getCityListings(city: string, tx: CityPageTx) {
  const supabase = createSupabasePublicClient();
  const { data, count } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .eq("city", city)
    .eq("transaction_type", tx)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Property[];
  return { rows, stats: computeCityStats(city, rows, count ?? rows.length) };
}

async function resolve(params: CityPageProps["params"]) {
  const { locale, txSlug, city } = await params;
  const tx = parseTxSlug(locale, txSlug);
  if (!isCityPageCity(city)) return null;
  if (!tx) {
    // Right page, wrong language slug (e.g. /fr/buy/casablanca) → canonical slug for this locale
    const other = parseAnyTxSlug(txSlug);
    if (other) permanentRedirect(`/${locale}${cityPagePath(locale, other, city)}`);
    return null;
  }
  return { locale: asLocale(locale), tx, city };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  const { stats } = await getCityListings(r.city, r.tx);
  const copy = cityCopy(r.city, r.tx, r.locale, stats);
  // Thin pages (no listings, no hand-written market copy) stay out of the index until they have inventory
  const indexable = stats.count > 0 || PRIORITY_CITIES.includes(r.city);
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: localeAlternates(r.locale, (l) => cityPagePath(l, r.tx, r.city)),
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: `${SITE_URL}/${r.locale}${cityPagePath(r.locale, r.tx, r.city)}`,
      locale: OG_LOCALE[r.locale],
      type: "website",
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const r = await resolve(params);
  if (!r) notFound();
  const { locale, tx, city } = r;
  setRequestLocale(locale);

  const [{ rows, stats }, t] = await Promise.all([getCityListings(city, tx), getTranslations({ locale })]);
  const copy = cityCopy(city, tx, locale, stats);
  const listings = sortByCompleteness(rows).slice(0, 24);
  const label = cityLabel(city, locale);
  const market = CITY_DATA[city as CityKey];
  const pageUrl = `${SITE_URL}/${locale}${cityPagePath(locale, tx, city)}`;
  const otherTx: CityPageTx = tx === "sale" ? "rent" : "sale";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("nav.home"), item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: t("nav.listings"), item: `${SITE_URL}/${locale}/listings` },
        { "@type": "ListItem", position: 3, name: copy.h1, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: copy.h1,
      numberOfItems: stats.count,
      itemListElement: listings.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${locale}/listings/${p.id}`,
        name: listingTitle(p, locale),
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-gray-400" aria-label="breadcrumb">
          <Link href="/" className="hover:text-orange-500">{t("nav.home")}</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-orange-500">{t("nav.listings")}</Link>
          <span>/</span>
          <span className="text-gray-600">{label}</span>
        </nav>

        <header className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{copy.h1}</h1>
          {copy.intro.map((p) => (
            <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-gray-600 sm:text-base">{p}</p>
          ))}
          {market && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold">{t("cityEmpty.pricesTitle")}:</span> {market.prices[locale]}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/listings?city=${city}&transaction_type=${tx}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              {t("cityPage.filterCta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              href={cityPagePath(locale, otherTx, city)}
              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {otherTx === "rent" ? t("cityPage.rentIn", { city: label }) : t("cityPage.buyIn", { city: label })}
            </Link>
          </div>
        </header>

        {listings.length > 0 ? (
          <section className="mt-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            {stats.count > listings.length && (
              <div className="mt-8 text-center">
                <Link
                  href={`/listings?city=${city}&transaction_type=${tx}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600"
                >
                  {t("cityPage.seeAll", { count: stats.count })}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="font-semibold text-gray-900">{t("cityEmpty.title", { city: label })}</p>
            <p className="mt-1 text-sm text-gray-500">{t("cityEmpty.subtitle")}</p>
            <Link href="/post" className="btn-primary mt-5 inline-flex">{t("cityEmpty.postCta")}</Link>
          </section>
        )}

        <AlertSignup city={city} transactionType={tx} source="city_page" className="mt-10" />

        {/* Internal links to sibling city pages */}
        <section className="mt-16 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">{t("cityPage.otherCities")}</h2>
          <ul className="flex flex-wrap gap-2">
            {PRIORITY_CITIES.filter((c) => c !== city).map((c) => (
              <li key={c}>
                <Link
                  href={cityPagePath(locale, tx, c)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-orange-300 hover:text-orange-600"
                >
                  <MapPin className="h-3 w-3" />
                  {cityLabel(c, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
