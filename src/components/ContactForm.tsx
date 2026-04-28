"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle, MessageSquare } from "lucide-react";
import { normalizePhone } from "@/lib/utils";

interface ContactFormProps {
  propertyId: string;
  propertyTitle: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export default function ContactForm({ propertyId, propertyTitle, ownerEmail, ownerPhone }: ContactFormProps) {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          propertyTitle,
          ownerEmail,
          senderName: form.name,
          senderPhone: form.phone,
          message: form.message,
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status} — please try again.`);
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-emerald-800">{t("success")}</p>
          <p className="mt-1 text-xs text-emerald-600">Le vendeur vous répondra dès que possible.</p>
        </div>
        {ownerPhone && (
          <a href={`tel:${ownerPhone}`} className="btn-primary mt-2">
            {ownerPhone}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
        <MessageSquare className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {/* WhatsApp CTA */}
        {ownerPhone && (
          <a
            href={`https://wa.me/${normalizePhone(ownerPhone).replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] active:scale-[.98]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        )}

        {/* Divider */}
        {ownerPhone && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">ou envoyez un message</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">{t("name")}</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="label">{t("phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+212 6XX XXX XXX"
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("message")}</label>
            <textarea
              required
              rows={3}
              placeholder={t("messagePlaceholder")}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
          <Send className="h-4 w-4" />
          {loading ? "..." : t("send")}
        </button>
      </form>
    </div>
  );
}
