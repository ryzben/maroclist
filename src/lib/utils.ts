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
