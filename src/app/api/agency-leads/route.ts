import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { agencyName, city, listingCountRange, contactName, email, whatsapp } = await req.json();

    if (!agencyName || !city || !listingCountRange || !contactName || !email || !whatsapp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error: dbError } = await supabase.from("agency_leads").insert({
      agency_name: agencyName,
      city,
      listing_count_range: listingCountRange,
      contact_name: contactName,
      email,
      whatsapp,
      status: "pending",
    });

    if (dbError) {
      console.error("agency_leads insert error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Notify team — non-fatal if email fails
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Maroclist <noreply@maroclist.com>",
          to: "contact@maroclist.com",
          subject: `Nouvelle agence : ${agencyName} — ${city}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#f97316">Nouvelle demande agence</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px 0;color:#666;width:160px">Agence</td><td style="padding:6px 0;font-weight:600">${agencyName}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Ville</td><td style="padding:6px 0">${city}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Annonces</td><td style="padding:6px 0">${listingCountRange}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Contact</td><td style="padding:6px 0">${contactName}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${email}</td></tr>
                <tr><td style="padding:6px 0;color:#666">WhatsApp</td><td style="padding:6px 0">${whatsapp}</td></tr>
              </table>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Agency lead email error:", emailErr);
      }
    } else {
      // TODO: configure RESEND_API_KEY to enable email notifications
      console.log("Agency lead (email not configured):", { agencyName, city, contactName, email, whatsapp });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Agency leads route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
