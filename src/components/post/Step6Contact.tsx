"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import StepWrapper from "./StepWrapper";

interface Step6Props {
  contactPhone: string;
  onChange: (phone: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function Step6Contact({ contactPhone, onChange, onSubmit, onBack, isSubmitting }: Step6Props) {
  const t = useTranslations();
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!contactPhone.trim()) {
      setError(t("wizard.phoneRequired"));
      return;
    }
    setError("");
    try {
      await onSubmit();
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : t("common.error");
      setError(msg);
    }
  }

  return (
    <StepWrapper
      step={6}
      totalSteps={6}
      title={t("wizard.step6Title")}
      subtitle={t("wizard.step6Subtitle")}
      onBack={onBack}
    >
      <div className="mb-8 space-y-4">
        <PhoneInput
          autoFocus
          defaultCountry="MA"
          international
          value={contactPhone}
          onChange={(value) => { onChange(value ?? ""); setError(""); }}
          placeholder={t("wizard.phonePlaceholder")}
          numberInputProps={{ className: "text-lg" }}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-400">{t("wizard.phoneNote")}</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !contactPhone.trim()}
        className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-40"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("wizard.publishing")}
          </>
        ) : (
          t("wizard.publish")
        )}
      </button>
    </StepWrapper>
  );
}
