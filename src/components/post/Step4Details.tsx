"use client";

import { useTranslations } from "next-intl";
import StepWrapper from "./StepWrapper";
import HighlightInput from "@/components/HighlightInput";

interface Step4Props {
  bedrooms: string;
  area: string;
  floor: string;
  description: string;
  highlight: string;
  /** Title generated from type + transaction + neighbourhood + city, in the current language */
  suggestedTitle: string | null;
  onChange: (field: "bedrooms" | "area" | "floor" | "description" | "highlight", value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4Details({ bedrooms, area, floor, description, highlight, suggestedTitle, onChange, onNext, onBack }: Step4Props) {
  const t = useTranslations();

  return (
    <StepWrapper
      step={4}
      totalSteps={6}
      title={t("wizard.step4Title")}
      subtitle={t("wizard.step4Subtitle")}
      onBack={onBack}
    >
      <div className="mb-8 space-y-4">
        {suggestedTitle && (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">{t("wizard.suggestedTitle")}</p>
            <p className="mt-1 font-semibold text-gray-900">{suggestedTitle}</p>
            {highlight.trim() && <p className="mt-0.5 text-sm text-gray-600">{highlight.trim()}</p>}
            <p className="mt-1 text-xs text-gray-500">{t("wizard.suggestedTitleHint")}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">{t("wizard.detailsBedrooms")}</label>
            <input
              type="number"
              min="0"
              max="20"
              inputMode="numeric"
              value={bedrooms}
              onChange={(e) => onChange("bedrooms", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("wizard.detailsArea")}</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={area}
              onChange={(e) => onChange("area", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("wizard.detailsFloor")}</label>
            <input
              type="number"
              min="0"
              max="50"
              inputMode="numeric"
              value={floor}
              onChange={(e) => onChange("floor", e.target.value)}
              className="input"
            />
          </div>
        </div>

        <HighlightInput value={highlight} onChange={(v) => onChange("highlight", v)} />

        <div>
          <label className="label">{t("wizard.detailsDescription")}</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={t("wizard.detailsDescriptionPlaceholder")}
            className="input resize-none"
          />
        </div>
      </div>

      <button onClick={onNext} className="btn-primary w-full py-3.5 text-base">
        {t("wizard.continue")}
      </button>
    </StepWrapper>
  );
}
