import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import SearchFilter from "@/components/SearchFilter";
import SortSelect from "@/components/SortSelect";
import CityEmptyState from "@/components/CityEmptyState";
import FavouriteButton from "@/components/FavouriteButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PropertyFilters, City, PropertyType, TransactionType } from "@/types/property";
import { CITY_DATA, type CityKey } from "@/lib/cityData";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale });
  const city = sp?.city as string | undefined;
  const cityLabel = city ? t(`cities.${city}`) : null;
  const title = cityLabel
    ? `Immobilier à ${cityLabel} — Acheter au Maroc depuis les USA | Maroclist`
    : t("nav.listings");
  const description = cityLabel
    ? `Trouvez des appartements, villas et terrains à ${cityLabel} au Maroc. Plateforme immobilière dédiée à la diaspora marocaine aux États-Unis et au Canada.`
    : undefined;
  return {
    title,
    description,
    alternates: {
      canonical: `https://maroclist.com/${locale}/listings${city ? `?city=${city}` : ""}`,
      languages: {
        en: `https://maroclist.com/en/listings${city ? `?city=${city}` : ""}`,
        fr: `https://maroclist.com/fr/listings${city ? `?city=${city}` : ""}`,
        ar: `https://maroclist.com/ar/listings${city ? `?city=${city}` : ""}`,
      },
    },
  };
}

interface ListingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

const PAGE_SIZE = 24;

async function getProperties(filters: PropertyFilters, page: number, sort: string) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.property_type) query = query.eq("property_type", filters.property_type);
  if (filters.transaction_type) query = query.eq("transaction_type", filters.transaction_type);
  if (filters.price_min) query = query.gte("price", filters.price_min);
  if (filters.price_max) query = query.lte("price", filters.price_max);
  if (filters.bedrooms) query = query.gte("bedrooms", filters.bedrooms);
  if (filters.search) {
    // Escape LIKE wildcards and PostgREST filter special chars to prevent injection
    const safe = filters.search
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/[(),]/g, "");
    query = query.or(`title.ilike.%${safe}%,title_ar.ilike.%${safe}%`);
  }

  // Sort
  query = query.order("is_featured", { ascending: false });
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { properties: data ?? [], total: count ?? 0 };
}

export default async function ListingsPage({ params, searchParams }: ListingsPageProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort || "newest";

  const filters: PropertyFilters = {
    city: (sp.city as City) || "",
    property_type: (sp.property_type as PropertyType) || "",
    transaction_type: (sp.transaction_type as TransactionType) || "",
    price_min: sp.price_min ? Number(sp.price_min) : undefined,
    price_max: sp.price_max ? Number(sp.price_max) : undefined,
    bedrooms: sp.bedrooms ? Number(sp.bedrooms) : undefined,
    search: sp.search || "",
  };

  const supabase = await createSupabaseServerClient();
  const [{ properties, total }, { data: { user } }] = await Promise.all([
    getProperties(filters, page, sort),
    supabase.auth.getUser(),
  ]);

  let savedIds = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("user_favorites")
      .select("property_id")
      .eq("user_id", user.id);
    savedIds = new Set((favs ?? []).map((f) => f.property_id));
  }

  const t = await getTranslations();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams(sp as Record<string, string>);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, String(v));
      else p.delete(k);
    }
    return `/listings?${p.toString()}`;
  }

  const cityLabel = filters.city ? t(`cities.${filters.city}`) : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("nav.home"), item: `https://maroclist.com/${locale}` },
      { "@type": "ListItem", position: 2, name: t("nav.listings"), item: `https://maroclist.com/${locale}/listings` },
      ...(cityLabel ? [{ "@type": "ListItem", position: 3, name: cityLabel, item: `https://maroclist.com/${locale}/listings?city=${filters.city}` }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <Suspense>
            <SearchFilter filters={filters} total={total} />
          </Suspense>

          <div className="flex-1 min-w-0">
            {/* Header row: count + sort */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {t("filter.results", { count: total })}
              </p>
              <Suspense>
                <SortSelect sort={sort} />
              </Suspense>
            </div>

            {properties.length === 0 ? (
              filters.city && CITY_DATA[filters.city as CityKey] ? (
                (() => {
                  const data = CITY_DATA[filters.city as CityKey];
                  const loc = locale as "fr" | "en" | "ar";
                  const cityLabel = t(`cities.${filters.city}`);
                  return (
                    <CityEmptyState
                      city={filters.city as CityKey}
                      cityLabel={cityLabel}
                      desc={data.desc[loc] ?? data.desc.fr}
                      prices={data.prices[loc] ?? data.prices.fr}
                      neighborhoods={data.neighborhoods}
                      locale={locale}
                      t={{
                        title: t("cityEmpty.title", { city: cityLabel }),
                        subtitle: t("cityEmpty.subtitle"),
                        postCta: t("cityEmpty.postCta"),
                        browseCta: t("cityEmpty.browseCta"),
                        marketTitle: t("cityEmpty.marketTitle", { city: cityLabel }),
                        pricesTitle: t("cityEmpty.pricesTitle"),
                        neighborhoodsTitle: t("cityEmpty.neighborhoodsTitle"),
                        alertTitle: t("cityEmpty.alertTitle"),
                        alertDesc: t("cityEmpty.alertDesc", { city: cityLabel }),
                        alertPlaceholder: t("cityEmpty.alertPlaceholder"),
                        alertSubmit: t("cityEmpty.alertSubmit"),
                        alertSuccess: t("cityEmpty.alertSuccess"),
                      }}
                    />
                  );
                })()
              ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center">
                <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 font-semibold text-gray-900">{t("property.noResults")}</h3>
                <p className="mt-1 text-sm text-gray-500">{t("property.noResultsDesc")}</p>
              </div>)
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((p) => (
                    <div key={p.id} className="relative">
                      <PropertyCard property={p} />
                      <FavouriteButton
                        propertyId={p.id}
                        initialSaved={savedIds.has(p.id)}
                        className="absolute bottom-[224px] start-3 z-10"
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1">
                    {page > 1 && (
                      <Link
                        href={buildUrl({ page: page - 1 })}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                      >
                        ←
                      </Link>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                          <Link
                            key={p}
                            href={buildUrl({ page: p })}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              p === page
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </Link>
                        )
                      )}

                    {page < totalPages && (
                      <Link
                        href={buildUrl({ page: page + 1 })}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                      >
                        →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
