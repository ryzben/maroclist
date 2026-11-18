import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";
import { authErrorKey, type AuthErrorKey } from "./authErrors";

describe("authErrorKey by Supabase error code", () => {
  const cases: [string, AuthErrorKey][] = [
    ["invalid_credentials", "invalidCredentials"],
    ["email_not_confirmed", "emailNotConfirmed"],
    ["user_already_exists", "userExists"],
    ["email_exists", "userExists"],
    ["weak_password", "weakPassword"],
    ["same_password", "samePassword"],
    ["over_request_rate_limit", "rateLimit"],
    ["over_email_send_rate_limit", "rateLimit"],
    ["captcha_failed", "captchaFailed"],
    ["otp_expired", "resetLinkInvalid"],
    ["flow_state_expired", "resetLinkInvalid"],
    ["session_not_found", "resetLinkInvalid"],
  ];
  it.each(cases)("%s → %s", (code, key) => {
    expect(authErrorKey({ code, message: "whatever" })).toBe(key);
  });
});

describe("authErrorKey without a code (older responses)", () => {
  it.each([
    ["Invalid login credentials", "invalidCredentials"],
    ["Email not confirmed", "emailNotConfirmed"],
    ["User already registered", "userExists"],
    ["Password should be at least 8 characters.", "weakPassword"],
    ["New password should be different from the old password.", "samePassword"],
    ["Email rate limit exceeded", "rateLimit"],
    ["For security purposes, you can only request this after 42 seconds.", "rateLimit"],
    ["captcha protection: request disallowed (invalid-input-response)", "captchaFailed"],
    ["Email link is invalid or has expired", "resetLinkInvalid"],
  ] as [string, AuthErrorKey][])("%j → %s", (message, key) => {
    expect(authErrorKey({ message })).toBe(key);
  });

  it("uses HTTP 429 and the missing-session error", () => {
    expect(authErrorKey({ status: 429, message: "" })).toBe("rateLimit");
    expect(authErrorKey({ name: "AuthSessionMissingError", message: "Auth session missing!" })).toBe("resetLinkInvalid");
  });
});

describe("fallback", () => {
  it("anything unknown, or nothing, is generic", () => {
    expect(authErrorKey({ code: "unexpected_failure", message: "Database error saving new user" })).toBe("generic");
    expect(authErrorKey({ message: "Failed to fetch" })).toBe("generic");
    expect(authErrorKey(null)).toBe("generic");
  });

  it("a known code wins over a misleading message", () => {
    expect(authErrorKey({ code: "weak_password", message: "Invalid login credentials" })).toBe("weakPassword");
  });
});

describe("messages", () => {
  const keys: AuthErrorKey[] = [
    "invalidCredentials", "emailNotConfirmed", "userExists", "weakPassword", "samePassword",
    "rateLimit", "captchaFailed", "resetLinkInvalid", "generic",
  ];
  it.each([["en", en], ["fr", fr], ["ar", ar]] as const)("%s has a non-empty text for every key", (_, m) => {
    const errs = (m as unknown as { authErrors: Record<string, string> }).authErrors;
    for (const k of keys) expect(errs[k], k).toMatch(/\S/);
    expect(Object.keys(errs).sort()).toEqual([...keys].sort());
  });
});
