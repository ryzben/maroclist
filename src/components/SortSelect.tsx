"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export default function SortSelect({ sort }: { sort: string }) {
  const t = useTranslations("filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={sort}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      <option value="newest">{t("sortNewest")}</option>
      <option value="price_asc">{t("sortPriceAsc")}</option>
      <option value="price_desc">{t("sortPriceDesc")}</option>
    </select>
  );
}
