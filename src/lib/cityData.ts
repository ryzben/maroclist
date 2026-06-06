export type CityKey = "casablanca" | "marrakech" | "rabat" | "tanger" | "agadir" | "fes";

interface CityData {
  desc: { fr: string; en: string; ar: string };
  prices: { fr: string; en: string; ar: string };
  neighborhoods: string[];
}

export const CITY_DATA: Record<CityKey, CityData> = {
  casablanca: {
    desc: {
      fr: "Casablanca est la capitale économique du Maroc et le marché immobilier le plus actif du pays. La ville attire de nombreux investisseurs MRE, notamment dans les quartiers de Maarif, Anfa et les nouvelles zones résidentielles de Bouskoura.",
      en: "Casablanca is Morocco's economic capital and the country's most active real estate market. The city attracts many MRE investors, particularly in the Maarif, Anfa, and new residential areas of Bouskoura.",
      ar: "الدار البيضاء هي العاصمة الاقتصادية للمغرب وأكثر أسواق العقارات نشاطاً في البلاد. تجذب المدينة العديد من المستثمرين المغتربين، لا سيما في أحياء المعاريف وأنفا والمناطق السكنية الجديدة في بوسكورة.",
    },
    prices: {
      fr: "Appartement 12 000–18 000 MAD/m² · Villa 8 000–15 000 MAD/m² · Terrain 3 000–8 000 MAD/m²",
      en: "Apartment 12,000–18,000 MAD/m² · Villa 8,000–15,000 MAD/m² · Land 3,000–8,000 MAD/m²",
      ar: "شقة 12,000–18,000 درهم/م² · فيلا 8,000–15,000 درهم/م² · أرض 3,000–8,000 درهم/م²",
    },
    neighborhoods: ["Maarif", "Anfa", "Bouskoura", "Ain Diab"],
  },
  marrakech: {
    desc: {
      fr: "Marrakech est la destination privilégiée des MRE pour l'investissement locatif et la résidence secondaire. Les riads en médina et les villas en périphérie offrent un fort potentiel de location saisonnière.",
      en: "Marrakech is the top destination for MRE investors seeking rental income and secondary residences. Medina riads and villas on the outskirts offer strong holiday rental potential.",
      ar: "مراكش هي الوجهة الأولى للمغتربين للاستثمار في الإيجار والمسكن الثانوي. تتميز الرياضات في المدينة القديمة والفيلات في الأطراف بإمكانيات عالية للإيجار الموسمي.",
    },
    prices: {
      fr: "Appartement 10 000–16 000 MAD/m² · Villa 6 000–12 000 MAD/m² · Terrain 2 000–5 000 MAD/m²",
      en: "Apartment 10,000–16,000 MAD/m² · Villa 6,000–12,000 MAD/m² · Land 2,000–5,000 MAD/m²",
      ar: "شقة 10,000–16,000 درهم/م² · فيلا 6,000–12,000 درهم/م² · أرض 2,000–5,000 درهم/م²",
    },
    neighborhoods: ["Guéliz", "Hivernage", "Palmeraie", "Médina"],
  },
  rabat: {
    desc: {
      fr: "Rabat, capitale administrative du Maroc, offre un marché immobilier stable et sécurisé. Apprécié des familles MRE, c'est un choix solide pour un investissement à long terme.",
      en: "Rabat, Morocco's administrative capital, offers a stable and secure real estate market. Popular among MRE families, it is a solid choice for long-term investment.",
      ar: "الرباط، العاصمة الإدارية للمغرب، تقدم سوقاً عقارياً مستقراً وآمناً. تحظى بتقدير كبير من عائلات المغتربين، وهي خيار متين للاستثمار طويل الأمد.",
    },
    prices: {
      fr: "Appartement 11 000–17 000 MAD/m² · Villa 7 000–13 000 MAD/m² · Terrain 2 500–6 000 MAD/m²",
      en: "Apartment 11,000–17,000 MAD/m² · Villa 7,000–13,000 MAD/m² · Land 2,500–6,000 MAD/m²",
      ar: "شقة 11,000–17,000 درهم/م² · فيلا 7,000–13,000 درهم/م² · أرض 2,500–6,000 درهم/م²",
    },
    neighborhoods: ["Agdal", "Hay Riad", "Souissi", "Harhoura"],
  },
  tanger: {
    desc: {
      fr: "Tanger connaît un essor immobilier majeur grâce à ses projets d'infrastructure (port Tanger Med, zone franche). Idéale pour les MRE cherchant une résidence stratégique proche de l'Europe.",
      en: "Tanger is experiencing a major real estate boom thanks to infrastructure projects (Tanger Med port, free zone). Ideal for MRE buyers seeking a strategic residence close to Europe.",
      ar: "تشهد طنجة ازدهاراً عقارياً كبيراً بفضل مشاريع البنية التحتية (ميناء طنجة المتوسط، المنطقة الحرة). مثالية للمغتربين الباحثين عن مسكن استراتيجي قريب من أوروبا.",
    },
    prices: {
      fr: "Appartement 8 000–13 000 MAD/m² · Villa 5 000–10 000 MAD/m² · Terrain 1 500–4 000 MAD/m²",
      en: "Apartment 8,000–13,000 MAD/m² · Villa 5,000–10,000 MAD/m² · Land 1,500–4,000 MAD/m²",
      ar: "شقة 8,000–13,000 درهم/م² · فيلا 5,000–10,000 درهم/م² · أرض 1,500–4,000 درهم/م²",
    },
    neighborhoods: ["Malabata", "Cap Spartel", "Boubana", "Moghogha"],
  },
  agadir: {
    desc: {
      fr: "Agadir est la capitale du tourisme marocain, idéale pour l'investissement locatif saisonnier. Le front de mer et les résidences balnéaires sont particulièrement prisés.",
      en: "Agadir is Morocco's tourism capital, ideal for seasonal rental investment. The seafront and beachside residences are especially sought after.",
      ar: "أغادير هي عاصمة السياحة المغربية، مثالية للاستثمار في الإيجار الموسمي. الواجهة البحرية والمساكن الشاطئية الأكثر طلباً.",
    },
    prices: {
      fr: "Appartement 9 000–14 000 MAD/m² · Villa 6 000–11 000 MAD/m² · Terrain 1 500–3 500 MAD/m²",
      en: "Apartment 9,000–14,000 MAD/m² · Villa 6,000–11,000 MAD/m² · Land 1,500–3,500 MAD/m²",
      ar: "شقة 9,000–14,000 درهم/م² · فيلا 6,000–11,000 درهم/م² · أرض 1,500–3,500 درهم/م²",
    },
    neighborhoods: ["Founty", "Charaf", "Hay Mohammadi", "Tilila"],
  },
  fes: {
    desc: {
      fr: "Fès est la capitale spirituelle du Maroc avec un marché immobilier accessible et des opportunités dans la réhabilitation de riads. Un choix authentique pour les MRE attachés à la culture marocaine.",
      en: "Fes is Morocco's spiritual capital with an accessible real estate market and riad renovation opportunities. An authentic choice for MRE buyers connected to Moroccan culture.",
      ar: "فاس هي العاصمة الروحية للمغرب مع سوق عقاري في متناول الجميع وفرص في تجديد الرياضات. خيار أصيل للمغتربين المرتبطين بالثقافة المغربية.",
    },
    prices: {
      fr: "Appartement 6 000–10 000 MAD/m² · Villa 4 000–8 000 MAD/m² · Terrain 1 000–2 500 MAD/m²",
      en: "Apartment 6,000–10,000 MAD/m² · Villa 4,000–8,000 MAD/m² · Land 1,000–2,500 MAD/m²",
      ar: "شقة 6,000–10,000 درهم/م² · فيلا 4,000–8,000 درهم/م² · أرض 1,000–2,500 درهم/م²",
    },
    neighborhoods: ["Médina", "Ville Nouvelle", "Saiss", "Route d'Imouzzer"],
  },
};
