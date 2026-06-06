import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import FavouriteButton from "@/components/FavouriteButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Property } from "@/types/property";

export default async function MyFavouritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: favRows } = await supabase
    .from("user_favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const propertyIds = (favRows ?? []).map((r) => r.property_id);

  let properties: Property[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .in("id", propertyIds)
      .eq("is_active", true);
    // Preserve saved order
    const map = Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    properties = propertyIds.map((id) => map[id]).filter(Boolean) as Property[];
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("favourites.title")}</h1>
            <p className="text-sm text-gray-500">
              {t("favourites.count", { count: properties.length })}
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <Heart className="mb-4 h-12 w-12 text-gray-200" />
            <p className="font-semibold text-gray-700">{t("favourites.empty")}</p>
            <p className="mt-1 text-sm text-gray-400">{t("favourites.emptyDesc")}</p>
            <Link href="/listings" className="btn-primary mt-6">
              {t("favourites.browseCta")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((p) => (
              <div key={p.id} className="relative">
                <PropertyCard property={p} />
                <FavouriteButton
                  propertyId={p.id}
                  initialSaved
                  className="absolute bottom-[224px] start-3 z-10"
                />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
