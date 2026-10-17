/**
 * Thin fan-out over GA4 / Plausible / Meta Pixel. Every provider is optional — whichever env var is
 * set gets loaded by <Analytics /> and receives events here. Safe to call during SSR (no-op).
 */

export type AnalyticsEvent =
  | "view_listing"
  | "contact_whatsapp"
  | "contact_phone"
  | "share_whatsapp"
  | "post_listing_start"
  | "post_listing_complete"
  | "alert_signup";

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
  contact_whatsapp: "Contact",
  contact_phone: "Contact",
  post_listing_complete: "SubmitApplication",
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

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null));
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
