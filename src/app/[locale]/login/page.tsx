"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/my-listings");
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("loginTitle")}</h1>
          </div>

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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">{t("password")}</label>
                <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600">
                  {t("forgotPassword")}
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "..." : t("login")}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
              {t("signup")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
