/**
 * Loads the Google tag (GA4 + Google Ads) and the Meta Pixel — only after the matching consent
 * ("basic" Consent Mode). Before that, nothing is injected and no request goes to any Google or Meta
 * domain; there isn't even a `gtag`/`fbq` stub on the page.
 *
 *   GA4          ← analytics consent
 *   Google Ads   ← ads consent
 *   Meta Pixel   ← ads consent
 *
 * When gtag does load, Consent Mode v2 defaults are set to "denied" first, then updated to "granted"
 * only for the accepted categories. Withdrawing consent sends "denied" updates (and revokes the Pixel),
 * then the page must reload: gtag.js and fbevents.js can't be unloaded, and GA4 would keep sending
 * cookieless page_view pings on navigation. `syncTags` returns `reload: true` in that case.
 *
 * Pure DOM code with no React, so it can be tested in jsdom (tags.test.ts).
 */
import type { AnalyticsConfig } from "./analytics";
import { consentModeState, type Consent } from "./consent";

export const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";
export const META_SRC = "https://connect.facebook.net/en_US/fbevents.js";
/** GA4 cookies capped at 13 months, as stated on /privacy (Google's default is 2 years). */
const GA_COOKIE_SECONDS = 60 * 60 * 24 * 395;

interface TagState {
  googleInit: boolean;
  configured: Set<string>;
  meta: boolean;
  /** Categories whose tags were loaded on this page. */
  loaded: { analytics: boolean; ads: boolean };
}

const fresh = (): TagState => ({
  googleInit: false,
  configured: new Set(),
  meta: false,
  loaded: { analytics: false, ads: false },
});
let state = fresh();

/** Test helper: forget what was loaded (the DOM and window globals are the caller's to clean). */
export function resetTagsForTests(): void {
  state = fresh();
}

/** Which tags the visitor's consent allows, given what is configured. */
export function allowedTags(cfg: AnalyticsConfig, consent: Consent | null) {
  return {
    ga4: Boolean(cfg.ga4Id && consent?.analytics),
    gads: Boolean(cfg.gadsId && consent?.ads),
    meta: Boolean(cfg.metaPixelId && consent?.ads),
  };
}

function injectScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGoogle(cfg: AnalyticsConfig, consent: Consent | null, ids: string[]): void {
  if (!state.googleInit) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js reads `arguments` objects from the dataLayer, not arrays
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", consentModeState(null));
    window.gtag("set", "ads_data_redaction", true);
    window.gtag("js", new Date());
    injectScript(`${GTAG_SRC}?id=${encodeURIComponent(ids[0])}`);
    state.googleInit = true;
  }
  window.gtag!("consent", "update", consentModeState(consent));
  for (const id of ids) {
    if (state.configured.has(id)) continue;
    window.gtag!("config", id, id === cfg.ga4Id ? { cookie_expires: GA_COOKIE_SECONDS } : {});
    state.configured.add(id);
  }
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};

function loadMeta(pixelId: string): void {
  if (state.meta) {
    window.fbq?.("consent", "grant");
    return;
  }
  // Meta's standard base code, without the inline <script>
  if (!window.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq = n;
    (window as unknown as { _fbq?: Fbq })._fbq ??= n;
    injectScript(META_SRC);
  }
  window.fbq!("init", pixelId);
  window.fbq!("track", "PageView");
  state.meta = true;
}

/**
 * Bring the page's tags in line with the visitor's consent. Idempotent: call it on every consent
 * change. Returns `reload: true` when consent was withdrawn for a tag that already loaded.
 */
export function syncTags(cfg: AnalyticsConfig, consent: Consent | null): { reload: boolean } {
  if (typeof window === "undefined") return { reload: false };
  const allowed = allowedTags(cfg, consent);

  const withdrawn =
    (state.loaded.analytics && !allowed.ga4) || (state.loaded.ads && !(allowed.gads || allowed.meta));
  if (withdrawn) {
    window.gtag?.("consent", "update", consentModeState(consent));
    if (state.meta && !allowed.meta) window.fbq?.("consent", "revoke");
    return { reload: true };
  }

  const googleIds = [allowed.ga4 && cfg.ga4Id, allowed.gads && cfg.gadsId].filter(Boolean) as string[];
  if (googleIds.length) loadGoogle(cfg, consent, googleIds);
  if (allowed.meta) loadMeta(cfg.metaPixelId);

  if (allowed.ga4) state.loaded.analytics = true;
  if (allowed.gads || allowed.meta) state.loaded.ads = true;
  return { reload: false };
}
