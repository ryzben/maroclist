import { supabase } from "@/lib/supabase";
import type { PropertyType, TransactionType, City } from "@/types/property";

export interface PostWizardState {
  propertyType: PropertyType | null;
  transactionType: TransactionType | null;
  city: City | null;
  price: string;
  images: File[];
  contactPhone: string;
}

function generateTitle(
  propertyType: PropertyType,
  transactionType: TransactionType,
  city: City,
  locale: string
): string {
  const types: Record<PropertyType, Record<string, string>> = {
    apartment: { fr: "Appartement", en: "Apartment", ar: "شقة" },
    house:     { fr: "Maison",      en: "House",     ar: "منزل" },
    villa:     { fr: "Villa",       en: "Villa",     ar: "فيلا" },
    riad:      { fr: "Riad",        en: "Riad",      ar: "رياض" },
    new_build: { fr: "Programme neuf", en: "New build", ar: "مشروع جديد" },
    land:      { fr: "Terrain",     en: "Land",      ar: "أرض" },
    farm:      { fr: "Ferme",       en: "Farm",      ar: "مزرعة" },
    commercial:{ fr: "Local commercial", en: "Commercial", ar: "محل تجاري" },
  };
  const transactions: Record<TransactionType, Record<string, string>> = {
    sale:           { fr: "à vendre",    en: "for sale",  ar: "للبيع" },
    rent:           { fr: "à louer",     en: "for rent",  ar: "للإيجار" },
    holiday_rental: { fr: "en location vacances", en: "holiday rental", ar: "للإيجار الموسمي" },
  };
  const cities: Record<City, string> = {
    casablanca: "Casablanca", rabat: "Rabat", marrakech: "Marrakech",
    fes: "Fès", tanger: "Tanger", agadir: "Agadir", meknes: "Meknès",
    oujda: "Oujda", kenitra: "Kénitra", tetouan: "Tétouan", safi: "Safi",
    eljadida: "El Jadida", benimellal: "Béni Mellal", nador: "Nador",
    taza: "Taza", settat: "Settat", other: "Maroc",
  };
  const l = locale === "ar" ? "ar" : locale === "en" ? "en" : "fr";
  const type = types[propertyType]?.[l] ?? types[propertyType]?.fr ?? "";
  const tx   = transactions[transactionType]?.[l] ?? transactions[transactionType]?.fr ?? "";
  const c    = cities[city] ?? city;
  if (l === "ar") return `${type} ${tx} في ${c}`;
  return `${type} ${tx} à ${c}`;
}

export async function publishListing(
  state: PostWizardState,
  locale: string
): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expired — please log in again.");
  const userId = user.id;

  // Upload images
  const imageUrls: string[] = [];
  for (const file of state.images) {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("property-images")
      .upload(path, file);
    if (uploadErr) throw uploadErr;
    const { data: { publicUrl } } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);
    imageUrls.push(publicUrl);
  }

  const title = generateTitle(
    state.propertyType!,
    state.transactionType!,
    state.city!,
    locale
  );

  const { data, error } = await supabase
    .from("properties")
    .insert({
      user_id: userId,
      title,
      property_type: state.propertyType,
      transaction_type: state.transactionType,
      city: state.city,
      price: Number(state.price),
      currency: "MAD",
      contact_phone: state.contactPhone || null,
      images: imageUrls,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id };
}
