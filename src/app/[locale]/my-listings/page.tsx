"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { PlusCircle, Pencil, Trash2, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/utils";
import type { Property } from "@/types/property";

export default function MyListingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setListings(data ?? []);
      setLoading(false);
    });
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm(t("nav.confirmDelete"))) return;
    setDeletingId(id);
    await supabase.from("properties").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("nav.myListings")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("nav.listingCount", { count: listings.length })}</p>
          </div>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            {t("nav.post")}
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">{t("common.loading")}</div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <p className="text-gray-500">{t("property.noResults")}</p>
            <Link href="/post" className="btn-primary">
              <PlusCircle className="h-4 w-4" />
              {t("nav.post")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const title = locale === "ar" && listing.title_ar ? listing.title_ar : listing.title;
              const mainImage = listing.images?.[0];
              return (
                <div key={listing.id} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                  {/* Thumbnail */}
                  <Link href={`/listings/${listing.id}`} className="shrink-0">
                    {mainImage ? (
                      <img src={mainImage} alt={title} className="h-24 w-32 rounded-xl object-cover sm:h-28 sm:w-40" />
                    ) : (
                      <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-gray-100 sm:h-28 sm:w-40">
                        <span className="text-xs text-gray-400">{t("property.noPhoto")}</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link href={`/listings/${listing.id}`} className="font-semibold text-gray-900 hover:text-orange-600 line-clamp-2">
                          {title}
                        </Link>
                        <p className="text-lg font-bold text-orange-500 shrink-0">
                          {formatPrice(listing.price, listing.currency)}
                        </p>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {t(`cities.${listing.city}`)}
                          {listing.neighborhood ? `, ${listing.neighborhood}` : ""}
                        </span>
                        {listing.bedrooms ? (
                          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{listing.bedrooms}</span>
                        ) : null}
                        {listing.bathrooms ? (
                          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.bathrooms}</span>
                        ) : null}
                        {listing.area_sqm ? (
                          <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{listing.area_sqm} m²</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{timeAgo(listing.created_at, locale)}</span>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${listing.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {listing.is_active ? t("nav.active") : t("nav.inactive")}
                        </span>
                        <Link
                          href={`/listings/${listing.id}`}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("nav.view")}
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === listing.id ? "..." : t("nav.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
