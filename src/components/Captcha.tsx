"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  TURNSTILE_SCRIPT_URL,
  captchaOptions,
  isCaptchaError,
  turnstileLanguage,
  turnstileSiteKey,
} from "@/lib/captcha";

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// One script per page, shared by every widget; a failed load can be retried on the next mount.
let scriptPromise: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TURNSTILE_SCRIPT_URL;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing")));
    s.onerror = () => {
      scriptPromise = null;
      s.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface Captcha {
  /** False when NEXT_PUBLIC_TURNSTILE_SITE_KEY is empty: no widget, no token, auth calls unchanged. */
  enabled: boolean;
  /** The form may submit: captcha is off, or a token is in hand. */
  ready: boolean;
  /** Spread into the Supabase auth call's `options`. */
  options: { captchaToken?: string };
  /** Localized "complete the security check" message for a submit before `ready`. */
  requiredMessage: string;
  /**
   * Message for a failed auth call. Tokens are single-use, so the widget is reset after every failure;
   * captcha failures get a localized message instead of Supabase's English one.
   */
  errorMessage: (err: { code?: string; message: string }) => string;
  /** Internal wiring for <CaptchaWidget>. */
  widget: {
    setToken: (token: string | null) => void;
    failed: boolean;
    setFailed: (failed: boolean) => void;
    resetRef: RefObject<(() => void) | null>;
  };
}

export function useCaptcha(): Captcha {
  const t = useTranslations("captcha");
  const enabled = turnstileSiteKey() !== "";
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);

  const errorMessage = useCallback(
    (err: { code?: string; message: string }) => {
      if (enabled) {
        setToken(null);
        resetRef.current?.();
      }
      return isCaptchaError(err) ? t("failed") : err.message;
    },
    [enabled, t]
  );

  return {
    enabled,
    ready: !enabled || token !== null,
    options: captchaOptions(token),
    requiredMessage: t("required"),
    errorMessage,
    widget: { setToken, failed, setFailed, resetRef },
  };
}

/**
 * Cloudflare Turnstile widget. Renders nothing when captcha is off. Full width (`size: flexible`) so it
 * lines up with the form inputs in both LTR and RTL; Turnstile renders its own text in the site locale.
 */
export default function CaptchaWidget({ captcha, className }: { captcha: Captcha; className?: string }) {
  const t = useTranslations("captcha");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = captcha;
  const { setToken, failed, setFailed, resetRef } = captcha.widget;

  useEffect(() => {
    if (!enabled || !ref.current) return;
    let cancelled = false;
    let id: string | undefined;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !ref.current) return;
        id = ts.render(ref.current, {
          sitekey: turnstileSiteKey(),
          language: turnstileLanguage(locale),
          theme: "light",
          size: "flexible",
          callback: (token: string) => {
            setFailed(false);
            setToken(token);
          },
          "expired-callback": () => setToken(null),
          "timeout-callback": () => setToken(null),
          "error-callback": () => {
            setToken(null);
            setFailed(true);
          },
        });
        resetRef.current = () => {
          if (id) ts.reset(id);
        };
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      resetRef.current = null;
      if (id) window.turnstile?.remove(id);
      setToken(null);
    };
  }, [enabled, locale, setToken, setFailed, resetRef]);

  if (!enabled) return null;

  return (
    <div className={className}>
      {/* 65px = Turnstile's widget height; reserving it avoids a layout jump when it loads */}
      <div ref={ref} role="group" aria-label={t("label")} className="min-h-[65px] w-full" />
      {failed && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {t("loadFailed")}
        </p>
      )}
    </div>
  );
}
