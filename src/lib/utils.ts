import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "MAD", locale = "fr-MA") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\s/g, "");
  if (digits.startsWith("0") && !digits.startsWith("00")) {
    return "+212" + digits.slice(1);
  }
  if (digits.startsWith("212") && !digits.startsWith("+")) {
    return "+" + digits;
  }
  return digits;
}

// 1 USD ≈ 10 MAD (indicative rate for display purposes)
const MAD_TO_USD = 0.1;

export function madToUsd(madAmount: number): string {
  const usd = Math.round(madAmount * MAD_TO_USD);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function whatsappUrl(phone: string, message: string): string {
  const cleaned = normalizePhone(phone).replace("+", "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function formatArea(area: number, locale = "fr") {
  return `${new Intl.NumberFormat(locale).format(area)} m²`;
}

export function timeAgo(dateString: string, locale: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "ar" ? "اليوم" : locale === "fr" ? "Aujourd'hui" : "Today";
  if (diffDays === 1) return locale === "ar" ? "أمس" : locale === "fr" ? "Hier" : "Yesterday";
  if (diffDays < 7)
    return locale === "ar" ? `منذ ${diffDays} أيام` : locale === "fr" ? `Il y a ${diffDays} jours` : `${diffDays} days ago`;
  if (diffDays < 30)
    return locale === "ar"
      ? `منذ ${Math.floor(diffDays / 7)} أسابيع`
      : locale === "fr"
      ? `Il y a ${Math.floor(diffDays / 7)} semaines`
      : `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB");
}
