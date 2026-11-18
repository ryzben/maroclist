"use client";

import { useTranslations } from "next-intl";
import { HIGHLIGHT_MAX } from "@/lib/highlight";

/** Optional ≤ 60-char seller one-liner, shared by the post wizard and the edit-listing form. */
export default function HighlightInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations("wizard");

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor="highlight" className="label">{t("highlightLabel")}</label>
        <span className="text-xs tabular-nums text-gray-400">{Array.from(value).length}/{HIGHLIGHT_MAX}</span>
      </div>
      <input
        id="highlight"
        type="text"
        value={value}
        // Cap by characters (not UTF-16 units like maxLength) so emoji match the counter. Markup-ish
        // characters are dropped as typed; full sanitizing happens on save + in the DB trigger.
        onChange={(e) => onChange(Array.from(e.target.value.replace(/[<>]/g, "")).slice(0, HIGHLIGHT_MAX).join(""))}
        placeholder={t("highlightPlaceholder")}
        className="input"
      />
      <p className="mt-1 text-xs text-gray-400">{t("highlightHint")}</p>
    </div>
  );
}
