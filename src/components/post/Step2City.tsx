"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import StepWrapper from "./StepWrapper";
import { CITIES, type City } from "@/types/property";
import { CITY_DATA, type CityKey } from "@/lib/cityData";

interface Step2Props {
  city: City | null;
  neighborhood: string | null;
  onChange: (city: City) => void;
  onNeighborhoodChange: (neighborhood: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

function hasNeighborhoods(city: City): city is CityKey {
  return Object.prototype.hasOwnProperty.call(CITY_DATA, city);
}

export default function Step2City({
  city,
  neighborhood,
  onChange,
  onNeighborhoodChange,
  onNext,
  onBack,
}: Step2Props) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"city" | "neighborhood">("city");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");

  function handleSelectCity(c: City) {
    onChange(c);
    setQuery("");
    if (hasNeighborhoods(c)) {
      setShowOtherInput(false);
      setOtherText("");
      setPhase("neighborhood");
    } else {
      onNext();
    }
  }

  function handleSelectNeighborhood(n: string) {
    onNeighborhoodChange(n);
    onNext();
  }

  function handleSkip() {
    onNeighborhoodChange(null);
    onNext();
  }

  function handleOtherSubmit() {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    onNeighborhoodChange(trimmed);
    onNext();
  }

  if (phase === "neighborhood" && city && hasNeighborhoods(city)) {
    const neighborhoods = CITY_DATA[city].neighborhoods.filter((n) =>
      n.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <StepWrapper
        step={2}
        totalSteps={6}
        title={t("wizard.neighborhoodTitle")}
        subtitle={t("wizard.neighborhoodSubtitle")}
        onBack={() => setPhase("city")}
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("wizard.neighborhoodSearch")}
            className="input pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {neighborhoods.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleSelectNeighborhood(n)}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-gray-50 ${
                neighborhood === n ? "bg-orange-50" : ""
              }`}
            >
              <span className={`text-sm font-medium ${neighborhood === n ? "text-orange-600" : "text-gray-800"}`}>
                {n}
              </span>
              {neighborhood === n && <span className="h-2 w-2 rounded-full bg-orange-500" />}
            </button>
          ))}

          {showOtherInput ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <input
                autoFocus
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={t("wizard.neighborhoodOtherPlaceholder")}
                className="input flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleOtherSubmit()}
              />
              <button
                type="button"
                onClick={handleOtherSubmit}
                disabled={!otherText.trim()}
                className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40"
              >
                {t("wizard.continue")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOtherInput(true)}
              className="flex w-full items-center px-4 py-3.5 text-left text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              {t("wizard.neighborhoodOther")}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-4 self-center text-sm font-medium text-gray-400 transition hover:text-gray-600 hover:underline"
        >
          {t("wizard.skipStep")}
        </button>
      </StepWrapper>
    );
  }

  const filtered = CITIES.filter((c) =>
    t(`cities.${c}`).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <StepWrapper
      step={2}
      totalSteps={6}
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
            onClick={() => handleSelectCity(c)}
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
