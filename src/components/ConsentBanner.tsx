"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { needsConsent } from "@/lib/analytics";
import { CONSENT_OPEN_EVENT, openConsentSettings, saveConsent, type Consent } from "@/lib/consent";
import { useConsent } from "@/lib/useConsent";

/**
 * Cookie banner: Accept all / Refuse all with equal weight, plus Customize per category.
 * Shown only when a consent-requiring tracker is configured and no choice is saved yet, or when
 * reopened from the footer. Not modal — the site stays usable while it is open.
 */
export default function ConsentBanner() {
  const t = useTranslations("cookies");
  const { ready, consent } = useConsent();
  const [reopened, setReopened] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<Consent>({ analytics: false, ads: false });
  const titleId = useId();

  useEffect(() => {
    const open = () => {
      setDraft(consent ?? { analytics: false, ads: false });
      setCustomizing(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, [consent]);

  if (!ready || !needsConsent() || (consent && !reopened)) return null;

  function choose(c: Consent) {
    saveConsent(c);
    setReopened(false);
    setCustomizing(false);
  }

  const categories: { key: keyof Consent; label: string; desc: string }[] = [
    { key: "analytics", label: t("analytics"), desc: t("analyticsDesc") },
    { key: "ads", label: t("ads"), desc: t("adsDesc") },
  ];

  return (
    <section
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-4 sm:start-4 sm:w-[26rem] sm:p-0"
    >
      <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 text-gray-700 shadow-2xl sm:p-5">
        <h2 id={titleId} className="text-base font-bold text-gray-900">{t("title")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed">
          {t("body")}{" "}
          <Link href="/privacy" className="font-medium text-orange-600 underline underline-offset-2">
            {t("learnMore")}
          </Link>
        </p>

        {customizing && (
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">{t("customize")}</legend>
            <div className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t("essential")}</p>
                <p className="text-xs text-gray-500">{t("essentialDesc")}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-gray-500">{t("alwaysOn")}</span>
            </div>
            {categories.map(({ key, label, desc }) => (
              <label key={key} className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block text-xs text-gray-500">{desc}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft[key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500"
                />
              </label>
            ))}
          </fieldset>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => choose({ analytics: false, ads: false })}
            className="rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            {t("refuse")}
          </button>
          <button
            type="button"
            onClick={() => choose({ analytics: true, ads: true })}
            className="rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            {t("accept")}
          </button>
        </div>
        <button
          type="button"
          onClick={() => (customizing ? choose(draft) : setCustomizing(true))}
          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          {customizing ? t("save") : t("customize")}
        </button>
      </div>
    </section>
  );
}

/** Footer link that reopens the banner. Hidden when no consent-requiring tracker is configured. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("cookies");
  if (!needsConsent()) return null;
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {t("settings")}
    </button>
  );
}
