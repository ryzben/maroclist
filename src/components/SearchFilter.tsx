"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CITIES, PROPERTY_TYPES, PropertyFilters } from "@/types/property";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  filters: PropertyFilters;
  total: number;
}

export default function SearchFilter({ filters, total }: SearchFilterProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showMobile, setShowMobile] = useState(false);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.push(pathname);
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const filterContent = (
    <div className="space-y-5">
      {/* Transaction type */}
      <div>
        <label className="label">{t("filter.transactionType")}</label>
        <div className="flex gap-2">
          {[
            { val: "", label: t("filter.any") },
            { val: "sale", label: t("hero.forSale") },
            { val: "rent", label: t("hero.forRent") },
            { val: "holiday_rental", label: t("hero.forHoliday") },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => applyFilter("transaction_type", val)}
              className={cn(
                "flex-1 rounded-xl border py-2 text-xs font-semibold transition",
                filters.transaction_type === val || (!filters.transaction_type && val === "")
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="label">{t("filter.city")}</label>
        <select
          value={filters.city || ""}
          onChange={(e) => applyFilter("city", e.target.value)}
          className="input"
        >
          <option value="">{t("filter.allCities")}</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {t(`cities.${city}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Property type */}
      <div>
        <label className="label">{t("filter.propertyType")}</label>
        <select
          value={filters.property_type || ""}
          onChange={(e) => applyFilter("property_type", e.target.value)}
          className="input"
        >
          <option value="">{t("filter.allTypes")}</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`property.types.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label className="label mb-0">{t("filter.priceMin")} – {t("filter.priceMax")}</label>
          <span className="text-[10px] text-gray-400">MAD · 10 DH ≈ $1</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="0"
            defaultValue={filters.price_min || ""}
            onBlur={(e) => applyFilter("price_min", e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="∞"
            defaultValue={filters.price_max || ""}
            onBlur={(e) => applyFilter("price_max", e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="label">{t("filter.bedrooms")}</label>
        <div className="flex gap-2">
          {["", "1", "2", "3", "4", "5+"].map((val) => (
            <button
              key={val}
              onClick={() => applyFilter("bedrooms", val === "5+" ? "5" : val)}
              className={cn(
                "flex-1 rounded-lg border py-1.5 text-sm font-medium transition",
                (filters.bedrooms?.toString() === val || (!filters.bedrooms && val === ""))
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              {val || t("filter.any")}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          {t("filter.reset")}
        </button>
      )}

      <p className="text-center text-sm text-gray-500">
        {t("filter.results", { count: total })}
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-gray-900">
            <SlidersHorizontal className="h-4 w-4" />
            {t("filter.title")}
          </h2>
          {filterContent}
        </div>
      </aside>

      {/* Mobile filter button + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowMobile(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filter.title")}
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
              !
            </span>
          )}
        </button>

        {showMobile && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobile(false)} />
            <div className="relative ms-auto h-full w-80 max-w-full overflow-y-auto bg-white p-5 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t("filter.title")}</h2>
                <button onClick={() => setShowMobile(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              {filterContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
