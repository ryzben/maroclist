"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push("/");
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
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("signupTitle")}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="label">{t("fullName")}</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label">{t("email")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">{t("password")}</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">{t("confirmPassword")}</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="input"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "..." : t("signup")}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {t("hasAccount")}{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              {t("login")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
