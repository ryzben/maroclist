export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "riad"
  | "land"
  | "farm"
  | "commercial"
  | "new_build";

export type TransactionType = "sale" | "rent" | "holiday_rental";

export type City =
  | "casablanca"
  | "rabat"
  | "marrakech"
  | "fes"
  | "tanger"
  | "agadir"
  | "meknes"
  | "oujda"
  | "kenitra"
  | "tetouan"
  | "safi"
  | "eljadida"
  | "benimellal"
  | "nador"
  | "taza"
  | "settat"
  | "other";

export interface Property {
  id: string;
  user_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  property_type: PropertyType;
  transaction_type: TransactionType;
  city: City;
  neighborhood: string | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  video_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  city?: City | "";
  property_type?: PropertyType | "";
  transaction_type?: TransactionType | "";
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  bedrooms?: number;
  search?: string;
}

export const PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "riad",
  "new_build",
  "land",
  "farm",
  "commercial",
];

export const CITIES: City[] = [
  "casablanca",
  "rabat",
  "marrakech",
  "fes",
  "tanger",
  "agadir",
  "meknes",
  "oujda",
  "kenitra",
  "tetouan",
  "safi",
  "eljadida",
  "benimellal",
  "nador",
  "taza",
  "settat",
  "other",
];
