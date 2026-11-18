/**
 * Thresholds that keep a young marketplace from advertising how thin it still is.
 */

/** Below this many active listings the home page hides the "N listings available" counter. */
export const SHOW_COUNT_MIN = 50;
/** Below this many listings a city tile keeps its photo + name but drops the count label. */
export const CITY_COUNT_MIN = 5;
/** Posted dates older than this are hidden on "Latest listings" — a stale date reads as "nothing new". */
export const LATEST_DATE_MAX_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isWithinDays(dateString: string, days: number, now = Date.now()): boolean {
  const t = new Date(dateString).getTime();
  return Number.isFinite(t) && now - t <= days * DAY_MS;
}

/** Stable featured-first ordering: keeps the incoming order within featured and within non-featured. */
export function featuredFirst<T extends { is_featured?: boolean | null }>(list: T[]): T[] {
  return [...list.filter((p) => p.is_featured), ...list.filter((p) => !p.is_featured)];
}
