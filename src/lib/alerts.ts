import type { Property } from "@/types/property";
import { listingTitle } from "@/lib/listingTitle";
import { priceLine } from "@/lib/listingMeta";
import { SITE_URL, asLocale } from "@/lib/seo";

export interface ListingAlert {
  id: string;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  property_type: string | null;
  transaction_type: string | null;
  budget_max: number | null;
  locale: string;
  source: string | null;
  is_active: boolean;
  unsubscribe_token: string;
  last_notified_at: string;
  created_at: string;
}

type MatchFields = Pick<Property, "city" | "property_type" | "transaction_type" | "price" | "created_at">;

/** True when the listing satisfies every criterion the buyer set (NULL = any). */
export function alertMatches(alert: ListingAlert, p: MatchFields): boolean {
  if (alert.city && alert.city !== p.city) return false;
  if (alert.property_type && alert.property_type !== p.property_type) return false;
  if (alert.transaction_type && alert.transaction_type !== p.transaction_type) return false;
  if (alert.budget_max && Number(p.price) > Number(alert.budget_max)) return false;
  return true;
}

/** Listings posted since the alert was last served, newest first. */
export function newMatches<T extends MatchFields>(alert: ListingAlert, listings: T[]): T[] {
  const since = new Date(alert.last_notified_at).getTime();
  return listings
    .filter((p) => new Date(p.created_at).getTime() > since && alertMatches(alert, p))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function listingUrl(id: string, locale: string, medium: "email" | "whatsapp") {
  return `${SITE_URL}/${asLocale(locale)}/listings/${id}?utm_source=alerts&utm_medium=${medium}`;
}

/** Plain-text WhatsApp message for the admin's click-to-chat queue. */
export function whatsappAlertMessage(alert: ListingAlert, matches: Property[]): string {
  const l = asLocale(alert.locale);
  const intro = {
    en: "Hello! New listings matching your Maroclist alert:",
    fr: "Bonjour ! Nouvelles annonces correspondant à votre alerte Maroclist :",
    ar: "مرحباً! إعلانات جديدة تطابق تنبيهك على مروكليست:",
  }[l];
  const stop = {
    en: "Reply STOP to unsubscribe.",
    fr: "Répondez STOP pour vous désabonner.",
    ar: "أرسل STOP لإلغاء الاشتراك.",
  }[l];
  const lines = matches.slice(0, 5).map((p) => `• ${listingTitle(p, l)} — ${priceLine(p, l)}\n${listingUrl(p.id, l, "whatsapp")}`);
  return [intro, ...lines, stop].join("\n\n");
}
