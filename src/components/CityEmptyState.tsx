"use client";

import { Link } from "@/i18n/navigation";
import { PlusCircle, List } from "lucide-react";
import AlertSignup from "@/components/AlertSignup";
import type { CityKey } from "@/lib/cityData";

interface CityEmptyStateProps {
  city: CityKey;
  cityLabel: string;
  desc: string;
  prices: string;
  neighborhoods: string[];
  locale: string;
  t: {
    title: string;
    subtitle: string;
    postCta: string;
    browseCta: string;
    marketTitle: string;
    pricesTitle: string;
    neighborhoodsTitle: string;
  };
}

export default function CityEmptyState({
  city,
  cityLabel,
  desc,
  prices,
  neighborhoods,
  t,
}: CityEmptyStateProps) {
  return (
    <div className="space-y-10">
      {/* Hero empty state */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center px-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <PlusCircle className="h-7 w-7 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">{t.subtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <PlusCircle className="h-4 w-4" />
            {t.postCta}
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <List className="h-4 w-4" />
            {t.browseCta}
          </Link>
        </div>
      </div>

      {/* Market content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-gray-900">{t.marketTitle}</h3>
        <p className="text-sm leading-relaxed text-gray-600">{desc}</p>

        {/* Price table */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t.pricesTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {prices.split("·").map((item) => (
              <span key={item.trim()} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                {item.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Neighborhoods */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t.neighborhoodsTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {neighborhoods.map((n) => (
              <span key={n} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <AlertSignup city={city} source="city_empty" />
    </div>
  );
}
