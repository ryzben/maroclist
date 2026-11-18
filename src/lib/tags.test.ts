// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsConfig } from "./analytics";
import { track } from "./analytics";
import { CONSENT_COOKIE, DENIED, type Consent } from "./consent";
import { GTAG_SRC, META_SRC, resetTagsForTests, syncTags } from "./tags";

const CFG: AnalyticsConfig = {
  ga4Id: "G-TEST",
  gadsId: "AW-123",
  gadsLabels: {},
  metaPixelId: "999",
  plausibleDomain: "",
};
const ANALYTICS: Consent = { analytics: true, ads: false };
const ADS: Consent = { analytics: false, ads: true };
const ALL: Consent = { analytics: true, ads: true };

type W = Window & { _fbq?: unknown; dataLayer?: unknown[] };
const w = () => window as W;

const scriptSrcs = () => [...document.querySelectorAll<HTMLScriptElement>("script[src]")].map((s) => s.src);
/** dataLayer entries as plain arrays (gtag pushes `arguments` objects). */
const gtagCalls = () => (w().dataLayer ?? []).map((a) => Array.from(a as ArrayLike<unknown>));
const consentCalls = () => gtagCalls().filter((c) => c[0] === "consent");
const configIds = () => gtagCalls().filter((c) => c[0] === "config").map((c) => c[1]);
const fbqQueue = () => ((w().fbq as unknown as { queue?: unknown[][] })?.queue ?? []);

const allDenied = { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

let network: { fetch: ReturnType<typeof vi.fn>; xhr: ReturnType<typeof vi.spyOn>; beacon: ReturnType<typeof vi.fn> };

beforeEach(() => {
  resetTagsForTests();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  delete w().gtag;
  delete w().dataLayer;
  delete w().fbq;
  delete w()._fbq;
  network = {
    fetch: vi.fn(),
    xhr: vi.spyOn(XMLHttpRequest.prototype, "open"),
    beacon: vi.fn(),
  };
  vi.stubGlobal("fetch", network.fetch);
  Object.defineProperty(navigator, "sendBeacon", { value: network.beacon, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
});

function expectNoNetwork() {
  expect(network.fetch).not.toHaveBeenCalled();
  expect(network.xhr).not.toHaveBeenCalled();
  expect(network.beacon).not.toHaveBeenCalled();
}

describe("before consent (no cookie)", () => {
  it("injects no tag script, defines no gtag/fbq and makes no network call", () => {
    expect(syncTags(CFG, null)).toEqual({ reload: false });
    expect(scriptSrcs()).toEqual([]);
    expect(w().gtag).toBeUndefined();
    expect(w().dataLayer).toBeUndefined();
    expect(w().fbq).toBeUndefined();
    expectNoNetwork();
  });

  it("refusing everything loads nothing either, and needs no reload", () => {
    expect(syncTags(CFG, DENIED)).toEqual({ reload: false });
    expect(scriptSrcs()).toEqual([]);
    expect(w().gtag).toBeUndefined();
    expect(w().fbq).toBeUndefined();
    expectNoNetwork();
  });
});

describe("accepting analytics", () => {
  it("loads GA4 only: no Google Ads config, no Meta Pixel", () => {
    syncTags(CFG, ANALYTICS);
    expect(scriptSrcs()).toEqual([`${GTAG_SRC}?id=G-TEST`]);
    expect(configIds()).toEqual(["G-TEST"]);
    expect(w().fbq).toBeUndefined();
    expect(scriptSrcs().some((s) => s.includes("facebook"))).toBe(false);
  });

  it("sets Consent Mode defaults to denied first, then grants analytics_storage only", () => {
    syncTags(CFG, ANALYTICS);
    const calls = gtagCalls();
    expect(calls[0]).toEqual(["consent", "default", allDenied]);
    expect(consentCalls()[1]).toEqual(["consent", "update", { ...allDenied, analytics_storage: "granted" }]);
    // defaults and update both come before any config
    const firstConfig = calls.findIndex((c) => c[0] === "config");
    const update = calls.findIndex((c) => c[0] === "consent" && c[1] === "update");
    expect(update).toBeLessThan(firstConfig);
  });

  it("caps GA4 cookies at 13 months", () => {
    syncTags(CFG, ANALYTICS);
    const config = gtagCalls().find((c) => c[0] === "config");
    expect(config?.[2]).toEqual({ cookie_expires: 60 * 60 * 24 * 395 });
  });
});

describe("accepting ads", () => {
  it("loads Google Ads and the Meta Pixel, not GA4", () => {
    syncTags(CFG, ADS);
    expect(scriptSrcs()).toEqual([`${GTAG_SRC}?id=AW-123`, META_SRC]);
    expect(configIds()).toEqual(["AW-123"]);
    expect(fbqQueue()).toEqual([
      ["init", "999"],
      ["track", "PageView"],
    ]);
  });

  it("grants the three ad signals and leaves analytics_storage denied", () => {
    syncTags(CFG, ADS);
    expect(consentCalls()).toEqual([
      ["consent", "default", allDenied],
      ["consent", "update", { ad_storage: "granted", analytics_storage: "denied", ad_user_data: "granted", ad_personalization: "granted" }],
    ]);
  });

  it("with only Meta configured, loads no Google script", () => {
    syncTags({ ...CFG, ga4Id: "", gadsId: "" }, ALL);
    expect(scriptSrcs()).toEqual([META_SRC]);
    expect(w().gtag).toBeUndefined();
  });
});

describe("accepting everything, or more later", () => {
  it("loads one gtag.js for both Google IDs", () => {
    syncTags(CFG, ALL);
    expect(scriptSrcs().filter((s) => s.startsWith(GTAG_SRC))).toHaveLength(1);
    expect(configIds()).toEqual(["G-TEST", "AW-123"]);
  });

  it("adding ads after analytics configures Google Ads and loads Meta without a second gtag.js", () => {
    syncTags(CFG, ANALYTICS);
    expect(syncTags(CFG, ALL)).toEqual({ reload: false });
    expect(scriptSrcs()).toEqual([`${GTAG_SRC}?id=G-TEST`, META_SRC]);
    expect(configIds()).toEqual(["G-TEST", "AW-123"]);
    expect(consentCalls().at(-1)).toEqual(["consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]);
  });

  it("re-applying the same choice changes nothing", () => {
    syncTags(CFG, ALL);
    const before = gtagCalls().length;
    syncTags(CFG, ALL);
    expect(scriptSrcs()).toHaveLength(2);
    expect(configIds()).toEqual(["G-TEST", "AW-123"]);
    expect(gtagCalls().length).toBe(before + 1); // just the consent update
  });
});

describe("withdrawing consent", () => {
  it("sends denied updates, revokes the Pixel and asks for a reload", () => {
    syncTags(CFG, ALL);
    expect(syncTags(CFG, DENIED)).toEqual({ reload: true });
    expect(consentCalls().at(-1)).toEqual(["consent", "update", allDenied]);
    expect(fbqQueue().at(-1)).toEqual(["consent", "revoke"]);
    expect(scriptSrcs()).toHaveLength(2); // nothing new loaded
  });

  it("withdrawing ads only keeps analytics granted in the update", () => {
    syncTags(CFG, ALL);
    expect(syncTags(CFG, ANALYTICS)).toEqual({ reload: true });
    expect(consentCalls().at(-1)).toEqual(["consent", "update", { ...allDenied, analytics_storage: "granted" }]);
    expect(fbqQueue().at(-1)).toEqual(["consent", "revoke"]);
  });

  it("withdrawing analytics after accepting it sends analytics_storage denied", () => {
    syncTags(CFG, ANALYTICS);
    expect(syncTags(CFG, DENIED)).toEqual({ reload: true });
    expect(consentCalls().at(-1)).toEqual(["consent", "update", allDenied]);
  });
});

describe("track() follows consent on every call", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_GADS_ID", "AW-123");
    vi.stubEnv("NEXT_PUBLIC_GADS_LABEL_LISTING_POSTED", "LBL");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "999");
    w().gtag = vi.fn();
    w().fbq = vi.fn();
  });
  const setCookie = (v: string) => (document.cookie = `${CONSENT_COOKIE}=${v}; Path=/`);

  it("sends nothing once consent is withdrawn, even if the tags are still on the page", () => {
    setCookie("1.a0.m0");
    track("listing_posted", { listing_id: "x" });
    expect(w().gtag).not.toHaveBeenCalled();
    expect(w().fbq).not.toHaveBeenCalled();
  });

  it("with analytics only, sends the GA4 event but no Ads conversion or Pixel event", () => {
    setCookie("1.a1.m0");
    track("listing_posted", { listing_id: "x" });
    expect(w().gtag).toHaveBeenCalledTimes(1);
    expect(w().gtag).toHaveBeenCalledWith("event", "listing_posted", expect.objectContaining({ send_to: "G-TEST" }));
    expect(w().fbq).not.toHaveBeenCalled();
  });

  it("with ads only, sends the Ads conversion and the Pixel event but not GA4", () => {
    setCookie("1.a0.m1");
    track("listing_posted", { listing_id: "x" });
    expect(w().gtag).toHaveBeenCalledTimes(1);
    expect(w().gtag).toHaveBeenCalledWith("event", "conversion", { send_to: "AW-123/LBL" });
    expect(w().fbq).toHaveBeenCalledWith("track", "Lead", expect.anything());
  });
});
