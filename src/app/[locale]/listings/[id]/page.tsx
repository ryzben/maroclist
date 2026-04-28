import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { MapPin, BedDouble, Bath, Maximize2, Calendar, Phone, ShieldCheck, User, Tag, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import ImageLightbox from "@/components/ImageLightbox";
import PropertyCard from "@/components/PropertyCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatPrice, formatArea, timeAgo, madToUsd, whatsappUrl } from "@/lib/utils";
import type { Metadata } from "next";

interface PropertyDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getProperty(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data;
}

async function getSimilarListings(id: string, city: string, propertyType: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .eq("city", city)
    .eq("property_type", propertyType)
    .neq("id", id)
    .limit(3);
  if ((data?.length ?? 0) < 3) {
    const { data: cityData } = await supabase
      .from("properties")
      .select("*")
      .eq("is_active", true)
      .eq("city", city)
      .neq("id", id)
      .limit(3);
    const merged = [...(data ?? [])];
    for (const item of cityData ?? []) {
      if (!merged.find((m) => m.id === item.id)) merged.push(item);
      if (merged.length >= 3) break;
    }
    return merged;
  }
  return data ?? [];
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
    return { title: t("notFound") };
  }
  const title = locale === "ar" && property.title_ar ? property.title_ar : property.title;
  return {
    title,
    description: property.description ?? undefined,
    openGraph: {
      title,
      images: property.images?.[0] ? [property.images[0]] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id, locale } = await params;
  const [property, t] = await Promise.all([
    getProperty(id),
    getTranslations(),
  ]);

  if (!property) notFound();

  const similar = await getSimilarListings(id, property.city, property.property_type);

  const title = locale === "ar" && property.title_ar ? property.title_ar : property.title;
  const description =
    locale === "ar" && property.description_ar
      ? property.description_ar
      : property.description;

  const cityLabel = t(`cities.${property.city}`);
  const mapQuery = encodeURIComponent(
    `${property.neighborhood ? property.neighborhood + ", " : ""}${cityLabel}, Maroc`
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left column: images + details ── */}
          <div className="lg:col-span-2 space-y-6">

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
              {/* Verified badge + meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Annonce vérifiée
                </span>
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
              <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{title}</h1>

              {/* Location */}
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 flex-shrink-0 text-orange-400" />
                {cityLabel}{property.neighborhood ? `, ${property.neighborhood}` : ""}
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
                  <p className="mt-0.5 text-sm font-medium text-orange-500">/ nuit</p>
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
            </div>

            {/* Key stats */}
            {(property.area_sqm || property.bedrooms || property.bathrooms) && (
              <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                <div>
                  <p className="font-semibold text-gray-900">Vendeur particulier</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Profil vérifié
                  </span>
                </div>
              </div>

              {property.contact_phone && (
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${property.contact_phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[.98]"
                  >
                    <Phone className="h-4 w-4" />
                    Appeler le vendeur
                  </a>
                  <a
                    href={whatsappUrl(
                      property.contact_phone,
                      locale === "ar"
                        ? `مرحباً، أنا مهتم بإعلانك على مروكليست: ${title}`
                        : locale === "en"
                        ? `Hello, I'm interested in your listing on Maroclist: ${title}`
                        : `Bonjour, je suis intéressé par votre annonce sur Maroclist : ${title}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] active:scale-[.98]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("property.whatsapp")}
                  </a>
                </div>
              )}
            </div>

            {/* Contact / message form */}
            <ContactForm
              propertyId={property.id}
              propertyTitle={title}
              ownerEmail={property.contact_email}
              ownerPhone={property.contact_phone}
            />

            {/* Trust notice */}
            <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>
                Ne payez jamais à l&apos;avance. Visitez le bien avant tout versement et méfiez-vous des offres trop alléchantes.
              </span>
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              {t("property.similar") ?? "Annonces similaires"}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p: any) => (
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
