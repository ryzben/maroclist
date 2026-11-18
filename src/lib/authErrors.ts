/**
 * Supabase Auth errors → a key in messages/*.json → "authErrors", so visitors see them in their
 * language instead of Supabase's English text. Matches the error `code` first (supabase-js ≥ 2.40),
 * then the HTTP status / error name, then the English message for older or code-less responses.
 * Anything unrecognised maps to "generic".
 */

export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "userExists"
  | "weakPassword"
  | "samePassword"
  | "rateLimit"
  | "captchaFailed"
  | "resetLinkInvalid"
  | "generic";

export interface AuthErrorLike {
  code?: string;
  status?: number;
  name?: string;
  message?: string;
}

const BY_CODE: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "userExists",
  email_exists: "userExists",
  weak_password: "weakPassword",
  same_password: "samePassword",
  over_request_rate_limit: "rateLimit",
  over_email_send_rate_limit: "rateLimit",
  over_sms_send_rate_limit: "rateLimit",
  captcha_failed: "captchaFailed",
  // Reset link expired, already used, or opened in another browser: no recovery session
  otp_expired: "resetLinkInvalid",
  flow_state_expired: "resetLinkInvalid",
  flow_state_not_found: "resetLinkInvalid",
  session_not_found: "resetLinkInvalid",
  session_expired: "resetLinkInvalid",
  refresh_token_not_found: "resetLinkInvalid",
  refresh_token_already_used: "resetLinkInvalid",
};

const BY_MESSAGE: [RegExp, AuthErrorKey][] = [
  [/invalid login credentials/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/already (registered|exists)/i, "userExists"],
  [/password should (be at least|contain)|weak password/i, "weakPassword"],
  [/should be different from the old password/i, "samePassword"],
  [/rate limit|too many requests|for security purposes, you can only request/i, "rateLimit"],
  [/captcha/i, "captchaFailed"],
  [/auth session missing|link is invalid or has expired|token has expired/i, "resetLinkInvalid"],
];

export function authErrorKey(err: AuthErrorLike | null | undefined): AuthErrorKey {
  if (!err) return "generic";
  if (err.code && BY_CODE[err.code]) return BY_CODE[err.code];
  if (err.status === 429) return "rateLimit";
  if (err.name === "AuthSessionMissingError") return "resetLinkInvalid";
  const msg = err.message ?? "";
  for (const [re, key] of BY_MESSAGE) if (re.test(msg)) return key;
  return "generic";
}
