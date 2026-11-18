"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

/** Seller-first block shown above the buyer search on the French and Arabic home pages. */
export default function SellerHero() {
  const t = useTranslations("sellerHero");
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("whatsappMessage"))}`
    : null;

  return (
    <section className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 py-10 sm:py-14">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            {t("headline")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            {t("sub")}
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/post"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-95"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_seller_click", { placement: "home_hero" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-white px-7 py-3 font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                {t("whatsapp")}
              </a>
            )}
          </div>
          <p className="mt-5 text-sm font-medium text-gray-500">{t("trust")}</p>
        </div>
      </div>
    </section>
  );
}
