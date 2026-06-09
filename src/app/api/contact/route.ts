import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const { propertyId, senderName, senderPhone, message } = await req.json();

    if (!propertyId || !senderName || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Fetch owner email server-side — never trust client-supplied email
    const { data: property } = await supabase
      .from("properties")
      .select("contact_email, title")
      .eq("id", propertyId)
      .single();
    const ownerEmail = property?.contact_email ?? null;
    const propertyTitle = property?.title ?? "";

    // Rate limit: max 5 messages per property per hour
    const { count: recentCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((recentCount ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
    }

    const { error: dbError } = await supabase.from("messages").insert({
      property_id: propertyId,
      property_title: propertyTitle,
      owner_email: ownerEmail,
      sender_name: senderName,
      sender_phone: senderPhone || null,
      message,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Send email notification if Resend API key is configured
    if (process.env.RESEND_API_KEY && ownerEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Maroclist <noreply@maroclist.com>",
          to: ownerEmail,
          subject: `Nouveau message pour : ${propertyTitle}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#f97316">Nouveau message reçu</h2>
              <p><strong>Annonce :</strong> ${escapeHtml(propertyTitle ?? "")}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p><strong>De :</strong> ${escapeHtml(senderName)}</p>
              ${senderPhone ? `<p><strong>Téléphone :</strong> ${escapeHtml(senderPhone)}</p>` : ""}
              <p><strong>Message :</strong></p>
              <p style="background:#f9f9f9;padding:12px;border-radius:8px">${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p style="color:#999;font-size:12px">Maroclist.com</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        return NextResponse.json({ ok: true, emailSent: false });
      }
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
