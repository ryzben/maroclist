"use client";

import { useTranslations } from "next-intl";
import StepWrapper from "./StepWrapper";

interface Step4Props {
  bedrooms: string;
  area: string;
  floor: string;
  description: string;
  onChange: (field: "bedrooms" | "area" | "floor" | "description", value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4Details({ bedrooms, area, floor, description, onChange, onNext, onBack }: Step4Props) {
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
