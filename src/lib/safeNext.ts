/**
 * Validation for the `?next=` return path used by login / signup.
 *
 * `next` is stored WITHOUT a locale ("/post", not "/fr/post") and is pushed through next-intl's
 * router, which prefixes the current locale. So someone who switches language on the login page
 * keeps going in the language they picked. Links that already carry a locale ("/fr/post") are
 * accepted too; the prefix is stripped.
 */

export const NEXT_MAX_LENGTH = 512;

const LOCALE_PREFIX = /^\/(?:en|fr|ar)(?=\/|\?|#|$)/;
// C0 controls, DEL and C1 controls. Browsers silently drop tabs/newlines from URLs, so "/\t/evil.com"
// would become "//evil.com" — reject all of them outright.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;
const MAX_DECODE_PASSES = 4;

/** Removes a leading "/fr", "/en" or "/ar" segment: "/fr/post?x=1" → "/post?x=1", "/ar" → "/". */
export function stripLocalePrefix(path: string): string {
  const stripped = path.replace(LOCALE_PREFIX, "");
  return stripped === "" || stripped[0] !== "/" ? `/${stripped}` : stripped;
}

/**
 * Returns a safe, locale-less, same-origin relative path, or null if `raw` could send the user
 * anywhere else. `raw` is the value as read from URLSearchParams (already decoded once).
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > NEXT_MAX_LENGTH) return null;

  // Peel off every layer of percent-encoding so "%2F%2Fevil.com", "%252F%252F…" or "%5C" can't
  // smuggle a protocol-relative URL or a backslash past the checks below.
  let decoded = raw;
  for (let i = 0; i < MAX_DECODE_PASSES; i++) {
    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return null; // malformed escape sequence
    }
    if (next === decoded) break;
    decoded = next;
    if (i === MAX_DECODE_PASSES - 1 && /%[0-9a-f]{2}/i.test(decoded)) return null;
  }

  for (const s of [raw, decoded]) {
    if (CONTROL_CHARS.test(s)) return null;
    if (s.includes("\\")) return null; // browsers treat "\" like "/" → "/\evil.com" is protocol-relative
    if (!s.startsWith("/") || s.startsWith("//")) return null;
  }

  // Belt and braces: resolving against a fixed origin must not change the origin.
  const base = "https://maroclist.invalid";
  try {
    if (new URL(raw, base).origin !== base) return null;
  } catch {
    return null;
  }

  return stripLocalePrefix(raw);
}
