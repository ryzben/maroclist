"use client";

import { useState } from "react";
import { Phone, Eye, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/lib/utils";

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s/g, "");
  if (clean.startsWith("+212") && clean.length >= 5) {
    return `+212 ${clean[4]}•• ••• •••`;
  }
  if (clean.startsWith("00212") && clean.length >= 6) {
    return `+212 ${clean[5]}•• ••• •••`;
  }
  if (clean.startsWith("0") && clean.length >= 2) {
    return `${clean.slice(0, 2)} •• •• •• ••`;
  }
  return `${clean.slice(0, 4)} •••••`;
}

interface PhoneRevealProps {
  phone: string;
  locale: string;
  title: string;
}

export default function PhoneReveal({ phone, locale, title }: PhoneRevealProps) {
  const t = useTranslations("property");
  const [revealed, setRevealed] = useState(false);

  const whatsappMsg =
    locale === "ar"
      ? `مرحباً، أنا مهتم بإعلانك على مروكليست: ${title}`
      : locale === "en"
      ? `Hello, I'm interested in your listing on Maroclist: ${title}`
      : `Bonjour, je suis intéressé par votre annonce sur Maroclist : ${title}`;

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-100 active:scale-[.98]"
      >
        <Eye className="h-4 w-4" />
        <span className="font-mono tracking-wide">{maskPhone(phone)}</span>
        <span className="text-orange-500">— {t("showPhone")}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`tel:${phone}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[.98]"
      >
        <Phone className="h-4 w-4" />
        <span className="font-mono tracking-wide">{phone}</span>
      </a>
      <a
        href={whatsappUrl(phone, whatsappMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] active:scale-[.98]"
      >
        <MessageCircle className="h-4 w-4" />
        {t("whatsapp")}
      </a>
    </div>
  );
}
