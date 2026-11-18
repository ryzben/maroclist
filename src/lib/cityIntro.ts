import { CITY_DATA, type CityKey } from "@/lib/cityData";
import { cityLabel, cleanNeighborhood } from "@/lib/listingTitle";
import { asLocale, type CityPageTx, type Locale } from "@/lib/seo";

export interface CityStats {
  count: number;
  minPrice: number | null;
  medianPrice: number | null;
  maxPrice: number | null;
  neighborhoods: string[]; // most common first, from live listings
  typeCounts: Record<string, number>;
}

export function computeCityStats(
  city: string,
  rows: { price: number; neighborhood: string | null; property_type: string }[],
  total: number
): CityStats {
  const prices = rows.map((r) => Number(r.price)).filter((p) => p > 0).sort((a, b) => a - b);
  const nCounts = new Map<string, number>();
  const typeCounts: Record<string, number> = {};
  for (const r of rows) {
    const n = cleanNeighborhood({ city, neighborhood: r.neighborhood });
    if (n) nCounts.set(n, (nCounts.get(n) ?? 0) + 1);
    typeCounts[r.property_type] = (typeCounts[r.property_type] ?? 0) + 1;
  }
  return {
    count: total,
    minPrice: prices[0] ?? null,
    medianPrice: prices.length ? prices[Math.floor(prices.length / 2)] : null,
    maxPrice: prices.at(-1) ?? null,
    neighborhoods: [...nCounts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).slice(0, 6),
    typeCounts,
  };
}

function mad(n: number, l: Locale) {
  return `${new Intl.NumberFormat(l === "en" ? "en-US" : "fr-MA", { maximumFractionDigits: 0 }).format(n)} ${l === "ar" ? "درهم" : "MAD"}`;
}

function list(items: string[], l: Locale) {
  if (items.length <= 1) return items.join("");
  const and = { en: " and ", fr: " et ", ar: " و" }[l];
  const sep = l === "ar" ? "، " : ", ";
  return items.slice(0, -1).join(sep) + and + items.at(-1);
}

export interface CityCopy {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[]; // paragraphs
}

export function cityCopy(cityKey: string, txIn: CityPageTx, localeIn: string, s: CityStats): CityCopy {
  const l = asLocale(localeIn);
  const tx = txIn;
  const city = cityLabel(cityKey, l);
  const market = CITY_DATA[cityKey as CityKey];
  const hoods = s.neighborhoods.length ? s.neighborhoods : market?.neighborhoods ?? [];
  const rentSuffix = { en: "/month", fr: "/mois", ar: " شهرياً" }[l];
  const fmt = (n: number) => mad(n, l) + (tx === "rent" ? rentSuffix : "");

  if (l === "fr") {
    const what = tx === "sale" ? "à vendre" : "à louer";
    const h1 = tx === "sale" ? `Immobilier à vendre à ${city}` : `Locations immobilières à ${city}`;
    const p1 = s.count > 0
      ? `Maroclist compte actuellement ${s.count} annonce${s.count > 1 ? "s" : ""} ${what} à ${city}` +
        (s.minPrice && s.maxPrice && s.count > 1 ? `, de ${fmt(s.minPrice)} à ${fmt(s.maxPrice)} (prix médian ${fmt(s.medianPrice!)}).` : ".") +
        ` Appartements, villas, maisons et terrains publiés directement par les propriétaires et des agences partenaires vérifiées — prix affichés en MAD et en USD, contact direct par WhatsApp.`
      : `Aucune annonce ${what} à ${city} pour le moment. Créez une alerte gratuite ci-dessous : nous vous prévenons dès qu'un bien est publié.`;
    const p2 = hoods.length ? `Quartiers recherchés à ${city} : ${list(hoods.slice(0, 4), l)}.` : "";
    return {
      h1,
      metaTitle: tx === "sale" ? `Achat immobilier ${city} — appartements, villas, terrains` : `Location ${city} — appartements et maisons à louer`,
      metaDescription: s.count > 0
        ? `${s.count} bien${s.count > 1 ? "s" : ""} ${what} à ${city}${s.medianPrice ? ` dès ${fmt(s.minPrice!)}` : ""}. Contactez les propriétaires directement sur WhatsApp. Prix en MAD et USD.`
        : `Trouvez un bien ${what} à ${city} sur Maroclist. Alertes gratuites par email ou WhatsApp dès qu'une annonce est publiée.`,
      intro: [p1, market?.desc.fr ?? "", p2].filter(Boolean),
    };
  }

  if (l === "ar") {
    const what = tx === "sale" ? "للبيع" : "للإيجار";
    const h1 = `عقارات ${what} في ${city}`;
    const p1 = s.count > 0
      ? `يضم مروكليست حالياً ${s.count} ${s.count === 1 ? "إعلاناً" : "إعلانات"} ${what} في ${city}` +
        (s.minPrice && s.maxPrice && s.count > 1 ? `، بأسعار تتراوح بين ${fmt(s.minPrice)} و${fmt(s.maxPrice)} (السعر الوسيط ${fmt(s.medianPrice!)}).` : ".") +
        ` شقق وفيلات ومنازل وأراضٍ ينشرها الملاك مباشرة ووكالات شريكة موثقة، مع الأسعار بالدرهم والدولار والتواصل المباشر عبر واتساب.`
      : `لا توجد إعلانات ${what} في ${city} حالياً. فعّل تنبيهاً مجانياً أدناه وسنخبرك فور نشر عقار جديد.`;
    return {
      h1,
      metaTitle: `${h1} — شقق، فيلات، أراضٍ`,
      metaDescription: s.count > 0
        ? `${s.count} عقار ${what} في ${city}. تواصل مباشرة مع الملاك عبر واتساب. الأسعار بالدرهم والدولار.`
        : `ابحث عن عقار ${what} في ${city} على مروكليست. تنبيهات مجانية عبر البريد أو واتساب.`,
      intro: [p1, market?.desc.ar ?? ""].filter(Boolean),
    };
  }

  const what = tx === "sale" ? "for sale" : "for rent";
  const h1 = tx === "sale" ? `Property for sale in ${city}` : `Property for rent in ${city}`;
  const p1 = s.count > 0
    ? `Maroclist currently has ${s.count} ${s.count === 1 ? "property" : "properties"} ${what} in ${city}` +
      (s.minPrice && s.maxPrice && s.count > 1 ? `, priced from ${fmt(s.minPrice)} to ${fmt(s.maxPrice)} (median ${fmt(s.medianPrice!)}).` : ".") +
      ` Browse apartments, villas, houses and land posted directly by owners and verified partner agencies, compare prices in MAD and USD, and contact sellers on WhatsApp — no middleman.`
    : `There are no properties ${what} in ${city} on Maroclist right now. Set up a free alert below and we'll let you know as soon as one is posted.`;
  const p2 = hoods.length ? `Popular neighborhoods in ${city}: ${list(hoods.slice(0, 4), l)}.` : "";
  return {
    h1,
    metaTitle: tx === "sale" ? `Buy property in ${city}, Morocco — apartments, villas, land` : `Rent in ${city}, Morocco — apartments & houses`,
    metaDescription: s.count > 0
      ? `${s.count} ${s.count === 1 ? "property" : "properties"} ${what} in ${city}, Morocco${s.minPrice ? ` from ${fmt(s.minPrice)}` : ""}. Contact owners directly on WhatsApp. Prices in MAD & USD.`
      : `Find property ${what} in ${city}, Morocco on Maroclist. Free email or WhatsApp alerts when new listings are posted.`,
    intro: [p1, market?.desc.en ?? "", p2].filter(Boolean),
  };
}
