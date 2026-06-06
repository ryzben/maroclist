"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users, BadgeCheck, Phone, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CITIES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès", "Autre"];
const LISTING_RANGES = ["1_5", "6_20", "21_50", "50plus"] as const;

interface FormState {
  agencyName: string;
  city: string;
  listingCountRange: string;
  contactName: string;
  email: string;
  whatsapp: string;
}

const INITIAL: FormState = {
  agencyName: "",
  city: "",
  listingCountRange: "",
  contactName: "",
  email: "",
  whatsapp: "",
};

export default function AgencesPage() {
  const t = useTranslations("agences");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Partial<FormState> = {};
    if (!form.agencyName.trim()) next.agencyName = t("fieldRequired");
    if (!form.city) next.city = t("fieldRequired");
    if (!form.listingCountRange) next.listingCountRange = t("fieldRequired");
    if (!form.contactName.trim()) next.contactName = t("fieldRequired");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = t("fieldInvalidEmail");
    if (!form.whatsapp.trim()) next.whatsapp = t("fieldRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/agency-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(data.error || "Error — please try again.");
      }
    } catch {
      setServerError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const valueProps = [
    { icon: <Users className="h-6 w-6 text-orange-500" />, title: t("val1Title"), desc: t("val1Desc") },
    { icon: <BadgeCheck className="h-6 w-6 text-orange-500" />, title: t("val2Title"), desc: t("val2Desc") },
    { icon: <Phone className="h-6 w-6 text-orange-500" />, title: t("val3Title"), desc: t("val3Desc") },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 text-white text-center px-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400 mb-3">
            {t("heroLabel")}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl max-w-2xl mx-auto">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
            {t("heroSubtitle")}
          </p>
        </section>

        {/* Value props */}
        <section className="bg-white py-12 border-b border-gray-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {valueProps.map(({ icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center text-center gap-3 rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                    {icon}
                  </div>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="mx-auto max-w-xl">
            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-emerald-800">{t("successTitle")}</h2>
                <p className="mt-2 text-sm text-emerald-600">{t("successDesc")}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-lg font-bold text-gray-900">{t("formTitle")}</h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Agency name */}
                  <div>
                    <label className="label">{t("agencyName")} *</label>
                    <input
                      value={form.agencyName}
                      onChange={(e) => set("agencyName", e.target.value)}
                      placeholder={t("agencyNamePlaceholder")}
                      className="input"
                    />
                    {errors.agencyName && <p className="mt-1 text-xs text-red-600">{errors.agencyName}</p>}
                  </div>

                  {/* City + listing range */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">{t("city")} *</label>
                      <select value={form.city} onChange={(e) => set("city", e.target.value)} className="input">
                        <option value="">—</option>
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="label">{t("listingCount")} *</label>
                      <select value={form.listingCountRange} onChange={(e) => set("listingCountRange", e.target.value)} className="input">
                        <option value="">—</option>
                        {LISTING_RANGES.map((r) => (
                          <option key={r} value={r}>{t(`listingRange_${r}`)}</option>
                        ))}
                      </select>
                      {errors.listingCountRange && <p className="mt-1 text-xs text-red-600">{errors.listingCountRange}</p>}
                    </div>
                  </div>

                  {/* Contact name */}
                  <div>
                    <label className="label">{t("contactName")} *</label>
                    <input
                      value={form.contactName}
                      onChange={(e) => set("contactName", e.target.value)}
                      placeholder={t("contactNamePlaceholder")}
                      className="input"
                    />
                    {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>}
                  </div>

                  {/* Email + WhatsApp */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">{t("email")} *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className="input"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="label">{t("whatsapp")} *</label>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => set("whatsapp", e.target.value)}
                        placeholder={t("whatsappPlaceholder")}
                        className="input"
                      />
                      {errors.whatsapp && <p className="mt-1 text-xs text-red-600">{errors.whatsapp}</p>}
                    </div>
                  </div>

                  {serverError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-base"
                  >
                    {loading ? "..." : t("submit")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
