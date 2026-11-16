"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CITIES, PROPERTY_TYPES, PropertyFilters } from "@/types/property";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isPriceRangeInvalid, parsePriceBound } from "@/lib/priceRange";

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
  // From the URL, not `filters`: the server drops an inverted range, but the visitor should still
  // see what they entered next to the error
  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") ?? "");
  const priceError = isPriceRangeInvalid(priceMin, priceMax);

  function applyFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyFilter(key: string, value: string) {
    applyFilters({ [key]: value });
  }

  // Both bounds go together, and never while min > max (the inline error explains why)
  function applyPrice() {
    if (priceError) return;
    const min = parsePriceBound(priceMin)?.toString() ?? "";
    const max = parsePriceBound(priceMax)?.toString() ?? "";
    if (min === (searchParams.get("price_min") ?? "") && max === (searchParams.get("price_max") ?? "")) return;
    applyFilters({ price_min: min, price_max: max });
  }

  function resetFilters() {
    setPriceMin("");
    setPriceMax("");
    router.push(pathname);
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || priceError;

  const renderFilterContent = (idPrefix: string) => (
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
          <span className="label mb-0">{t("filter.priceMin")} – {t("filter.priceMax")}</span>
          <span className="text-[10px] text-gray-400">MAD · 10 DH ≈ $1</span>
        </div>
        <form
          className="flex gap-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            aria-label={t("filter.priceMin")}
            aria-invalid={priceError || undefined}
            aria-describedby={priceError ? `${idPrefix}-price-error` : undefined}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={applyPrice}
            className={cn("input", priceError && "border-red-400 focus:border-red-500 focus:ring-red-200")}
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="∞"
            aria-label={t("filter.priceMax")}
            aria-invalid={priceError || undefined}
            aria-describedby={priceError ? `${idPrefix}-price-error` : undefined}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={applyPrice}
            className={cn("input", priceError && "border-red-400 focus:border-red-500 focus:ring-red-200")}
          />
          {/* Enter submits */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
        {priceError && (
          <p id={`${idPrefix}-price-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {t("filter.priceRangeError")}
          </p>
        )}
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
          {renderFilterContent("desktop")}
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
            <span className="ms-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
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
              {renderFilterContent("mobile")}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
