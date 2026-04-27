import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Star, ArrowRight, CheckCircle, ShieldCheck, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import HeroSearchForm from "@/components/HeroSearchForm";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  return { title: t("title") };
}

async function getFeaturedProperties() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getCityCounts(): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("city")
    .eq("is_active", true);
  const counts: Record<string, number> = {};
  for (const { city } of data ?? []) {
    counts[city] = (counts[city] ?? 0) + 1;
  }
  return counts;
}

async function getRecentProperties() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

function ZelligePattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="zellige" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,15 58,45 30,58 2,45 2,15" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="30,12 48,21 48,39 30,48 12,39 12,21" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="30" y1="2" x2="30" y2="58" stroke="white" strokeWidth="0.3" />
          <line x1="2" y1="15" x2="58" y2="45" stroke="white" strokeWidth="0.3" />
          <line x1="58" y1="15" x2="2" y2="45" stroke="white" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
    </svg>
  );
}

function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden pb-8 pt-12">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background1.png')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/55" />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <Star className="h-3.5 w-3.5" style={{ color: "#f97316" }} fill="currentColor" />
            {t("home.badgeLabel")}
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("hero.title")}
            <span className="mt-2 block text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              {t("hero.titleLine2")}
            </span>
          </h1>
          <p className="mt-5 text-lg text-white/80 sm:text-xl">
            {t("hero.subtitle")}
          </p>
        </div>

        <HeroSearchForm />

        {/* Trust signals */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2">
          {[
            { icon: <CheckCircle className="h-4 w-4 text-green-400" />, label: t("home.trustFree") },
            { icon: <ShieldCheck className="h-4 w-4 text-blue-400" />, label: t("home.trustVerified") },
            { icon: <MessageCircle className="h-4 w-4 text-orange-400" />, label: t("home.trustContact") },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-sm text-white/75">
              {icon}
              {label}
            </span>
          ))}
        </div>

        {/* Trust line */}
        <p className="mt-4 text-center text-sm font-semibold text-white/70 tracking-wide">
          ✓ {t("home.trustInternational")}
        </p>
      </div>
    </section>
  );
}

const POPULAR_CITIES = [
  { key: "casablanca", photo: "/cities/Hassan2_mosque.jpg" },
  { key: "marrakech",  photo: "/cities/Jamaa_Lafna.jpg" },
  { key: "rabat",      photo: "/cities/Rabat_Tawer.jpg" },
  { key: "tanger",     photo: "/cities/Tangeer.jpg" },
  { key: "agadir",     photo: "/cities/Agadir.jpg" },
  { key: "fes",        photo: "/cities/Fes_Karawiyin.jpg" },
];


function PopularCitiesSection({ cityCounts }: { cityCounts: Record<string, number> }) {
  const t = useTranslations();

  return (
    <section className="bg-white py-8">
      <div className="container-page">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-1">
              {t("home.browseByCityLabel")}
            </p>
            <h2 className="section-title">{t("home.popularCities")}</h2>
          </div>
          <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600">
            {t("home.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {POPULAR_CITIES.map(({ key, photo }) => (
            <Link
              key={key}
              href={`/listings?city=${key}`}
              className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${photo}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="relative px-3 pb-3">
                <p className="text-sm font-bold text-white drop-shadow leading-tight">
                  {t(`cities.${key}`)}
                </p>
                {cityCounts[key] ? (
                  <p className="text-[11px] text-white/65 mt-0.5">
                    {cityCounts[key]} {t("home.cityListings")}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUsSection() {
  const t = useTranslations();

  const features = [
    { icon: "🔍", title: t("home.feat1Title"), desc: t("home.feat1Desc") },
    { icon: "✅", title: t("home.feat2Title"), desc: t("home.feat2Desc") },
    { icon: "📱", title: t("home.feat3Title"), desc: t("home.feat3Desc") },
    { icon: "🆓", title: t("home.feat4Title"), desc: t("home.feat4Desc") },
    { icon: "🇺🇸", title: t("home.feat5Title"), desc: t("home.feat5Desc") },
  ];

  return (
    <section className="bg-slate-50 py-8">
      <div className="container-page">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-2">
            {t("home.whyLabel")}
          </p>
          <h2 className="section-title">{t("home.whyTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 text-3xl">{icon}</div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ADS = [
  {
    name: "Deep Drive Digital",
    tagline: "Smarter Decisions. Measurable Impact.",
    url: "https://deepdrivedigital.com",
    logo: "/logos/deep-drive-digital.png",
    bg: "bg-gray-900",
    accent: "text-orange-400",
    border: "border-gray-700",
    taglineColor: "text-gray-300",
    btnClass: "bg-orange-500 hover:bg-orange-400 text-white",
    logoBg: "bg-black",
  },
  {
    name: "Xenova Studio",
    tagline: "Designed for your vision. Engineered to perform.",
    url: "https://xenovastudio.com",
    logo: "/logos/xenova-studio.jpg",
    bg: "bg-white",
    accent: "text-orange-600",
    border: "border-gray-200",
    taglineColor: "text-gray-500",
    btnClass: "bg-orange-500 hover:bg-orange-600 text-white",
    logoBg: "bg-gray-900",
  },
];

function SponsoredBannersSection() {
  return (
    <section className="bg-gray-50 py-6">
      <div className="container-page">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Sponsored
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ADS.map(({ name, tagline, url, logo, bg, accent, border, taglineColor, btnClass, logoBg }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-5 rounded-2xl border ${border} ${bg} p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${logoBg} overflow-hidden shadow-sm`}>
                <img src={logo} alt={name} className="h-full w-full object-contain p-1.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${accent}`}>{name}</p>
                <p className={`mt-0.5 text-sm leading-snug ${taglineColor}`}>{tagline}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${btnClass}`}>
                Visit →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 py-16 text-white">
      <ZelligePattern />
      <div className="container-page relative text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-400 mb-3">
          {t("home.sellersLabel")}
        </p>
        <h2 className="whitespace-pre-line text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("home.ctaTitle")}
        </h2>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto">
          {t("home.ctaDesc")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-400 active:scale-95"
          >
            {t("home.ctaPost")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            {t("home.ctaBrowse")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [featured, recent, cityCounts] = await Promise.all([
    getFeaturedProperties(),
    getRecentProperties(),
    getCityCounts(),
  ]);
  const t = await getTranslations("home");

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PopularCitiesSection cityCounts={cityCounts} />
        <SponsoredBannersSection />

        {featured.length > 0 && (
          <section className="py-14 bg-white">
            <div className="container-page">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-1">
                    {t("featuredLabel")}
                  </p>
                  <h2 className="section-title">{t("featuredTitle")}</h2>
                </div>
                <Link href="/listings?featured=true" className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600">
                  {t("viewAll")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        <WhyUsSection />

        {recent.length > 0 && (
          <section className="bg-white py-14">
            <div className="container-page">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-1">
                    {t("recentLabel")}
                  </p>
                  <h2 className="section-title">{t("recentTitle")}</h2>
                </div>
                <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600">
                  {t("viewAll")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recent.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
