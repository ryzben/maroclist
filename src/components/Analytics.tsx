"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { analyticsConfig } from "@/lib/analytics";
import { captureAttribution, syncAttributionStorage } from "@/lib/attribution";
import { clearDeniedCookies, readConsent } from "@/lib/consent";
import { syncTags } from "@/lib/tags";
import { useConsent } from "@/lib/useConsent";

/**
 * Loads the configured trackers. Nothing renders when no ID is set.
 *  - Google (GA4, Google Ads) and Meta Pixel load only after the matching consent ("basic" Consent
 *    Mode) — see src/lib/tags.ts. Before that, no request goes to any Google or Meta domain.
 *  - Withdrawing consent sends "denied" updates, deletes the trackers' cookies and reloads the page,
 *    because loaded tags can't be removed.
 *  - Plausible is cookieless and loads regardless.
 */
export default function Analytics() {
  const cfg = analyticsConfig();
  const pathname = usePathname();
  const { ready, consent } = useConsent();
  const first = useRef(true);

  // Landing campaign params, kept in memory and persisted only with consent
  useEffect(() => {
    captureAttribution(window.location.search, readConsent());
  }, [pathname]);

  // Load, upgrade or withdraw tags whenever the choice changes (including the saved choice on load)
  useEffect(() => {
    if (!ready) return;
    syncAttributionStorage(consent);
    if (consent) clearDeniedCookies(consent);
    if (syncTags(analyticsConfig(), consent).reload) window.location.reload();
  }, [ready, consent]);

  // GA4 tracks client-side navigations itself (enhanced measurement); the Pixel needs a manual PageView
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!cfg.plausibleDomain) return null;

  return (
    <>
      <Script src="https://plausible.io/js/script.js" data-domain={cfg.plausibleDomain} strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};`}
      </Script>
    </>
  );
}
