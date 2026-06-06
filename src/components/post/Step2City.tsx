"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import StepWrapper from "./StepWrapper";
import { CITIES, type City } from "@/types/property";

interface Step2Props {
  city: City | null;
  onChange: (city: City) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2City({ city, onChange, onNext, onBack }: Step2Props) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const filtered = CITIES.filter((c) =>
    t(`cities.${c}`).toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(c: City) {
    onChange(c);
    onNext();
  }

  return (
    <StepWrapper
      step={2}
      totalSteps={5}
      title={t("wizard.step2Title")}
      subtitle={t("wizard.step2Subtitle")}
      onBack={onBack}
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("wizard.citySearch")}
          className="input pl-9"
        />
      </div>

      {/* City list */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {filtered.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleSelect(c)}
            className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-gray-50 ${
              city === c ? "bg-orange-50" : ""
            }`}
          >
            <span className={`text-sm font-medium ${city === c ? "text-orange-600" : "text-gray-800"}`}>
              {t(`cities.${c}`)}
            </span>
            {city === c && (
              <span className="h-2 w-2 rounded-full bg-orange-500" />
            )}
          </button>
        ))}
      </div>
    </StepWrapper>
  );
}
