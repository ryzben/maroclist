"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, Loader2, Mail, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { newMatches, whatsappAlertMessage, type ListingAlert } from "@/lib/alerts";
import { whatsappUrl } from "@/lib/utils";
import type { Property } from "@/types/property";

/**
 * Admin view of buyer alerts: demand per city (what to source next) and a click-to-chat queue for
 * WhatsApp subscribers with new matches. Email subscribers are served by the daily cron.
 */
export default function AdminAlertsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [auth, setAuth] = useState<"checking" | "admin" | "denied">("checking");
  const [alerts, setAlerts] = useState<ListingAlert[]>([]);
  const [listings, setListings] = useState<Property[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login?next=/admin/alerts"); return; }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) { setAuth("denied"); return; }
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: a }, { data: l }] = await Promise.all([
        supabase.from("listing_alerts").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("properties").select("*").eq("is_active", true).gte("created_at", since),
      ]);
      setAlerts((a ?? []) as ListingAlert[]);
      setListings((l ?? []) as Property[]);
      setAuth("admin");
    });
  }, [router]);

  const demand = useMemo(() => {
    const byCity = new Map<string, { total: number; whatsapp: number; email: number }>();
    for (const a of alerts) {
      const key = a.city ?? "";
      const row = byCity.get(key) ?? { total: 0, whatsapp: 0, email: 0 };
      row.total++;
      if (a.whatsapp) row.whatsapp++;
      if (a.email) row.email++;
      byCity.set(key, row);
    }
    return [...byCity.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [alerts]);

  const queue = useMemo(
    () => alerts
      .filter((a) => a.whatsapp)
      .map((a) => ({ alert: a, matches: newMatches(a, listings) }))
      .filter((q) => q.matches.length > 0),
    [alerts, listings]
  );

  async function markSent(id: string) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("listing_alerts").update({ last_notified_at: now }).eq("id", id);
    if (!error) setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, last_notified_at: now } : a)));
  }

  const criteria = (a: ListingAlert) =>
    [
      a.city ? t(`cities.${a.city}`) : t("alerts.anyCity"),
      a.transaction_type === "sale" ? t("alerts.buy") : a.transaction_type ? t("alerts.rent") : null,
      a.property_type ? t(`property.types.${a.property_type}`) : null,
      a.budget_max ? `≤ ${Number(a.budget_max).toLocaleString("fr-MA")} MAD` : null,
    ].filter(Boolean).join(" · ");

  if (auth !== "admin") {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">
          {auth === "checking" ? <Loader2 className="h-5 w-5 animate-spin" /> : t("admin.notAdmin")}
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.alertsTitle")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("admin.alertsSubtitle", { count: alerts.length })}</p>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">{t("admin.demand")}</h2>
          <div className="flex flex-wrap gap-2">
            {demand.map(([city, n]) => (
              <span key={city || "any"} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs">
                <span className="font-semibold text-gray-800">{city ? t(`cities.${city}`) : t("alerts.anyCity")}</span>
                <span className="text-gray-500">{n.total}</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-600"><MessageCircle className="h-3 w-3" />{n.whatsapp}</span>
                <span className="inline-flex items-center gap-0.5 text-sky-600"><Mail className="h-3 w-3" />{n.email}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-6 py-4 font-semibold text-gray-900">
            {t("admin.whatsappQueue", { count: queue.length })}
          </h2>
          {queue.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("admin.noMatches")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {queue.map(({ alert, matches }) => (
                <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-gray-900" dir="ltr">{alert.whatsapp}</p>
                    <p className="text-xs text-gray-500">{criteria(alert)} — {t("admin.matches", { count: matches.length })}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={whatsappUrl(alert.whatsapp!, whatsappAlertMessage(alert, matches))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1ebe5d]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> {t("admin.sendWhatsApp")}
                    </a>
                    <button
                      type="button"
                      onClick={() => markSent(alert.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <Check className="h-3.5 w-3.5" /> {t("admin.markSent")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
