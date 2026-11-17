import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consentModeState, parseConsent, serializeConsent } from "./consent";
import {
  ATTRIBUTION_TTL_MS, captureAttribution, getAttribution, parseAttribution, resetAttributionMemory, syncAttributionStorage,
} from "./attribution";

describe("consent cookie", () => {
  it("round-trips every combination", () => {
    for (const analytics of [true, false]) for (const ads of [true, false]) {
      expect(parseConsent(serializeConsent({ analytics, ads }))).toEqual({ analytics, ads });
    }
  });

  it.each(["", "garbage", "0.a1.m1", "1.a2.m0", "1.a1", "1.a1.m1;x"])("treats %j as no choice", (raw) => {
    expect(parseConsent(raw)).toBeNull();
  });
});

describe("Consent Mode v2 state", () => {
  it("denies everything before a choice", () => {
    expect(consentModeState(null)).toEqual({
      ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
  });

  it("maps analytics and ads independently", () => {
    expect(consentModeState({ analytics: true, ads: false })).toEqual({
      ad_storage: "denied", analytics_storage: "granted", ad_user_data: "denied", ad_personalization: "denied",
    });
    expect(consentModeState({ analytics: false, ads: true })).toEqual({
      ad_storage: "granted", analytics_storage: "denied", ad_user_data: "granted", ad_personalization: "granted",
    });
  });
});

describe("parseAttribution", () => {
  it("keeps only the six attribution params", () => {
    expect(parseAttribution("?utm_source=google&utm_medium=cpc&utm_campaign=c&utm_content=v1&gclid=G&fbclid=F&utm_term=x&city=fes"))
      .toEqual({ utm_source: "google", utm_medium: "cpc", utm_campaign: "c", utm_content: "v1", gclid: "G", fbclid: "F" });
  });

  it("returns null when there is nothing to keep", () => {
    expect(parseAttribution("")).toBeNull();
    expect(parseAttribution("?city=fes&utm_source=")).toBeNull();
  });

  it("strips control characters and caps length", () => {
    expect(parseAttribution("?utm_source=a%0Ab%00c")?.utm_source).toBe("abc");
    expect(parseAttribution(`?utm_campaign=${"x".repeat(500)}`)?.utm_campaign).toHaveLength(200);
  });
});

describe("attribution storage follows consent", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    resetAttributionMemory();
    store = new Map();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps landing params in memory only until consent", () => {
    captureAttribution("?utm_source=meta&fbclid=F", null);
    expect(store.size).toBe(0);
    expect(getAttribution(null)).toEqual({ utm_source: "meta" }); // click id needs ad consent
    expect(getAttribution({ analytics: true, ads: true })).toEqual({ utm_source: "meta", fbclid: "F" });
  });

  it("persists after consent, without click ids unless ads were accepted", () => {
    captureAttribution("?utm_source=google&gclid=G", null);
    syncAttributionStorage({ analytics: true, ads: false });
    expect(JSON.parse(store.get("ml_attribution")!).data).toEqual({ utm_source: "google" });
    syncAttributionStorage({ analytics: true, ads: true });
    expect(JSON.parse(store.get("ml_attribution")!).data).toEqual({ utm_source: "google", gclid: "G" });
  });

  it("clears storage on refusal", () => {
    captureAttribution("?utm_source=google", { analytics: true, ads: true });
    expect(store.has("ml_attribution")).toBe(true);
    syncAttributionStorage({ analytics: false, ads: false });
    expect(store.has("ml_attribution")).toBe(false);
  });

  it("reads stored attribution on a later visit for 30 days", () => {
    const t0 = 1_000_000;
    captureAttribution("?utm_source=google", { analytics: true, ads: false }, t0);
    resetAttributionMemory(); // new page load
    expect(getAttribution({ analytics: true, ads: false }, t0 + ATTRIBUTION_TTL_MS - 1)).toEqual({ utm_source: "google" });
    expect(getAttribution({ analytics: true, ads: false }, t0 + ATTRIBUTION_TTL_MS + 1)).toEqual({});
    expect(getAttribution(null, t0 + 1)).toEqual({}); // no consent → stored data is not read
  });

  it("last touch wins", () => {
    captureAttribution("?utm_source=google&utm_campaign=a", { analytics: true, ads: true });
    captureAttribution("?utm_source=meta", { analytics: true, ads: true });
    expect(getAttribution({ analytics: true, ads: true })).toEqual({ utm_source: "meta" });
  });
});
