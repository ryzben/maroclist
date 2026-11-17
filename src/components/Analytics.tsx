"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { analyticsConfig } from "@/lib/analytics";
import { captureAttribution, syncAttributionStorage } from "@/lib/attribution";
import { clearDeniedCookies, consentModeState, readConsent } from "@/lib/consent";
import { useConsent } from "@/lib/useConsent";

const GA_COOKIE_SECONDS = 60 * 60 * 24 * 395;

/**
 * Loads the configured trackers. Nothing renders when no ID is set.
 *  - Google (GA4 + Google Ads) loads with Consent Mode v2, every signal "denied" by default, then
 *    updated to the visitor's choice — Google only sets cookies after consent.
 *  - Meta Pixel has no consent mode, so it loads only after advertising consent.
 *  - Plausible is cookieless and loads regardless.
 */
export default function Analytics() {
  const cfg = analyticsConfig();
  const pathname = usePathname();
  const { ready, consent } = useConsent();
  const first = useRef(true);
  const google = Boolean(cfg.ga4Id || cfg.gadsId);

  // Landing campaign params, kept in memory and persisted only with consent
  useEffect(() => {
    captureAttribution(window.location.search, readConsent());
  }, [pathname]);

  // Apply a choice made (or changed) on this page
  useEffect(() => {
    if (!ready) return;
    syncAttributionStorage(consent);
    window.gtag?.("consent", "update", consentModeState(consent));
    window.fbq?.("consent", consent?.ads ? "grant" : "revoke");
    if (consent) clearDeniedCookies(consent);
  }, [ready, consent]);

  // GA4 tracks client-side navigations itself (enhanced measurement); the Pixel needs a manual PageView
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!ready) return null;

  const googleInit = [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;",
    `gtag('consent','default',${JSON.stringify({ ...consentModeState(null), wait_for_update: 500 })});`,
    "gtag('set','ads_data_redaction',true);",
    consent ? `gtag('consent','update',${JSON.stringify(consentModeState(consent))});` : "",
    "gtag('js',new Date());",
    // 13-month cookie lifetime, as stated on /privacy (Google default is 2 years)
    cfg.ga4Id ? `gtag('config',${JSON.stringify(cfg.ga4Id)},{cookie_expires:${GA_COOKIE_SECONDS}});` : "",
    cfg.gadsId ? `gtag('config',${JSON.stringify(cfg.gadsId)});` : "",
  ].join("");

  return (
    <>
      {google && (
        <>
          <Script id="gtag-init" strategy="afterInteractive">{googleInit}</Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4Id || cfg.gadsId)}`}
            strategy="afterInteractive"
          />
        </>
      )}
      {cfg.plausibleDomain && (
        <>
          <Script src="https://plausible.io/js/script.js" data-domain={cfg.plausibleDomain} strategy="afterInteractive" />
          <Script id="plausible-init" strategy="afterInteractive">
            {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};`}
          </Script>
        </>
      )}
      {cfg.metaPixelId && consent?.ads && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(cfg.metaPixelId)});fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
