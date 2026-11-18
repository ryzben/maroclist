"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_CHANGE_EVENT, CONSENT_COOKIE, parseConsent, type Consent } from "./consent";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

function rawCookie(): string {
  const hit = document.cookie.split("; ").find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(CONSENT_COOKIE.length + 1)) : "";
}

/**
 * The visitor's saved consent. `ready` is false during SSR and hydration (the cookie is only read in
 * the browser), so callers render nothing consent-dependent until then.
 */
export function useConsent(): { ready: boolean; consent: Consent | null } {
  const raw = useSyncExternalStore<string | null>(subscribe, rawCookie, () => null);
  return { ready: raw !== null, consent: parseConsent(raw) };
}
