import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { validateRecord, MAX_IMPORT_IMAGES, type ImportListing } from "@/lib/bulkImport";
import { listingTitle } from "@/lib/listingTitle";

// One listing per request keeps each call well inside serverless time limits; the page drives the loop
export const maxDuration = 60;

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Copies an external photo into our bucket so listings never depend on the agency's site staying up. */
async function mirrorImage(supabase: Supabase, userId: string, url: string): Promise<string | null> {
  if (url.includes(".supabase.co/storage/v1/object/public/property-images/")) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!res.ok || !IMAGE_TYPES[type]) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    const path = `${userId}/import-${Date.now()}-${Math.random().toString(36).slice(2)}.${IMAGE_TYPES[type]}`;
    const { error } = await supabase.storage.from("property-images").upload(path, buf, { contentType: type });
    if (error) return null;
    return supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    const body = await req.json();
    const { record, partnerName, partnerPhone, verified, batchId } = body as {
      record: Record<string, string> | ImportListing;
      partnerName?: string;
      partnerPhone?: string;
      verified?: boolean;
      batchId?: string;
    };

    // Re-validate server-side; the client preview is only a convenience
    const raw = Object.fromEntries(
      Object.entries(record ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.join("|") : v == null ? "" : String(v)])
    );
    const { listing, errors } = validateRecord(raw, partnerPhone?.trim() || null);
    if (!listing) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

    const images: string[] = [];
    let failedImages = 0;
    for (const url of listing.images.slice(0, MAX_IMPORT_IMAGES)) {
      const mirrored = await mirrorImage(supabase, user.id, url);
      if (mirrored) images.push(mirrored);
      else failedImages++;
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        title: listingTitle(listing, "fr"),
        title_ar: listingTitle(listing, "ar"),
        property_type: listing.property_type,
        transaction_type: listing.transaction_type,
        city: listing.city,
        neighborhood: listing.neighborhood,
        price: listing.price,
        currency: "MAD",
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        area_sqm: listing.area_sqm,
        floor: listing.floor,
        description: listing.description,
        description_ar: listing.description_ar,
        contact_phone: listing.contact_phone,
        contact_email: listing.contact_email,
        video_url: listing.video_url,
        images,
        is_active: true,
        source: "import",
        partner_name: partnerName?.trim() || null,
        is_verified_partner: !!verified,
        import_batch_id: batchId && /^[0-9a-f-]{36}$/i.test(batchId) ? batchId : null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("admin import insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data.id, images: images.length, failedImages });
  } catch (err) {
    console.error("admin import route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
