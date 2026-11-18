"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CheckCircle, Loader2, Mail, MessageCircle } from "lucide-react";
import { CITIES, PROPERTY_TYPES } from "@/types/property";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface AlertSignupProps {
  city?: string | null;
  propertyType?: string | null;
  transactionType?: string | null;
  budgetMax?: number | null;
  /** Where the form sits — stored with the alert and sent to analytics */
  source: string;
  className?: string;
}

/**
 * "Alert me when new listings match" — keeps video/social traffic when inventory is thin.
 * WhatsApp is the default channel since that's how most Moroccan buyers prefer to be contacted.
 */
export default function AlertSignup({ city, propertyType, transactionType, budgetMax, source, className }: AlertSignupProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [contact, setContact] = useState("");
  const [form, setForm] = useState({
    city: city && city !== "other" ? city : "",
    property_type: propertyType ?? "",
    transaction_type: transactionType === "rent" || transactionType === "holiday_rental" ? "rent" : transactionType === "sale" ? "sale" : "",
    budget_max: budgetMax ? String(Math.round(budgetMax)) : "",
  });
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [channel]: contact, locale, source, company }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(["contact", "email", "whatsapp"].includes(data.error) ? t("alerts.invalidContact") : t("alerts.error"));
        setStatus("idle");
        return;
      }
      track("alert_signup", { channel, source, city: form.city || "any", property_type: form.property_type || "any", transaction_type: form.transaction_type || "any" });
      setStatus("done");
    } catch {
      setError(t("alerts.error"));
      setStatus("idle");
    }
  }

  return (
    <div className={cn("rounded-2xl border border-teal-100 bg-teal-50 p-5 sm:p-6", className)}>
      <div className="mb-1 flex items-center gap-2">
        <Bell className="h-4 w-4 text-teal-600" />
        <h3 className="text-base font-bold text-teal-900">{t("alerts.title")}</h3>
      </div>
      <p className="mb-4 text-sm text-teal-700">{t("alerts.desc")}</p>

      {status === "done" ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-teal-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {t("alerts.success")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} className="hidden" aria-hidden="true" />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input text-sm" aria-label={t("post.city")}>
              <option value="">{t("alerts.anyCity")}</option>
              {CITIES.filter((c) => c !== "other").map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
            </select>
            <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })} className="input text-sm" aria-label={t("filter.transactionType")}>
              <option value="">{t("alerts.buyOrRent")}</option>
              <option value="sale">{t("alerts.buy")}</option>
              <option value="rent">{t("alerts.rent")}</option>
            </select>
            <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="input text-sm" aria-label={t("filter.propertyType")}>
              <option value="">{t("alerts.anyType")}</option>
              {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{t(`property.types.${p}`)}</option>)}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.budget_max}
              onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
              placeholder={t("alerts.budget")}
              className="input text-sm"
              aria-label={t("alerts.budget")}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex shrink-0 rounded-xl border border-teal-200 bg-white p-1">
              {(["whatsapp", "email"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setChannel(c); setContact(""); setError(""); }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    channel === c ? "bg-teal-600 text-white" : "text-teal-700 hover:bg-teal-50"
                  )}
                >
                  {c === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                  {c === "whatsapp" ? "WhatsApp" : t("alerts.email")}
                </button>
              ))}
            </div>
            <input
              required
              type={channel === "email" ? "email" : "tel"}
              inputMode={channel === "email" ? "email" : "tel"}
              autoComplete={channel === "email" ? "email" : "tel"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={channel === "email" ? t("alerts.emailPlaceholder") : t("alerts.whatsappPlaceholder")}
              className="input flex-1"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("alerts.submit")}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-[11px] text-teal-600/80">{t("alerts.consent")}</p>
        </form>
      )}
    </div>
  );
}
