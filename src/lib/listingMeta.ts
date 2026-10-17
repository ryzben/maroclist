import type { Property } from "@/types/property";
import { formatPrice, madToUsd } from "@/lib/utils";
import { listingTitle, formatLocation, cleanNeighborhood, cityLabel } from "@/lib/listingTitle";
import { SITE_URL, asLocale, truncate, cityPagePath } from "@/lib/seo";

const PERIOD = {
  rent:           { en: "/month", fr: "/mois", ar: " شهرياً" },
  holiday_rental: { en: "/night", fr: "/nuit", ar: " لليلة" },
} as const;

/** "1 200 000 MAD (≈ $118,800)" — rent/holiday suffixes included, USD only for MAD prices. */
export function priceLine(p: Pick<Property, "price" | "currency" | "transaction_type">, locale: string): string {
  const l = asLocale(locale);
  const period = p.transaction_type === "sale" ? "" : PERIOD[p.transaction_type][l];
  const main = formatPrice(Number(p.price), p.currency || "MAD") + period;
  const isMad = !p.currency || p.currency === "MAD";
  return isMad ? `${main} (≈ ${madToUsd(Number(p.price))})` : main;
}

/** ~155-char meta description built from structured fields, then the seller's own description. */
export function listingMetaDescription(p: Property, locale: string): string {
  const l = asLocale(locale);
  const facts: string[] = [];
  if (p.area_sqm) facts.push(`${Number(p.area_sqm)} m²`);
  if (p.bedrooms) facts.push({ en: `${p.bedrooms} bed`, fr: `${p.bedrooms} ch.`, ar: `${p.bedrooms} غرف` }[l]);
  if (p.bathrooms) facts.push({ en: `${p.bathrooms} bath`, fr: `${p.bathrooms} sdb`, ar: `${p.bathrooms} حمام` }[l]);
  const own = l === "ar" ? p.description_ar : p.description;
  const tail = own?.trim() || { en: "Contact the owner directly on WhatsApp.", fr: "Contactez le propriétaire directement sur WhatsApp.", ar: "تواصل مباشرة مع المالك عبر واتساب." }[l];
  const sep = l === "ar" ? "، " : " · ";
  return truncate(`${listingTitle(p, l)} — ${priceLine(p, l)}${facts.length ? sep + facts.join(sep) : ""}. ${tail}`);
}

const SCHEMA_TYPE: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  villa: "SingleFamilyResidence",
  riad: "SingleFamilyResidence",
  new_build: "Residence",
  land: "Place",
  farm: "Place",
  commercial: "Place",
};

/** RealEstateListing + Offer JSON-LD, plus a breadcrumb back to the city page. */
export function listingJsonLd(p: Property, locale: string, imageUrls: string[]) {
  const l = asLocale(locale);
  const url = `${SITE_URL}/${l}/listings/${p.id}`;
  const title = listingTitle(p, l);
  const neighborhood = cleanNeighborhood(p);
  const currency = p.currency || "MAD";
  const isRental = p.transaction_type !== "sale";
  const cityTx = p.transaction_type === "sale" ? "sale" : "rent";

  const listing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: title,
    description: (l === "ar" ? p.description_ar : p.description) || listingMetaDescription(p, l),
    inLanguage: l,
    datePosted: p.created_at,
    dateModified: p.updated_at,
    image: imageUrls,
    about: {
      "@type": SCHEMA_TYPE[p.property_type] ?? "Place",
      name: title,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityLabel(p.city, l),
        addressCountry: "MA",
        ...(neighborhood ? { streetAddress: neighborhood } : {}),
      },
      ...(p.area_sqm ? { floorSize: { "@type": "QuantitativeValue", value: Number(p.area_sqm), unitCode: "MTK" } } : {}),
      ...(p.bedrooms ? { numberOfBedrooms: p.bedrooms, numberOfRooms: p.bedrooms } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
    },
    offers: {
      "@type": "Offer",
      url,
      price: Number(p.price),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      businessFunction: isRental ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      ...(isRental
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: Number(p.price),
              priceCurrency: currency,
              unitCode: p.transaction_type === "holiday_rental" ? "DAY" : "MON",
            },
          }
        : {}),
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Maroclist", item: `${SITE_URL}/${l}` },
      ...(p.city !== "other"
        ? [{ "@type": "ListItem", position: 2, name: formatLocation({ city: p.city }, l), item: `${SITE_URL}/${l}${cityPagePath(l, cityTx, p.city)}` }]
        : []),
      { "@type": "ListItem", position: p.city !== "other" ? 3 : 2, name: title, item: url },
    ],
  };

  return [listing, breadcrumb];
}
