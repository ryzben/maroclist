import { findCity, norm } from "@/lib/listingTitle";
import { normalizePhone } from "@/lib/utils";
import type { PropertyType, TransactionType } from "@/types/property";

/** Shared by the admin import page (preview) and /api/admin/import (re-validation). */

export const MAX_IMPORT_ROWS = 200;
export const MAX_IMPORT_IMAGES = 10;

export const CSV_COLUMNS = [
  "property_type",
  "transaction_type",
  "city",
  "neighborhood",
  "price",
  "bedrooms",
  "bathrooms",
  "area_sqm",
  "floor",
  "description",
  "description_ar",
  "contact_phone",
  "contact_email",
  "images",
  "video_url",
] as const;

export const CSV_TEMPLATE =
  CSV_COLUMNS.join(",") +
  "\napartment,sale,casablanca,Maarif,1450000,3,2,110,4,\"Bel appartement lumineux, proche tram\",,0612345678,,https://example.com/photo1.jpg|https://example.com/photo2.jpg,\n" +
  "villa,rent,marrakech,Palmeraie,25000,4,3,350,,\"Villa avec piscine\",,,,,\n";

export interface ImportListing {
  property_type: PropertyType;
  transaction_type: TransactionType;
  city: string;
  neighborhood: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  description: string | null;
  description_ar: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  images: string[];
  video_url: string | null;
}

export interface ImportRowResult {
  line: number; // 1-based line in the CSV (header = 1)
  listing: ImportListing | null;
  errors: string[];
}

const TYPE_SYNONYMS: Record<PropertyType, string[]> = {
  apartment:  ["apartment", "appartement", "appart", "flat", "studio", "شقة"],
  house:      ["house", "maison", "home", "منزل", "دار"],
  villa:      ["villa", "فيلا"],
  riad:       ["riad", "رياض"],
  new_build:  ["new_build", "newbuild", "new build", "neuf", "programme neuf", "logement neuf", "مشروع جديد"],
  land:       ["land", "terrain", "plot", "lot", "أرض", "ارض", "بقعة"],
  farm:       ["farm", "ferme", "ضيعة", "مزرعة"],
  commercial: ["commercial", "local", "local commercial", "commerce", "magasin", "bureau", "office", "shop", "محل", "محل تجاري"],
};

const TX_SYNONYMS: Record<TransactionType, string[]> = {
  sale:           ["sale", "sell", "for sale", "buy", "vente", "vendre", "a vendre", "بيع", "للبيع"],
  rent:           ["rent", "rental", "for rent", "location", "louer", "a louer", "كراء", "للكراء", "إيجار", "للإيجار"],
  holiday_rental: ["holiday_rental", "holiday", "holiday rental", "saisonnier", "location saisonniere", "vacances", "موسمي"],
};

function lookup<T extends string>(table: Record<T, string[]>, value: string): T | null {
  const v = norm(value);
  if (!v) return null;
  for (const [key, words] of Object.entries(table) as [T, string[]][]) {
    if (words.some((w) => norm(w) === v)) return key;
  }
  return null;
}

/** RFC-4180-ish CSV parser: quoted fields, "" escapes, commas/newlines inside quotes, ; or , delimiter. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  // Excel in French locales exports with semicolons
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

function int(v: string, min: number, max: number, label: string, errors: string[]): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || n < min || n > max) { errors.push(`${label}: "${v}"`); return null; }
  return Math.round(n);
}

/** Validates one raw record (keys = CSV_COLUMNS). `defaultPhone` is the partner's number. */
export function validateRecord(raw: Partial<Record<string, string>>, defaultPhone: string | null): { listing: ImportListing | null; errors: string[] } {
  const get = (k: string) => (raw[k] ?? "").trim();
  const errors: string[] = [];

  const property_type = lookup(TYPE_SYNONYMS, get("property_type"));
  if (!property_type) errors.push(`property_type: "${get("property_type")}"`);
  const transaction_type = lookup(TX_SYNONYMS, get("transaction_type"));
  if (!transaction_type) errors.push(`transaction_type: "${get("transaction_type")}"`);
  const city = findCity(get("city"));
  if (!city) errors.push(`city: "${get("city")}"`);

  // "1 450 000", "1.450.000 MAD", "1,450,000" → 1450000
  const price = Number(get("price").replace(/[^\d]/g, ""));
  if (!price || price <= 0) errors.push(`price: "${get("price")}"`);

  const phoneRaw = get("contact_phone") || defaultPhone || "";
  const contact_phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (!contact_phone || !/^\+?\d{9,15}$/.test(contact_phone)) errors.push(`contact_phone: "${phoneRaw}"`);

  const contact_email = get("contact_email") || null;
  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) errors.push(`contact_email: "${contact_email}"`);

  const images = get("images")
    .split(/[|\s]+/)
    .map((u) => u.trim())
    .filter(Boolean);
  const badImage = images.find((u) => !/^https?:\/\//i.test(u));
  if (badImage) errors.push(`images: "${badImage}"`);

  const bedrooms = int(get("bedrooms"), 0, 50, "bedrooms", errors);
  const bathrooms = int(get("bathrooms"), 0, 30, "bathrooms", errors);
  const area_sqm = int(get("area_sqm"), 1, 1_000_000, "area_sqm", errors);
  const floor = int(get("floor"), -3, 100, "floor", errors);

  if (errors.length) return { listing: null, errors };
  return {
    listing: {
      property_type: property_type!,
      transaction_type: transaction_type!,
      city: city!,
      neighborhood: get("neighborhood") || null,
      price,
      bedrooms,
      bathrooms,
      area_sqm,
      floor,
      description: get("description").slice(0, 5000) || null,
      description_ar: get("description_ar").slice(0, 5000) || null,
      contact_phone,
      contact_email,
      images: images.slice(0, MAX_IMPORT_IMAGES),
      video_url: get("video_url") || null,
    },
    errors,
  };
}

// Agencies' own exports usually have French headers
const HEADER_ALIASES: Partial<Record<(typeof CSV_COLUMNS)[number], string[]>> = {
  property_type: ["type", "type de bien", "bien"],
  transaction_type: ["transaction", "offre", "operation"],
  city: ["ville"],
  neighborhood: ["quartier", "secteur", "district"],
  price: ["prix", "prix mad", "montant"],
  bedrooms: ["chambres", "nb chambres", "beds"],
  bathrooms: ["salles de bain", "sdb", "baths"],
  area_sqm: ["surface", "superficie", "m2", "area"],
  floor: ["etage"],
  contact_phone: ["telephone", "tel", "phone", "whatsapp"],
  contact_email: ["email", "e-mail"],
  images: ["photos", "image", "photo"],
  video_url: ["video", "youtube"],
};

/** CSV text → validated rows. Unknown columns are ignored; header names are matched loosely. */
export function parseImportCsv(text: string, defaultPhone: string | null): { rows: ImportRowResult[]; headerError: string | null } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], headerError: "empty" };
  const header = table[0].map((h) => norm(h));
  const index: Record<string, number> = {};
  for (const col of CSV_COLUMNS) {
    const names = [col, ...(HEADER_ALIASES[col] ?? [])].map(norm);
    const i = header.findIndex((h) => names.includes(h));
    if (i >= 0) index[col] = i;
  }
  const missing = ["property_type", "transaction_type", "city", "price"].filter((c) => !(c in index));
  if (missing.length) return { rows: [], headerError: missing.join(", ") };

  const rows = table.slice(1, MAX_IMPORT_ROWS + 1).map((cells, i) => {
    const raw = Object.fromEntries(Object.entries(index).map(([col, ci]) => [col, cells[ci] ?? ""]));
    return { line: i + 2, ...validateRecord(raw, defaultPhone) };
  });
  return { rows, headerError: null };
}
