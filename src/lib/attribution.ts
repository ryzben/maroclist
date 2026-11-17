/**
 * Campaign attribution (UTM + ad click ids) for sign-ups and posted listings.
 *
 * The landing URL's parameters are always kept in memory for the current tab (no storage, so no
 * consent needed); SPA navigation keeps them. They are written to localStorage — and so survive a
 * reload or a later visit, for 30 days — only once the visitor has consented. Ad click ids
 * (gclid, fbclid) additionally require advertising consent. Refusing clears what was stored.
 * Last touch wins: a new campaign URL replaces the previous attribution.
 */
import type { Consent } from "./consent";

export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const AD_CLICK_IDS: AttributionKey[] = ["gclid", "fbclid"];
const STORAGE_KEY = "ml_attribution";
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LEN = 200;

/** Picks the attribution params out of a query string; null when there are none. */
export function parseAttribution(search: string): Attribution | null {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = params.get(key)?.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, MAX_LEN);
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : null;
}

/** What may be stored or sent for a given consent: no click ids without ad consent. */
export function filterForConsent(a: Attribution, consent: Consent | null): Attribution {
  if (consent?.ads) return a;
  return Object.fromEntries(Object.entries(a).filter(([k]) => !AD_CLICK_IDS.includes(k as AttributionKey)));
}

let memory: Attribution | null = null;

function storage(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

function readStored(now: number): Attribution | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: Attribution };
    if (typeof at !== "number" || now - at > ATTRIBUTION_TTL_MS) return null;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

/** Persist (or clear) according to consent. Called on every capture and every consent change. */
export function syncAttributionStorage(consent: Consent | null, now = Date.now()): void {
  const s = storage();
  if (!s) return;
  try {
    if (!consent?.analytics && !consent?.ads) {
      s.removeItem(STORAGE_KEY);
      return;
    }
    if (memory) s.setItem(STORAGE_KEY, JSON.stringify({ at: now, data: filterForConsent(memory, consent) }));
  } catch { /* storage full or blocked */ }
}

/** Called on every route change with the current query string. */
export function captureAttribution(search: string, consent: Consent | null, now = Date.now()): void {
  const found = parseAttribution(search);
  if (!found) return;
  memory = found;
  syncAttributionStorage(consent, now);
}

/** Current attribution: this tab's landing params, else the stored ones (consent permitting). */
export function getAttribution(consent: Consent | null, now = Date.now()): Attribution {
  const a = memory ?? ((consent?.analytics || consent?.ads) ? readStored(now) : null) ?? {};
  return filterForConsent(a, consent);
}

/** Test helper. */
export function resetAttributionMemory(): void {
  memory = null;
}
