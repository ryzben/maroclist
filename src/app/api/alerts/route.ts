import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/utils";
import { CITIES, PROPERTY_TYPES } from "@/types/property";

const TX = ["sale", "rent", "holiday_rental"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Honeypot: real users never see or fill this field
    if (body.company) return NextResponse.json({ ok: true });

    const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : null;
    const whatsappRaw = typeof body.whatsapp === "string" && body.whatsapp.trim() ? body.whatsapp.trim() : null;
    const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : null;

    if (!email && !whatsapp) return NextResponse.json({ error: "contact" }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });
    if (whatsapp && !/^\+?\d{9,15}$/.test(whatsapp)) return NextResponse.json({ error: "whatsapp" }, { status: 400 });

    const city = (CITIES as string[]).includes(body.city) && body.city !== "other" ? body.city : null;
    const property_type = (PROPERTY_TYPES as string[]).includes(body.property_type) ? body.property_type : null;
    const transaction_type = TX.includes(body.transaction_type) ? body.transaction_type : null;
    const budget = Number(String(body.budget_max ?? "").replace(/\D/g, ""));
    const budget_max = budget > 0 ? budget : null;
    const locale = ["fr", "en", "ar"].includes(body.locale) ? body.locale : "fr";
    const source = typeof body.source === "string" ? body.source.slice(0, 40) : null;

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("listing_alerts")
      .insert({ email, whatsapp, city, property_type, transaction_type, budget_max, locale, source });

    // 23505 = same contact already has this exact alert — treat as success
    if (error && error.code !== "23505") {
      console.error("listing_alerts insert error:", error);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("alerts route error:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
