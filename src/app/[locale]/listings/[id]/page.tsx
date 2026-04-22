import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { MapPin, BedDouble, Bath, Maximize2, Calendar, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import ImageLightbox from "@/components/ImageLightbox";
import PropertyCard from "@/components/PropertyCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatPrice, formatArea, timeAgo } from "@/lib/utils";
import type { Metadata } from "next";

interface PropertyDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function getProperty(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*, profiles(full_name, phone)")
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
  // If not enough, fill with same city
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
          {/* Left: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery / lightbox */}
            {property.images?.length > 0 ? (
              <ImageLightbox images={property.images} alt={title} />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl bg-gray-100">
                <span className="text-gray-400">{t("property.noPhoto")}</span>
              </div>
            )}

            {/* Video */}
            {property.video_url && getYouTubeEmbedUrl(property.video_url) && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
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

            {/* Title & price */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
                <div className="text-end">
                  <p className="text-2xl font-bold text-orange-500">
                    {formatPrice(property.price, property.currency)}
                  </p>
                  {property.transaction_type === "rent" && (
                    <p className="text-sm text-gray-500">{t("property.perMonth")}</p>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {cityLabel}
                  {property.neighborhood ? `, ${property.neighborhood}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {timeAgo(property.created_at, locale)}
                </span>
                <span className="text-gray-400">
                  {t("property.reference")} {property.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge bg-orange-100 text-orange-700">
                  {t(`property.types.${property.property_type}`)}
                </span>
                <span className={`badge text-white ${property.transaction_type === "sale" ? "bg-orange-500" : "bg-emerald-600"}`}>
                  {property.transaction_type === "sale" ? t("hero.forSale") : t("hero.forRent")}
                </span>
              </div>
            </div>

            {/* Stats */}
            {(property.area_sqm || property.bedrooms || property.bathrooms) && (
              <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-5">
                {property.area_sqm && (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Maximize2 className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-gray-900">{formatArea(property.area_sqm)}</span>
                    <span className="text-xs text-gray-500">{t("property.area")}</span>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <BedDouble className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-gray-900">{property.bedrooms}</span>
                    <span className="text-xs text-gray-500">{t("property.bedrooms")}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Bath className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-gray-900">{property.bathrooms}</span>
                    <span className="text-xs text-gray-500">{t("property.bathrooms")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-gray-900">{t("property.description")}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {description}
                </p>
              </div>
            )}

            {/* Map */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-white">
                <MapPin className="h-4 w-4 text-orange-500" />
                <h2 className="font-semibold text-gray-900">{t("property.location")}</h2>
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

          {/* Right: contact */}
          <div className="space-y-4">
            {property.contact_phone && (
              <a
                href={`tel:${property.contact_phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-4 font-semibold text-orange-700 hover:bg-orange-100 transition"
              >
                <Phone className="h-5 w-5" />
                {property.contact_phone}
              </a>
            )}

            <ContactForm
              propertyId={property.id}
              ownerEmail={property.contact_email}
              ownerPhone={property.contact_phone}
            />
          </div>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <section className="mt-14">
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
