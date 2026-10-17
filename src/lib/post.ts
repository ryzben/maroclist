import { supabase } from "@/lib/supabase";
import type { PropertyType, TransactionType, City } from "@/types/property";
import { listingTitle } from "@/lib/listingTitle";

export interface PostWizardState {
  propertyType: PropertyType | null;
  transactionType: TransactionType | null;
  city: City | null;
  neighborhood: string | null;
  price: string;
  bedrooms: string;
  area: string;
  floor: string;
  description: string;
  images: File[];
  contactPhone: string;
}

export async function publishListing(
  state: PostWizardState,
  { source = "wizard" }: { source?: "wizard" | "quick" } = {}
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

  // Stored titles are only used for search + emails; pages render listingTitle() per locale
  const titleFields = {
    property_type: state.propertyType!,
    transaction_type: state.transactionType!,
    city: state.city!,
    neighborhood: state.neighborhood,
    bedrooms: state.bedrooms ? Number(state.bedrooms) : null,
  };
  const title = listingTitle(titleFields, "fr");
  const title_ar = listingTitle(titleFields, "ar");

  const { data, error } = await supabase
    .from("properties")
    .insert({
      user_id: userId,
      title,
      title_ar,
      property_type: state.propertyType,
      transaction_type: state.transactionType,
      city: state.city,
      neighborhood: state.neighborhood || null,
      price: Number(state.price),
      currency: "MAD",
      bedrooms: state.bedrooms ? Number(state.bedrooms) : null,
      area_sqm: state.area ? Number(state.area) : null,
      floor: state.floor ? Number(state.floor) : null,
      description: state.description || null,
      contact_phone: state.contactPhone || null,
      images: imageUrls,
      is_active: true,
      // Only sent for non-default sources so the wizard keeps working before the migration is applied
      ...(source !== "wizard" ? { source } : {}),
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id };
}
