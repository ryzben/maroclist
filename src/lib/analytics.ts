/**
 * Typed event tracking: one call fans out to GA4, Google Ads, Meta Pixel and Plausible — whichever are
 * configured (see analyticsConfig) and, for GA4/Ads/Meta, allowed by the visitor's consent.
 * With no IDs set, nothing is loaded and track() does nothing. Safe to call during SSR (no-op).
 * The event table below is documented in docs/analytics.md — keep both in sync.
 */
import { getAttribution } from "./attribution";
import { readConsent } from "./consent";

export type PostStep = 1 | 2 | 3 | 4 | 5 | 6;
export type GadsLabelKey = "SIGN_UP" | "LISTING_POSTED" | "WHATSAPP_CLICK" | "SHOW_NUMBER" | "MESSAGE_SENT";

interface EventSpec {
  /** Meta standard event; events without one are sent as custom events. */
  meta?: "CompleteRegistration" | "Lead" | "Contact" | "Search" | "ViewContent";
  /** Google Ads conversion, sent when NEXT_PUBLIC_GADS_LABEL_<key> is set. */
  gads?: GadsLabelKey;
  /** Attach utm_* / gclid / fbclid. */
  utm?: boolean;
}

export const EVENTS = {
  // Ad-optimisation events
  sign_up: { meta: "CompleteRegistration", gads: "SIGN_UP", utm: true },
  listing_posted: { meta: "Lead", gads: "LISTING_POSTED", utm: true }, // main conversion
  whatsapp_click: { meta: "Contact", gads: "WHATSAPP_CLICK" },
  show_number: { meta: "Contact", gads: "SHOW_NUMBER" },
  message_sent: { meta: "Lead", gads: "MESSAGE_SENT" },
  search: { meta: "Search" },
  view_listing: { meta: "ViewContent" },
  view_seller_landing: {},
  // Funnel / diagnostics (GA4 + Meta custom events only)
  post_start: {},
  post_step_1: {}, post_step_2: {}, post_step_3: {}, post_step_4: {}, post_step_5: {}, post_step_6: {},
  post_submit: {},
  call_click: {},
  share_whatsapp: {},
  alert_signup: {},
  whatsapp_seller_click: {},
} as const satisfies Record<string, EventSpec>;

export type AnalyticsEvent = keyof typeof EVENTS;

/** Params every event may carry. `locale` is added automatically. */
export interface StandardParams {
  listing_id: string;
  city: string;
  property_type: string;
  transaction_type: string;
  price: number;
  currency: string;
  placement: string;
  flow: string;
  method: string;
}
export type AnalyticsParams = { [K in keyof StandardParams]?: StandardParams[K] | null } & Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export interface AnalyticsConfig {
  ga4Id: string;
  gadsId: string;
  gadsLabels: Partial<Record<GadsLabelKey, string>>;
  metaPixelId: string;
  plausibleDomain: string;
}

// Each NEXT_PUBLIC_* is spelled out in full so Next.js can inline it into the client bundle.
export function analyticsConfig(): AnalyticsConfig {
  const v = (s: string | undefined) => (s ?? "").trim();
  return {
    // NEXT_PUBLIC_GA_ID is the old name, still honoured
    ga4Id: v(process.env.NEXT_PUBLIC_GA4_ID) || v(process.env.NEXT_PUBLIC_GA_ID),
    gadsId: v(process.env.NEXT_PUBLIC_GADS_ID),
    gadsLabels: {
      SIGN_UP: v(process.env.NEXT_PUBLIC_GADS_LABEL_SIGN_UP),
      LISTING_POSTED: v(process.env.NEXT_PUBLIC_GADS_LABEL_LISTING_POSTED),
      WHATSAPP_CLICK: v(process.env.NEXT_PUBLIC_GADS_LABEL_WHATSAPP_CLICK),
      SHOW_NUMBER: v(process.env.NEXT_PUBLIC_GADS_LABEL_SHOW_NUMBER),
      MESSAGE_SENT: v(process.env.NEXT_PUBLIC_GADS_LABEL_MESSAGE_SENT),
    },
    metaPixelId: v(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    plausibleDomain: v(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
  };
}

/** True when a tracker that needs consent (GA4, Google Ads, Meta) is configured → show the banner. */
export function needsConsent(cfg: AnalyticsConfig = analyticsConfig()): boolean {
  return Boolean(cfg.ga4Id || cfg.gadsId || cfg.metaPixelId);
}

/** Listing fields → consistent event params. */
export function listingParams(p: {
  id: string;
  city?: string;
  property_type?: string;
  transaction_type?: string;
  price?: number | string;
}): AnalyticsParams {
  return {
    listing_id: p.id,
    city: p.city,
    property_type: p.property_type,
    transaction_type: p.transaction_type,
    price: p.price != null ? Number(p.price) : undefined,
    currency: "MAD",
  };
}

/** The exact provider calls for one event — pure, so it can be tested without a browser. */
export function buildCalls(event: AnalyticsEvent, params: AnalyticsParams, cfg: AnalyticsConfig) {
  const spec: EventSpec = EVENTS[event];
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ) as Record<string, string | number | boolean>;

  const gtag: unknown[][] = [];
  if (cfg.ga4Id) gtag.push(["event", event, { ...clean, send_to: cfg.ga4Id }]);
  const label = spec.gads ? cfg.gadsLabels[spec.gads] : undefined;
  // Listing price is not a conversion value: a lead on a 2M MAD flat isn't worth 2M to us
  if (cfg.gadsId && label) gtag.push(["event", "conversion", { send_to: `${cfg.gadsId}/${label}` }]);

  let fbq: unknown[] | null = null;
  if (cfg.metaPixelId) {
    if (spec.meta) {
      const metaParams: Record<string, unknown> = { ...clean };
      delete metaParams.price;
      delete metaParams.currency;
      if (clean.listing_id) {
        metaParams.content_ids = [clean.listing_id];
        metaParams.content_type = "home_listing";
      }
      fbq = ["track", spec.meta, metaParams];
    } else {
      fbq = ["trackCustom", event, clean];
    }
  }

  return { gtag, fbq, plausible: cfg.plausibleDomain ? [event, { props: clean }] as const : null };
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const cfg = analyticsConfig();
  if (!needsConsent(cfg) && !cfg.plausibleDomain) return; // nothing configured
  try {
    const spec: EventSpec = EVENTS[event];
    const withContext: AnalyticsParams = {
      locale: document.documentElement.lang || undefined,
      ...(spec.utm ? getAttribution(readConsent()) : {}),
      ...params,
    };
    const calls = buildCalls(event, withContext, cfg);
    // gtag applies Consent Mode itself; fbq only exists once ads consent was given
    for (const args of calls.gtag) window.gtag?.(...args);
    if (calls.fbq) window.fbq?.(...calls.fbq);
    if (calls.plausible) window.plausible?.(...calls.plausible);
  } catch {
    // Analytics must never break the page
  }
}
