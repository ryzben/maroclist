import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, CheckCircle, PlusCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sell" });
  return {
    title: t("heroTitle"),
    description: t("heroSubtitle"),
  };
}

function HeroSection() {
  const t = useTranslations("sell");
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 text-white">
      {/* Zellige pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="z2" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,15 58,45 30,58 2,45 2,15" fill="none" stroke="white" strokeWidth="1" />
            <polygon points="30,12 48,21 48,39 30,48 12,39 12,21" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#z2)" />
      </svg>

      <div className="container-page relative text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-300">
          {t("heroLabel")}
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-400 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            {t("cta")}
          </Link>
        </div>
        {/* Free reassurance */}
        <p className="mt-5 text-sm text-white/50">✓ No credit card · No commission · Cancel anytime</p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const t = useTranslations("sell");

  const steps = [
    { num: "1", title: t("step1Title"), desc: t("step1Desc"), icon: "📝" },
    { num: "2", title: t("step2Title"), desc: t("step2Desc"), icon: "💬" },
    { num: "3", title: t("step3Title"), desc: t("step3Desc"), icon: "🎉" },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-2">
            {t("howLabel")}
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900">{t("howTitle")}</h2>
        </div>

        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Connector line (desktop) */}
          <div className="absolute left-1/6 right-1/6 top-10 hidden h-0.5 bg-orange-100 sm:block" />

          {steps.map(({ num, title, desc, icon }) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 border-2 border-orange-100 shadow-sm">
                <span className="text-3xl">{icon}</span>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                  {num}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 active:scale-95"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const t = useTranslations("sell");

  const reasons = [
    { icon: "🆓", title: t("why1Title"), desc: t("why1Desc") },
    { icon: "🌍", title: t("why2Title"), desc: t("why2Desc") },
    { icon: "💬", title: t("why3Title"), desc: t("why3Desc") },
    { icon: "⚙️", title: t("why4Title"), desc: t("why4Desc") },
  ];

  return (
    <section className="bg-slate-50 py-16">
      <div className="container-page">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-2">
            {t("whyLabel")}
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900">{t("whyTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 text-3xl">{icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const t = useTranslations("sell");

  return (
    <section className="bg-orange-500 py-16 text-white">
      <div className="container-page text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("finalTitle")}</h2>
        <p className="mt-4 text-lg text-orange-100 max-w-xl mx-auto">{t("finalDesc")}</p>
        <Link
          href="/post"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-orange-600 shadow-lg transition hover:bg-orange-50 active:scale-95"
        >
          <PlusCircle className="h-5 w-5" />
          {t("finalCta")}
        </Link>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-sm text-orange-200">
          {["No commission", "No credit card", "5 minutes to post"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SellPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <WhySection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
