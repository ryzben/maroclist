/**
 * Price-range rules shared by the search forms (client) and the listings query (server):
 * a bound is a positive whole MAD amount, and min may not exceed max (equal is fine: exact price).
 */

/** "500000" → 500000; empty, non-numeric, zero or negative → undefined (= no bound). */
export function parsePriceBound(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[\s,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

/** True when both bounds are set and min > max — such a search can never match anything. */
export function isPriceRangeInvalid(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
): boolean {
  const lo = parsePriceBound(min);
  const hi = parsePriceBound(max);
  return lo !== undefined && hi !== undefined && lo > hi;
}

/**
 * Server-side version: the bounds to actually filter on. An inverted range (e.g. a hand-edited URL)
 * is reported as invalid and both price bounds are dropped, so the page shows the error and
 * still lists results for the other filters instead of a silent "no results".
 */
export function priceFilterBounds(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
): { min?: number; max?: number; invalid: boolean } {
  if (isPriceRangeInvalid(min, max)) return { invalid: true };
  return { min: parsePriceBound(min), max: parsePriceBound(max), invalid: false };
}
