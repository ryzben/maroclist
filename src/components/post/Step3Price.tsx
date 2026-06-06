"use client";

import { useTranslations } from "next-intl";
import StepWrapper from "./StepWrapper";

const MAD_TO_USD = Number(process.env.NEXT_PUBLIC_MAD_TO_USD_RATE) || 0.099;

interface Step3Props {
  price: string;
  onChange: (price: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Price({ price, onChange, onNext, onBack }: Step3Props) {
  const t = useTranslations();
  const usd = price ? Math.round(Number(price) * MAD_TO_USD).toLocaleString("en-US") : null;

  return (
    <StepWrapper
      step={3}
      totalSteps={5}
      title={t("wizard.step3Title")}
      subtitle={t("wizard.step3Subtitle")}
      onBack={onBack}
    >
      <div className="mb-8">
        {/* Price input */}
        <div className="relative">
          <input
            autoFocus
            type="number"
            min="0"
            inputMode="numeric"
            value={price}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="input pr-16 text-2xl font-bold"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
            MAD
          </span>
        </div>

        {/* Live USD conversion */}
        {usd && (
          <p className="mt-2 text-sm text-gray-500">
            ≈ <span className="font-semibold text-gray-700">${usd} USD</span>{" "}
            <span className="text-xs text-gray-400">({t("wizard.indicativeRate")})</span>
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!price || Number(price) <= 0}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
      >
        {t("wizard.continue")}
      </button>
    </StepWrapper>
  );
}
