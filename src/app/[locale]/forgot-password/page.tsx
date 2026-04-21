"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t("forgotPasswordTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("forgotPasswordDesc")}</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-sm font-medium text-green-800">{t("forgotPasswordSent")}</p>
              <Link href="/login" className="mt-4 inline-block text-sm text-orange-500 hover:text-orange-600">
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <label className="label">{t("email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? "..." : t("sendResetLink")}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-orange-500 hover:text-orange-600">
                  {t("backToLogin")}
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
