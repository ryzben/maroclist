import type { Property } from "@/types/property";

const NO_BEDROOMS = new Set(["land", "farm", "commercial"]);

/** Higher = more complete listing. Photos weigh most, then the details buyers filter on. */
export function completenessScore(p: Pick<Property, "images" | "bedrooms" | "area_sqm" | "description" | "neighborhood" | "property_type">): number {
  const photos = p.images?.length ?? 0;
  let score = 0;
  if (photos > 0) score += 4;
  if (photos >= 3) score += 2;
  if (p.area_sqm) score += 1;
  if (p.bedrooms || NO_BEDROOMS.has(p.property_type)) score += 1;
  if (p.description && p.description.trim().length >= 40) score += 1;
  if (p.neighborhood) score += 1;
  return score;
}

/** Most complete first; ties keep newest first. Does not mutate the input. */
export function sortByCompleteness<T extends Property>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      completenessScore(b) - completenessScore(a) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
