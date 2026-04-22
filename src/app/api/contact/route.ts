import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { propertyId, propertyTitle, ownerEmail, senderName, senderPhone, message } =
      await req.json();

    if (!propertyId || !senderName || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

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
              <p><strong>Annonce :</strong> ${propertyTitle}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p><strong>De :</strong> ${senderName}</p>
              ${senderPhone ? `<p><strong>Téléphone :</strong> ${senderPhone}</p>` : ""}
              <p><strong>Message :</strong></p>
              <p style="background:#f9f9f9;padding:12px;border-radius:8px">${message.replace(/\n/g, "<br/>")}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p style="color:#999;font-size:12px">Maroclist.com</p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Email failure is non-fatal — message is already saved to DB
        console.error("Email send error:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
