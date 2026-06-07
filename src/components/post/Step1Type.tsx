"use client";

import { useTranslations } from "next-intl";
import StepWrapper from "./StepWrapper";
import type { PropertyType, TransactionType } from "@/types/property";

const PROPERTY_TYPES: { key: PropertyType; emoji: string }[] = [
  { key: "apartment",  emoji: "🏢" },
  { key: "house",      emoji: "🏠" },
  { key: "villa",      emoji: "🏡" },
  { key: "riad",       emoji: "🕌" },
  { key: "land",       emoji: "🌿" },
  { key: "new_build",  emoji: "🏗️" },
  { key: "commercial", emoji: "🏪" },
  { key: "farm",       emoji: "🌾" },
];

const TRANSACTION_TYPES: { key: TransactionType; emoji: string }[] = [
  { key: "sale",           emoji: "🔑" },
  { key: "rent",           emoji: "📅" },
  { key: "holiday_rental", emoji: "🏖️" },
];

interface Step1Props {
  propertyType: PropertyType | null;
  transactionType: TransactionType | null;
  onChange: (p: PropertyType, t: TransactionType) => void;
  onNext: () => void;
}

export default function Step1Type({ propertyType, transactionType, onChange, onNext }: Step1Props) {
  const t = useTranslations();

  function handleSelect(p: PropertyType, tx: TransactionType) {
    onChange(p, tx);
    // Auto-advance only when both are selected
  }

  const canContinue = propertyType !== null && transactionType !== null;

  return (
    <StepWrapper step={1} totalSteps={6} title={t("wizard.step1Title")} subtitle={t("wizard.step1Subtitle")}>
      {/* Transaction type */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
          {t("wizard.transactionLabel")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TRANSACTION_TYPES.map(({ key, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(propertyType!, key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${
                transactionType === key
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-semibold leading-tight">
                {t(`hero.${key === "sale" ? "forSale" : key === "rent" ? "forRent" : "forHoliday"}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
          {t("wizard.propertyLabel")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PROPERTY_TYPES.map(({ key, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key, transactionType!)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${
                propertyType === key
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[11px] font-semibold leading-tight">
                {t(`property.types.${key}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
      >
        {t("wizard.continue")}
      </button>
    </StepWrapper>
  );
}
