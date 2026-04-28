"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { CITIES, PROPERTY_TYPES } from "@/types/property";
import { cn } from "@/lib/utils";

const PRICE_OPTIONS = [
  { value: "200000",  label: "200 000 DH (~$20K)" },
  { value: "500000",  label: "500 000 DH (~$50K)" },
  { value: "1000000", label: "1 000 000 DH (~$100K)" },
  { value: "2000000", label: "2 000 000 DH (~$200K)" },
  { value: "5000000", label: "5 000 000 DH (~$500K)" },
];

export default function HeroSearchForm() {
  const t = useTranslations();
  const router = useRouter();
  const [txType, setTxType] = useState("sale");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSearch() {
    const params = new URLSearchParams({ transaction_type: txType });
    if (city) params.set("city", city);
    if (propertyType) params.set("property_type", propertyType);
    if (minPrice) params.set("price_min", minPrice);
    if (maxPrice) params.set("price_max", maxPrice);
    router.push(`/listings?${params.toString()}`);
  }

  const tabs = [
    { val: "sale", label: t("hero.forSale") },
    { val: "rent", label: t("hero.forRent") },
    { val: "holiday_rental", label: t("hero.forHoliday") },
  ];

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <div className="mb-0 flex gap-1 rounded-t-2xl border border-b-0 border-white/20 bg-white/20 backdrop-blur-sm p-1.5 w-fit">
        {tabs.map(({ val, label }) => (
          <button
            key={val}
            type="button"
            onClick={() => setTxType(val)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-sm font-semibold transition",
              txType === val
                ? "bg-white text-orange-600 shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-b-2xl rounded-tr-2xl border border-white/20 bg-white p-4 shadow-2xl sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label text-gray-500">{t("home.searchCity")}</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input text-gray-700"
          >
            <option value="">{t("filter.allCities")}</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{t(`cities.${c}`)}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="label text-gray-500">{t("home.searchType")}</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="input text-gray-700"
          >
            <option value="">{t("filter.allTypes")}</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{t(`property.types.${type}`)}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="label text-gray-500">{t("home.searchPrice")}</label>
          <div className="flex gap-2">
            <select
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input flex-1 text-gray-700 text-sm"
              dir="ltr"
            >
              <option value="">Min</option>
              {PRICE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input flex-1 text-gray-700 text-sm"
              dir="ltr"
            >
              <option value="">Max</option>
              {PRICE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-2.5 font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-600 active:scale-95 sm:py-[11px]"
        >
          <Search className="h-4 w-4" />
          {t("hero.search")}
        </button>
      </div>
    </div>
  );
}
