import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { MapPin, BedDouble, Bath, Maximize2, Layers, Calendar, ShieldCheck, User, Tag, ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ShareBar from "@/components/ShareBar";
import AlertSignup from "@/components/AlertSignup";
import TrackEvent from "@/components/TrackEvent";
import { listingParams } from "@/lib/analytics";
import PhoneReveal from "@/components/PhoneReveal";
import FavouriteButton from "@/components/FavouriteButton";
import FeaturedToggle from "@/components/FeaturedToggle";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import ImageLightbox from "@/components/ImageLightbox";
import PropertyCard from "@/components/PropertyCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatPrice, formatArea, timeAgo, madToUsd } from "@/lib/utils";
import { listingTitle, formatLocation, cleanNeighborhood } from "@/lib/listingTitle";
import { listingMetaDescription, listingJsonLd, priceLine } from "@/lib/listingMeta";
import { SITE_URL, OG_LOCALE, asLocale, localeAlternates, jsonLdHtml } from "@/lib/seo";
import type { Metadata } from "next";

interface PropertyDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

// cache(): generateMetadata and the page share one query per request
const getProperty = cache(async function getProperty(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data;
});

async function getSimilarListings(id: string, city: string, propertyType: string) {
  const supabase = await createSupabaseServerClient();
  // Fetch up to 6 from same city, then prioritise same type — single query, no fallback
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .eq("city", city)
    .neq("id", id)
    .limit(6);
  const sameType = (data ?? []).filter((p) => p.property_type === propertyType);
  const others   = (data ?? []).filter((p) => p.property_type !== propertyType);
  return [...sameType, ...others].slice(0, 3);
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const property = await getProperty(id);
  if (!property) {
    const t = await getTranslations({ locale, namespace: "property" });
    return { title: t("notFound"), robots: { index: false } };
  }
  const title = listingTitle(property, locale);
  const description = listingMetaDescription(property, locale);
  return {
    title,
    description,
    alternates: localeAlternates(locale, () => `/listings/${id}`),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/listings/${id}`,
      type: "website",
      locale: OG_LOCALE[asLocale(locale)],
      // images come from ./opengraph-image.tsx (photo + MAD/USD price + city)
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id, locale } = await params;
  const supabase = await createSupabaseServerClient();
  const [property, t, { data: { user } }] = await Promise.all([
    getProperty(id),
    getTranslations(),
    supabase.auth.getUser(),
  ]);

  if (!property) notFound();

  const [similar, savedRow, sellerRow] = await Promise.all([
    getSimilarListings(id, property.city, property.property_type),
    user
      ? supabase.from("user_favorites").select("property_id").eq("user_id", user.id).eq("property_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("full_name").eq("id", property.user_id).maybeSingle(),
  ]);
  const isSaved = !!savedRow?.data;
  // Imported agency listings are owned by the admin account, so show the agency, not the admin's name
  const sellerName = property.partner_name || sellerRow?.data?.full_name || null;

  const title = listingTitle(property, locale);
  const description =
    locale === "ar" && property.description_ar
      ? property.description_ar
      : property.description;

  const cityLabel = t(`cities.${property.city}`);
  const location = formatLocation(property, locale);
  const neighborhood = cleanNeighborhood(property);
  const mapQuery = encodeURIComponent(
    `${neighborhood ? neighborhood + ", " : ""}${formatLocation({ city: property.city }, "fr")}, Maroc`
  );

  const jsonLd = listingJsonLd(property, locale, property.images ?? []);
  const trackParams = listingParams(property);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <TrackEvent event="view_listing" params={trackParams} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left column: images + details ── */}
          <div className="lg:col-span-2 space-y-6">

            <FeaturedToggle propertyId={property.id} initialFeatured={property.is_featured} />

            {/* Image gallery */}
            {property.images?.length > 0 ? (
              <ImageLightbox images={property.images} alt={title} />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-2xl bg-gray-100">
                <span className="text-gray-400">{t("property.noPhoto")}</span>
              </div>
            )}

            {/* YouTube video */}
            {property.video_url && getYouTubeEmbedUrl(property.video_url) && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <iframe
                  title="video"
                  width="100%"
                  height="360"
                  src={getYouTubeEmbedUrl(property.video_url)!}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="block"
                />
              </div>
            )}

            {/* Title, price, badges */}
            <div className="space-y-4">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {timeAgo(property.created_at, locale)}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {t("property.reference")} {property.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{title}</h1>
                  {property.highlight && (
                    <p dir="auto" className="mt-1 text-base font-medium text-orange-700">{property.highlight}</p>
                  )}
                </div>
                <FavouriteButton
                  propertyId={id}
                  initialSaved={isSaved}
                  className="mt-1 shrink-0 shadow-sm"
                />
              </div>

              {/* Location */}
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 flex-shrink-0 text-orange-400" />
                {location}
              </p>

              {/* Price block */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4">
                <p className="text-3xl font-extrabold tracking-tight text-orange-600">
                  {formatPrice(property.price, property.currency)}
                </p>
                {property.transaction_type === "rent" && (
                  <p className="mt-0.5 text-sm font-medium text-orange-500">{t("property.perMonth")}</p>
                )}
                {property.transaction_type === "holiday_rental" && (
                  <p className="mt-0.5 text-sm font-medium text-orange-500">{t("property.perNight")}</p>
                )}
                {(!property.currency || property.currency === "MAD") && (
                  <p className="mt-1.5 text-sm text-gray-400">
                    {t("property.priceUsd", { usd: madToUsd(property.price) })}
                  </p>
                )}
              </div>

              {/* Type badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {t(`property.types.${property.property_type}`)}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
                  property.transaction_type === "sale" ? "bg-orange-500" : "bg-emerald-600"
                }`}>
                  {property.transaction_type === "sale" ? t("hero.forSale") : t("hero.forRent")}
                </span>
              </div>

              {/* Share */}
              <ShareBar
                title={title}
                priceText={priceLine(property, locale)}
                location={location}
                url={`https://maroclist.com/${locale}/listings/${id}`}
                trackParams={trackParams}
              />
            </div>

            {/* Key stats */}
            {(property.area_sqm || property.bedrooms || property.bathrooms || property.floor) && (
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0">
                {property.area_sqm && (
                  <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                      <Maximize2 className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-900">{formatArea(property.area_sqm)}</span>
                    <span className="text-xs text-gray-500">{t("property.area")}</span>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                      <BedDouble className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-900">{property.bedrooms}</span>
                    <span className="text-xs text-gray-500">{t("property.bedrooms")}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                      <Bath className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-900">{property.bathrooms}</span>
                    <span className="text-xs text-gray-500">{t("property.bathrooms")}</span>
                  </div>
                )}
                {property.floor && (
                  <div className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-900">{property.floor}</span>
                    <span className="text-xs text-gray-500">{t("property.floor")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">{t("property.description")}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {description}
                </p>
              </div>
            )}

            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-5 py-3.5">
                <MapPin className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-900">{t("property.location")}</h2>
              </div>
              <iframe
                title="map"
                width="100%"
                height="300"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=13`}
                className="block"
              />
            </div>
          </div>

          {/* ── Right column: seller + contact ── */}
          <div className="space-y-4">

            {/* Seller identity card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {sellerName ?? t("property.privateSeller")}
                  </p>
                  {property.is_verified_partner && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {t("property.verifiedPartner")}
                    </p>
                  )}
                </div>
              </div>

              {property.contact_phone && (
                <PhoneReveal
                  phone={property.contact_phone}
                  locale={locale}
                  title={title}
                  trackParams={trackParams}
                />
              )}

              {!property.partner_name && (
                <Link
                  href={`/profile/${property.user_id}`}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                >
                  {t("profile.viewProfile")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Contact / message form */}
            <ContactForm
              propertyId={property.id}
              ownerPhone={property.contact_phone}
              trackParams={trackParams}
            />

            {/* Trust notice */}
            <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>{t("property.trustNotice")}</span>
            </div>
          </div>
        </div>

        <AlertSignup
          city={property.city}
          propertyType={property.property_type}
          transactionType={property.transaction_type}
          budgetMax={Number(property.price) * 1.2}
          source="listing"
          className="mt-12"
        />

        {/* Similar listings */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              {t("property.similar")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
