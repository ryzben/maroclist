import { afterEach, describe, expect, it, vi } from "vitest";
import { captchaOptions, isCaptchaError, turnstileLanguage, turnstileSiteKey } from "./captcha";

afterEach(() => vi.unstubAllEnvs());

describe("turnstileSiteKey", () => {
  it("is empty when the variable is unset or blank, so the widget is skipped", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    expect(turnstileSiteKey()).toBe("");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "   ");
    expect(turnstileSiteKey()).toBe("");
  });

  it("returns the trimmed key", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", " 0x4AAAAAAA ");
    expect(turnstileSiteKey()).toBe("0x4AAAAAAA");
  });
});

describe("captchaOptions", () => {
  it("adds nothing without a token, so calls are unchanged when captcha is off", () => {
    expect(captchaOptions(null)).toEqual({});
    expect(captchaOptions("")).toEqual({});
    expect({ data: { a: 1 }, ...captchaOptions(undefined) }).toEqual({ data: { a: 1 } });
  });

  it("passes the token as captchaToken", () => {
    expect(captchaOptions("tok")).toEqual({ captchaToken: "tok" });
  });
});

describe("isCaptchaError", () => {
  it("recognises Supabase captcha failures", () => {
    expect(isCaptchaError({ code: "captcha_failed" })).toBe(true);
    expect(isCaptchaError({ message: "captcha protection: request disallowed (invalid-input-response)" })).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isCaptchaError(null)).toBe(false);
    expect(isCaptchaError({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(false);
  });
});

describe("turnstileLanguage", () => {
  it("uses the site locale, falling back to the browser language", () => {
    expect(turnstileLanguage("ar")).toBe("ar");
    expect(turnstileLanguage("fr")).toBe("fr");
    expect(turnstileLanguage("en")).toBe("en");
    expect(turnstileLanguage("es")).toBe("auto");
  });
});
