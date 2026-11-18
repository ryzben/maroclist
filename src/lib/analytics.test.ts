import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsConfig, buildCalls, EVENTS, needsConsent, track, type AnalyticsConfig } from "./analytics";
import { captureAttribution, resetAttributionMemory } from "./attribution";

const ENV_KEYS = [
  "NEXT_PUBLIC_GA4_ID", "NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_GADS_ID", "NEXT_PUBLIC_META_PIXEL_ID", "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
  "NEXT_PUBLIC_GADS_LABEL_SIGN_UP", "NEXT_PUBLIC_GADS_LABEL_LISTING_POSTED", "NEXT_PUBLIC_GADS_LABEL_WHATSAPP_CLICK",
  "NEXT_PUBLIC_GADS_LABEL_SHOW_NUMBER", "NEXT_PUBLIC_GADS_LABEL_MESSAGE_SENT",
];

const FULL: AnalyticsConfig = {
  ga4Id: "G-TEST",
  gadsId: "AW-123",
  gadsLabels: { LISTING_POSTED: "abcLabel" },
  metaPixelId: "999",
  plausibleDomain: "",
};

/** Minimal browser globals for track(); the provider functions are spies. */
function fakeBrowser(withProviders: boolean) {
  const win: Record<string, unknown> = {};
  if (withProviders) {
    win.gtag = vi.fn();
    win.fbq = vi.fn();
  }
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { documentElement: { lang: "fr" }, cookie: "ml_consent=1.a1.m1" });
  return win;
}

beforeEach(() => {
  for (const k of ENV_KEYS) vi.stubEnv(k, "");
  resetAttributionMemory();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("no IDs configured", () => {
  it("has an empty config and needs no consent banner", () => {
    const cfg = analyticsConfig();
    expect(cfg.ga4Id).toBe("");
    expect(cfg.gadsId).toBe("");
    expect(cfg.metaPixelId).toBe("");
    expect(needsConsent(cfg)).toBe(false);
  });

  it("track() is a silent no-op in the browser", () => {
    const win = fakeBrowser(false);
    for (const event of Object.keys(EVENTS) as (keyof typeof EVENTS)[]) {
      expect(() => track(event, { listing_id: "x" })).not.toThrow();
    }
    expect(win.gtag).toBeUndefined();
    expect(win.fbq).toBeUndefined();
  });

  it("does not call providers that happen to exist on the page", () => {
    const win = fakeBrowser(true);
    track("listing_posted", { listing_id: "x" });
    expect(win.gtag).not.toHaveBeenCalled();
    expect(win.fbq).not.toHaveBeenCalled();
  });

  it("track() is a no-op during SSR", () => {
    expect(() => track("view_listing")).not.toThrow();
  });

  it("buildCalls produces nothing", () => {
    const calls = buildCalls("listing_posted", { listing_id: "x" }, analyticsConfig());
    expect(calls).toEqual({ gtag: [], fbq: null, plausible: null });
  });
});

describe("configuration", () => {
  it("falls back to the old NEXT_PUBLIC_GA_ID", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-OLD");
    expect(analyticsConfig().ga4Id).toBe("G-OLD");
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-NEW");
    expect(analyticsConfig().ga4Id).toBe("G-NEW");
  });

  it("needs consent when any Google or Meta ID is set, not for Plausible alone", () => {
    expect(needsConsent({ ...FULL, ga4Id: "", gadsId: "", metaPixelId: "", plausibleDomain: "maroclist.com" })).toBe(false);
    expect(needsConsent({ ...FULL, ga4Id: "", gadsId: "", metaPixelId: "1" })).toBe(true);
    expect(needsConsent({ ...FULL, ga4Id: "", gadsId: "AW-1", metaPixelId: "" })).toBe(true);
  });
});

describe("event mapping", () => {
  it.each([
    ["sign_up", "CompleteRegistration"],
    ["listing_posted", "Lead"],
    ["whatsapp_click", "Contact"],
    ["show_number", "Contact"],
    ["message_sent", "Lead"],
    ["search", "Search"],
    ["view_listing", "ViewContent"],
  ] as const)("%s → Meta %s", (event, meta) => {
    const { fbq } = buildCalls(event, { listing_id: "L1" }, FULL);
    expect(fbq?.slice(0, 2)).toEqual(["track", meta]);
  });

  it("view_seller_landing has no Meta standard event", () => {
    expect(buildCalls("view_seller_landing", {}, FULL).fbq?.slice(0, 2)).toEqual(["trackCustom", "view_seller_landing"]);
  });

  it("sends a Google Ads conversion only when that event's label is set, without the listing price", () => {
    const posted = buildCalls("listing_posted", { listing_id: "L1", price: 900000 }, FULL);
    expect(posted.gtag).toContainEqual(["event", "conversion", { send_to: "AW-123/abcLabel" }]);
    const signUp = buildCalls("sign_up", {}, FULL);
    expect(signUp.gtag.some(([, name]) => name === "conversion")).toBe(false);
  });

  it("keeps the price in GA4 but strips it from Meta conversions", () => {
    const { gtag, fbq } = buildCalls("message_sent", { listing_id: "L1", price: 900000, currency: "MAD" }, FULL);
    expect(gtag[0]).toEqual(["event", "message_sent", { listing_id: "L1", price: 900000, currency: "MAD", send_to: "G-TEST" }]);
    expect(fbq?.[2]).toEqual({ listing_id: "L1", content_ids: ["L1"], content_type: "home_listing" });
  });
});

describe("track() with IDs set", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_GADS_ID", "AW-123");
    vi.stubEnv("NEXT_PUBLIC_GADS_LABEL_LISTING_POSTED", "abcLabel");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "999");
  });

  it("adds locale and, for listing_posted, the campaign attribution", () => {
    const win = fakeBrowser(true);
    captureAttribution("?utm_source=meta&utm_campaign=sellers_fr&fbclid=FB1", { analytics: true, ads: true });
    track("listing_posted", { listing_id: "L1", city: "fes" });
    expect(win.gtag).toHaveBeenCalledWith("event", "listing_posted", expect.objectContaining({
      locale: "fr", city: "fes", utm_source: "meta", utm_campaign: "sellers_fr", fbclid: "FB1",
    }));
    expect(win.gtag).toHaveBeenCalledWith("event", "conversion", { send_to: "AW-123/abcLabel" });
    expect(win.fbq).toHaveBeenCalledWith("track", "Lead", expect.objectContaining({ utm_source: "meta" }));
  });

  it("does not attach attribution to other events", () => {
    const win = fakeBrowser(true);
    captureAttribution("?utm_source=meta", { analytics: true, ads: true });
    track("view_listing", { listing_id: "L1" });
    expect(win.gtag).toHaveBeenCalledWith("event", "view_listing", expect.not.objectContaining({ utm_source: "meta" }));
  });

  it("never throws when a provider throws", () => {
    const win = fakeBrowser(true);
    (win.gtag as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new Error("blocked"); });
    expect(() => track("search")).not.toThrow();
  });
});
