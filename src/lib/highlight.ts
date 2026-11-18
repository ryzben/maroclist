/** Optional seller one-liner shown under the generated title ("Vue mer, 5 min de la plage"). */
export const HIGHLIGHT_MAX = 60;

/**
 * Plain text only: drops control and bidi-override characters (they can flip RTL layouts), angle
 * brackets, collapses whitespace, and caps at HIGHLIGHT_MAX characters without splitting emoji.
 * Mirrors the `properties_sanitize_highlight` trigger, which re-applies this server-side.
 */
export function sanitizeHighlight(input: string | null | undefined): string | null {
  if (!input) return null;
  // Whitespace first, so a line break becomes a space instead of gluing two words together
  const clean = input
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069<>]/g, "")
    .trim();
  const capped = Array.from(clean).slice(0, HIGHLIGHT_MAX).join("").trim();
  return capped || null;
}
