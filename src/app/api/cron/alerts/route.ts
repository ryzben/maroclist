import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { alertMatches, listingUrl, type ListingAlert } from "@/lib/alerts";
import { listingTitle, formatLocation } from "@/lib/listingTitle";
import { priceLine } from "@/lib/listingMeta";
import { optimizeImage } from "@/lib/imageUrl";
import { SITE_URL, asLocale, type Locale } from "@/lib/seo";
import type { Property } from "@/types/property";

// Daily email digest for buyer alerts (scheduled in vercel.json). WhatsApp subscribers are served
// manually from /admin/alerts until a WhatsApp Business API sender is set up.
export const maxDuration = 60;

const COPY: Record<Locale, { subject: (n: number) => string; intro: string; cta: string; unsubscribe: string }> = {
  en: {
    subject: (n) => `${n} new listing${n > 1 ? "s" : ""} match your Maroclist alert`,
    intro: "New properties matching your alert were just posted:",
    cta: "View listing",
    unsubscribe: "Unsubscribe from this alert",
  },
  fr: {
    subject: (n) => `${n} nouvelle${n > 1 ? "s" : ""} annonce${n > 1 ? "s" : ""} pour votre alerte Maroclist`,
    intro: "De nouveaux biens correspondant à votre alerte viennent d'être publiés :",
    cta: "Voir l'annonce",
    unsubscribe: "Se désabonner de cette alerte",
  },
  ar: {
    subject: (n) => `${n} إعلانات جديدة تطابق تنبيهك على مروكليست`,
    intro: "تم نشر عقارات جديدة تطابق تنبيهك:",
    cta: "عرض الإعلان",
    unsubscribe: "إلغاء الاشتراك في هذا التنبيه",
  },
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emailHtml(alert: ListingAlert, matches: Property[]) {
  const l = asLocale(alert.locale);
  const c = COPY[l];
  const dir = l === "ar" ? "rtl" : "ltr";
  const cards = matches.slice(0, 6).map((p) => {
    const img = p.images?.[0] ? optimizeImage(p.images[0], { width: 560, quality: 70, format: "origin" }) : "";
    return `
      <tr><td style="padding:12px 0;border-bottom:1px solid #eee">
        ${img ? `<img src="${escapeHtml(img)}" width="280" style="display:block;border-radius:10px;max-width:100%;margin-bottom:8px" alt="">` : ""}
        <div style="font-size:18px;font-weight:800;color:#ea580c">${escapeHtml(priceLine(p, l))}</div>
        <div style="font-size:15px;font-weight:600;color:#111;margin:2px 0">${escapeHtml(listingTitle(p, l))}</div>
        <div style="font-size:13px;color:#666">${escapeHtml(formatLocation(p, l))}</div>
        <a href="${listingUrl(p.id, l, "email")}" style="display:inline-block;margin-top:8px;background:#f97316;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600">${c.cta}</a>
      </td></tr>`;
  }).join("");
  return `
    <div dir="${dir}" style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f97316;margin-bottom:4px">Maroclist</h2>
      <p style="color:#333">${c.intro}</p>
      <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
      <p style="margin-top:24px;font-size:12px;color:#999">
        <a href="${SITE_URL}/${l}/alerts/unsubscribe?token=${alert.unsubscribe_token}" style="color:#999">${c.unsubscribe}</a>
      </p>
    </div>`;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET"
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY are required" }, { status: 500 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: alerts, error: alertsErr }, { data: listings, error: listingsErr }] = await Promise.all([
    db.from("listing_alerts").select("*").eq("is_active", true).not("email", "is", null),
    db.from("properties").select("*").eq("is_active", true).gte("created_at", since).order("created_at", { ascending: false }),
  ]);
  if (alertsErr || listingsErr) {
    return NextResponse.json({ error: alertsErr?.message ?? listingsErr?.message }, { status: 500 });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let failed = 0;

  for (const alert of (alerts ?? []) as ListingAlert[]) {
    const lastSent = new Date(alert.last_notified_at).getTime();
    const matches = ((listings ?? []) as Property[]).filter(
      (p) => new Date(p.created_at).getTime() > lastSent && alertMatches(alert, p)
    );
    if (matches.length === 0) continue;
    try {
      await resend.emails.send({
        from: "Maroclist <alerts@maroclist.com>",
        to: alert.email!,
        subject: COPY[asLocale(alert.locale)].subject(matches.length),
        html: emailHtml(alert, matches),
        headers: { "List-Unsubscribe": `<${SITE_URL}/${asLocale(alert.locale)}/alerts/unsubscribe?token=${alert.unsubscribe_token}>` },
      });
      await db.from("listing_alerts").update({ last_notified_at: new Date().toISOString() }).eq("id", alert.id);
      sent++;
    } catch (err) {
      console.error("alert email failed", alert.id, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, alerts: alerts?.length ?? 0, sent, failed });
}
