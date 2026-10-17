import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";
import { CITY_DATA } from "@/lib/cityData";
import type { City, PropertyType, TransactionType } from "@/types/property";

export type TitleLocale = "en" | "fr" | "ar";

/** Only the structured fields needed to build a title — works for DB rows and wizard state alike. */
export interface TitleFields {
  property_type: PropertyType;
  transaction_type: TransactionType;
  city: City | string;
  neighborhood?: string | null;
  bedrooms?: number | null;
}

const CITY_LABELS: Record<TitleLocale, Record<string, string>> = {
  en: en.cities,
  fr: fr.cities,
  ar: ar.cities,
};

// Lower-case nouns, so they can sit mid-sentence in EN/FR ("2-bedroom apartment for sale…")
const TYPES: Record<PropertyType, Record<TitleLocale, string>> = {
  apartment:  { en: "apartment",          fr: "appartement",     ar: "شقة" },
  house:      { en: "house",              fr: "maison",          ar: "منزل" },
  villa:      { en: "villa",              fr: "villa",           ar: "فيلا" },
  riad:       { en: "riad",               fr: "riad",            ar: "رياض" },
  new_build:  { en: "new-build home",     fr: "logement neuf",   ar: "سكن جديد" },
  land:       { en: "land",               fr: "terrain",         ar: "أرض" },
  farm:       { en: "farm",               fr: "ferme",           ar: "ضيعة" },
  commercial: { en: "commercial property", fr: "local commercial", ar: "محل تجاري" },
};

const TRANSACTIONS: Record<TransactionType, Record<TitleLocale, string>> = {
  sale:           { en: "for sale",           fr: "à vendre",                ar: "للبيع" },
  rent:           { en: "for rent",           fr: "à louer",                 ar: "للإيجار" },
  holiday_rental: { en: "for holiday rental", fr: "en location saisonnière", ar: "للإيجار الموسمي" },
};

// Bedrooms make no sense in a land / farm / shop title
const NO_BEDROOMS: PropertyType[] = ["land", "farm", "commercial"];

// Localised names for the neighbourhoods offered in the post wizard (Step2City)
const NEIGHBORHOOD_LABELS: Record<string, Partial<Record<TitleLocale, string>>> = {
  "Maarif":           { ar: "المعاريف" },
  "Anfa":             { ar: "أنفا" },
  "Bouskoura":        { ar: "بوسكورة" },
  "Ain Diab":         { ar: "عين الذئاب" },
  "Guéliz":           { en: "Gueliz", ar: "جليز" },
  "Hivernage":        { ar: "الحي الشتوي" },
  "Palmeraie":        { en: "Palm Grove", ar: "النخيل" },
  "Médina":           { en: "Medina", ar: "المدينة القديمة" },
  "Agdal":            { ar: "أكدال" },
  "Hay Riad":         { ar: "حي الرياض" },
  "Souissi":          { ar: "السويسي" },
  "Harhoura":         { ar: "الهرهورة" },
  "Malabata":         { ar: "ملاباطا" },
  "Cap Spartel":      { ar: "رأس سبارطيل" },
  "Boubana":          { ar: "بوبانة" },
  "Moghogha":         { ar: "مغوغة" },
  "Founty":           { ar: "فونتي" },
  "Charaf":           { ar: "الشرف" },
  "Hay Mohammadi":    { ar: "الحي المحمدي" },
  "Tilila":           { ar: "تيليلة" },
  "Ville Nouvelle":   { en: "New Town", ar: "المدينة الجديدة" },
  "Saiss":            { ar: "سايس" },
  "Route d'Imouzzer": { en: "Imouzzer Road", ar: "طريق إيموزار" },
};

export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]/g, "");
}

// Every spelling of every city we know about, normalised — used to reject "neighbourhoods" that are really cities
const CITY_NAMES = new Set<string>([
  ...Object.keys(CITY_LABELS.en),
  ...(["en", "fr", "ar"] as const).flatMap((l) => Object.values(CITY_LABELS[l])),
  "casa", "tangier", "fez", "marrakesh", "sale", "kenitra",
].map(norm));

// neighbourhood (normalised) → the city whose wizard list it belongs to
const NEIGHBORHOOD_CITY = new Map<string, string>(
  Object.entries(CITY_DATA).flatMap(([city, d]) => d.neighborhoods.map((n) => [norm(n), city] as const))
);

const CITY_ALIASES: Record<string, string> = { casa: "casablanca", tangier: "tanger", fez: "fes", marrakesh: "marrakech" };

/** City key from free text in any language ("Fès", "الدار البيضاء", "casa") — null if unknown. */
export function findCity(input: string): string | null {
  const key = norm(input);
  if (!key) return null;
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  for (const l of ["en", "fr", "ar"] as const) {
    for (const [city, label] of Object.entries(CITY_LABELS[l])) {
      if (norm(city) === key || norm(label) === key) return city;
    }
  }
  return null;
}

function asLocale(locale: string): TitleLocale {
  return locale === "ar" ? "ar" : locale === "en" ? "en" : "fr";
}

/**
 * Returns the neighbourhood if it is usable, or null when it is empty, is actually a city name
 * (e.g. city=casablanca, neighborhood="Rabat"), or belongs to a different city's neighbourhood list
 * (left over after the city was changed).
 */
export function cleanNeighborhood(p: Pick<TitleFields, "city" | "neighborhood">): string | null {
  const n = p.neighborhood?.trim();
  if (!n) return null;
  const key = norm(n);
  if (!key || CITY_NAMES.has(key)) return null;
  const owner = NEIGHBORHOOD_CITY.get(key);
  if (owner && owner !== p.city) return null;
  return n;
}

function neighborhoodLabel(n: string, l: TitleLocale): string | null {
  const known = Object.entries(NEIGHBORHOOD_LABELS).find(([k]) => norm(k) === norm(n));
  if (known) return known[1][l] ?? known[0];
  // Free-text neighbourhoods are written in Latin script; Arabic UI shows them only if they're Arabic already
  if (l === "ar" && !/[؀-ۿ]/.test(n)) return null;
  return n;
}

export function cityLabel(city: string, locale: string): string {
  const l = asLocale(locale);
  return CITY_LABELS[l][city] ?? CITY_LABELS.fr[city] ?? city;
}

/** "Maarif, Casablanca" / "المعاريف، الدار البيضاء" — neighbourhood first, city second, never two cities. */
export function formatLocation(p: Pick<TitleFields, "city" | "neighborhood">, locale: string): string {
  const l = asLocale(locale);
  const country = { en: "Morocco", fr: "Maroc", ar: "المغرب" }[l];
  const city = p.city === "other" ? country : cityLabel(p.city, l);
  const n = cleanNeighborhood(p);
  // Location lines keep Latin neighbourhood names even in Arabic — they're proper nouns buyers search for
  const nLabel = n ? neighborhoodLabel(n, l) ?? n : null;
  if (!nLabel) return city;
  return `${nLabel}${l === "ar" ? "، " : ", "}${city}`;
}

function bedroomsPhrase(beds: number, l: TitleLocale): string {
  if (l === "en") return `${beds}-bedroom`;
  if (l === "fr") return beds === 1 ? "1 chambre" : `${beds} chambres`;
  if (beds === 1) return "بغرفة واحدة";
  if (beds === 2) return "بغرفتين";
  return beds <= 10 ? `بـ${beds} غرف` : `بـ${beds} غرفة`;
}

/**
 * Builds a single-language title from structured fields, e.g.
 *   en: "2-bedroom apartment for rent in Maarif, Casablanca"
 *   fr: "Appartement 2 chambres à louer à Maarif, Casablanca"
 *   ar: "شقة بغرفتين للإيجار في المعاريف، الدار البيضاء"
 */
export function listingTitle(p: TitleFields, locale: string): string {
  const l = asLocale(locale);
  const type = TYPES[p.property_type]?.[l] ?? TYPES.apartment[l];
  const tx = TRANSACTIONS[p.transaction_type]?.[l] ?? TRANSACTIONS.sale[l];
  const beds = !NO_BEDROOMS.includes(p.property_type) && p.bedrooms && p.bedrooms > 0 ? p.bedrooms : 0;

  // Arabic titles drop Latin-only neighbourhoods rather than mixing scripts
  const n = cleanNeighborhood(p);
  const titleLoc = n && neighborhoodLabel(n, l) === null ? { ...p, neighborhood: null } : p;
  const where = formatLocation(titleLoc, l);

  let title: string;
  if (l === "en") {
    title = `${beds ? `${bedroomsPhrase(beds, l)} ` : ""}${type} ${tx} in ${where}`;
  } else if (l === "fr") {
    const prep = p.city === "other" && !n ? "au" : "à";
    title = `${type}${beds ? ` ${bedroomsPhrase(beds, l)}` : ""} ${tx} ${prep} ${where}`;
  } else {
    title = `${type}${beds ? ` ${bedroomsPhrase(beds, l)}` : ""} ${tx} في ${where}`;
  }
  return title.charAt(0).toUpperCase() + title.slice(1);
}
