import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { User, LayoutGrid } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ userId: string; locale: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const t = await getTranslations({ locale, namespace: "profile" });
  return {
    title: profile?.full_name ?? t("notFound"),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId, locale } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: listings, count }] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
    supabase
      .from("properties")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) notFound();

  const t = await getTranslations();

  const sellerName = profile.full_name ?? t("property.privateSeller");

  const memberSinceDate = new Date(profile.created_at).toLocaleDateString(
    locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="mb-10 flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <User className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sellerName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("profile.memberSince")} {memberSinceDate}
            </p>
            <p className="mt-0.5 text-sm font-medium text-orange-500">
              {t("profile.activeListings")} ({count ?? 0})
            </p>
          </div>
        </div>

        {/* Listings grid */}
        {(listings ?? []).length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(listings ?? []).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center">
            <LayoutGrid className="mb-3 h-12 w-12 text-gray-200" />
            <p className="font-semibold text-gray-400">{t("property.noResults")}</p>
            <p className="mt-1 text-sm text-gray-300">{t("property.noResultsDesc")}</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
