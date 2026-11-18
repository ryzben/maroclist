/**
 * Cloudflare Turnstile captcha for Supabase Auth (sign-up, sign-in, anonymous sign-in, password reset).
 *
 * The widget only renders when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Without it, auth calls are sent
 * without a token, exactly as before, so local dev and previews work with captcha off in Supabase.
 * Once captcha protection is on in Supabase, every one of those calls must carry a token — see
 * docs/captcha.md for the order to switch it on.
 */

export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Spelled out in full so Next.js inlines it into the client bundle.
export function turnstileSiteKey(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
}

/** Spread into a Supabase auth call's `options`. Empty when there is no token. */
export function captchaOptions(token: string | null | undefined): { captchaToken?: string } {
  return token ? { captchaToken: token } : {};
}

/** Supabase answers `captcha_failed` when the token is missing, expired or already used. */
export function isCaptchaError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === "captcha_failed" || /captcha/i.test(err.message ?? "");
}

/** Turnstile `language` for a site locale (Turnstile accepts these 2-letter codes as-is). */
export function turnstileLanguage(locale: string): string {
  return ["ar", "fr", "en"].includes(locale) ? locale : "auto";
}
