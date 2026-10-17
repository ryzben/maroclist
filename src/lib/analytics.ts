/**
 * Thin fan-out over GA4 / Plausible / Meta Pixel. Every provider is optional — whichever env var is
 * set gets loaded by <Analytics /> and receives events here. Safe to call during SSR (no-op).
 * Every event carries `lang` and `utm_source` so funnels can be split by language and campaign.
 */

export type PostStep = 1 | 2 | 3 | 4 | 5 | 6;

export type AnalyticsEvent =
  | "view_listing"
  | "contact_phone"
  | "share_whatsapp"
  | "alert_signup"
  // Seller funnel
  | "post_start"
  | `post_step_${PostStep}`
  | "post_submit"
  | "post_published"
  | "whatsapp_seller_click"
  // Buyer → owner on WhatsApp
  | "whatsapp_buyer_click";

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

// Standard Meta events let ads optimise on them; custom names are sent too for 1:1 reporting with GA
const META_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  view_listing: "ViewContent",
  whatsapp_buyer_click: "Contact",
  contact_phone: "Contact",
  post_published: "SubmitApplication",
  alert_signup: "Lead",
};

/** Listing fields → consistent event params across providers. */
export function listingParams(p: {
  id: string;
  city?: string;
  property_type?: string;
  transaction_type?: string;
  price?: number | string;
  is_verified_partner?: boolean;
}): AnalyticsParams {
  return {
    listing_id: p.id,
    city: p.city,
    property_type: p.property_type,
    transaction_type: p.transaction_type,
    value: p.price != null ? Number(p.price) : undefined,
    currency: "MAD",
    verified_partner: p.is_verified_partner ?? false,
  };
}

const UTM_KEY = "ml_utm_source";
export const NO_UTM = "(direct)";

/**
 * Remembers the landing page's utm_source for the rest of the tab session, so events fired after
 * navigating away from the campaign URL still carry it. Called by <Analytics /> on every route change.
 */
export function captureUtmSource(search: string = typeof window !== "undefined" ? window.location.search : ""): void {
  const utm = new URLSearchParams(search).get("utm_source")?.trim();
  if (!utm) return;
  try { sessionStorage.setItem(UTM_KEY, utm.slice(0, 100)); } catch { /* storage blocked */ }
}

function currentUtmSource(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("utm_source")?.trim();
  if (fromUrl) return fromUrl.slice(0, 100);
  try { return sessionStorage.getItem(UTM_KEY) || NO_UTM; } catch { return NO_UTM; }
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const withContext: AnalyticsParams = {
    lang: document.documentElement.lang || undefined,
    utm_source: currentUtmSource(),
    ...params,
  };
  const clean = Object.fromEntries(Object.entries(withContext).filter(([, v]) => v !== undefined && v !== null));
  try {
    window.gtag?.("event", event, clean);
    window.plausible?.(event, { props: clean });
    if (window.fbq) {
      const standard = META_STANDARD[event];
      if (standard) {
        window.fbq("track", standard, {
          ...clean,
          ...(clean.listing_id ? { content_ids: [clean.listing_id], content_type: "home_listing" } : {}),
        });
      }
      window.fbq("trackCustom", event, clean);
    }
  } catch {
    // Analytics must never break the page
  }
}
