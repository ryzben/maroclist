/**
 * Visitor consent for non-essential trackers, stored in a first-party cookie so the choice survives
 * across tabs and visits. Two categories:
 *   analytics → GA4                    (Consent Mode: analytics_storage)
 *   ads       → Google Ads, Meta Pixel (Consent Mode: ad_storage, ad_user_data, ad_personalization)
 * No cookie = no choice yet = everything denied.
 */

export interface Consent {
  analytics: boolean;
  ads: boolean;
}

export type ConsentModeValue = "granted" | "denied";
export interface ConsentModeState {
  ad_storage: ConsentModeValue;
  analytics_storage: ConsentModeValue;
  ad_user_data: ConsentModeValue;
  ad_personalization: ConsentModeValue;
}

export const CONSENT_COOKIE = "ml_consent";
/** Re-ask after 6 months (CNIL guidance; also fine under Law 09-08). */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;
/** Bump when the categories change so everyone is asked again. */
const VERSION = "1";

/** Fired on window when the visitor saves a choice (detail: Consent). */
export const CONSENT_CHANGE_EVENT = "ml:consent-change";
/** Fired on window to reopen the banner (footer "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "ml:consent-open";

export const DENIED: Consent = { analytics: false, ads: false };

export function serializeConsent(c: Consent): string {
  return `${VERSION}.a${c.analytics ? 1 : 0}.m${c.ads ? 1 : 0}`;
}

/** Anything unexpected (old version, tampering) counts as "not asked yet". */
export function parseConsent(raw: string | null | undefined): Consent | null {
  const m = /^(\d+)\.a([01])\.m([01])$/.exec(raw ?? "");
  if (!m || m[1] !== VERSION) return null;
  return { analytics: m[2] === "1", ads: m[3] === "1" };
}

export function consentModeState(c: Consent | null): ConsentModeState {
  const ads: ConsentModeValue = c?.ads ? "granted" : "denied";
  return {
    ad_storage: ads,
    analytics_storage: c?.analytics ? "granted" : "denied",
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(hit ? decodeURIComponent(hit.slice(CONSENT_COOKIE.length + 1)) : null);
}

export function saveConsent(c: Consent): void {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(c)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGE_EVENT, { detail: c }));
}

const ANALYTICS_COOKIES = /^_ga($|_)/;
const AD_COOKIES = /^(_gcl_|_fbp$|_fbc$)/;

/** Withdrawing consent removes what the trackers already set (they write on the registrable domain). */
export function clearDeniedCookies(c: Consent): void {
  if (typeof document === "undefined") return;
  const host = location.hostname;
  const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`];
  for (const part of document.cookie.split("; ")) {
    const name = part.split("=")[0];
    if ((!c.analytics && ANALYTICS_COOKIES.test(name)) || (!c.ads && AD_COOKIES.test(name))) {
      for (const d of domains) {
        document.cookie = `${name}=; Path=/; Max-Age=0${d ? `; Domain=${d}` : ""}`;
      }
    }
  }
}

export function openConsentSettings(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
