import { ImageResponse } from "next/og";
import sharp from "sharp";
import { createSupabasePublicClient } from "@/lib/supabase-public";
import { listingTitle, formatLocation } from "@/lib/listingTitle";
import { optimizeImage } from "@/lib/imageUrl";
import { formatPrice, madToUsd } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 3600;
export const alt = "Maroclist";

// Satori can't shape Arabic or decode WebP, so the card text uses the French/English
// title and we only embed JPEG/PNG photos (anything else falls back to the brand gradient).
const IMAGE_TYPES = ["image/jpeg", "image/png"];

async function photoDataUrl(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(optimizeImage(url, { width: 1200, quality: 80, format: "origin" }), {
      signal: AbortSignal.timeout(4000),
    });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !IMAGE_TYPES.includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const PERIOD: Record<string, Record<string, string>> = {
  rent: { en: " / month", fr: " / mois" },
  holiday_rental: { en: " / night", fr: " / nuit" },
};

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const textLocale = locale === "en" ? "en" : "fr";
  const supabase = createSupabasePublicClient();
  const { data: p } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!p) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f97316", color: "white", fontSize: 72, fontWeight: 800 }}>
          Maroclist
        </div>
      ),
      size
    );
  }

  const photo = await photoDataUrl(p.images?.[0]);
  const isMad = !p.currency || p.currency === "MAD";
  const price = formatPrice(Number(p.price), p.currency || "MAD", "fr-MA").replace(/ | /g, " ");
  const period = PERIOD[p.transaction_type]?.[textLocale] ?? "";
  const facts = [
    p.bedrooms ? (textLocale === "en" ? `${p.bedrooms} bed` : `${p.bedrooms} ch.`) : null,
    p.area_sqm ? `${Number(p.area_sqm)} m²` : null,
  ].filter(Boolean).join("  ·  ");

  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(135deg, #1f2937, #f97316)" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 100%)" }} />

        <div style={{ position: "absolute", top: 36, left: 44, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", background: "#f97316", color: "white", fontSize: 30, fontWeight: 800, padding: "8px 18px", borderRadius: 12 }}>
            Maroclist
          </div>
          {p.is_verified_partner && (
            <div style={{ display: "flex", background: "#059669", color: "white", fontSize: 26, fontWeight: 700, padding: "8px 16px", borderRadius: 12 }}>
              {textLocale === "en" ? "Verified Partner" : "Partenaire vérifié"}
            </div>
          )}
        </div>

        <div style={{ position: "absolute", left: 44, right: 44, bottom: 40, display: "flex", flexDirection: "column", color: "white" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#fdba74" }}>{`${price}${period}`}</div>
            {isMad && <div style={{ fontSize: 40, fontWeight: 600, opacity: 0.9 }}>{`≈ ${madToUsd(Number(p.price))}`}</div>}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginTop: 8 }}>{listingTitle(p, textLocale)}</div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 10, opacity: 0.85, gap: 24 }}>
            <span>{formatLocation(p, textLocale)}</span>
            {facts && <span>{facts}</span>}
          </div>
        </div>
      </div>
    ),
    size
  );

  // Satori only emits PNG (~1 MB with a photo); WhatsApp drops previews much over 300 KB, so re-encode as JPEG
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer())).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
