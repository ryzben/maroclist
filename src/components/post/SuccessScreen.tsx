"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle, Share2, Pencil, Eye } from "lucide-react";

interface SuccessScreenProps {
  listingId: string;
}

export default function SuccessScreen({ listingId }: SuccessScreenProps) {
  const t = useTranslations();
  const locale = useLocale();
  const listingUrl = `https://maroclist.com/${locale}/listings/${listingId}`;

  function shareWhatsApp() {
    const text = encodeURIComponent(`${t("wizard.shareText")} ${listingUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(listingUrl);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900">{t("wizard.successTitle")}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("wizard.successSubtitle")}</p>

      {/* Link */}
      <div className="mt-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left">
        <p className="truncate text-xs font-mono text-gray-500">{listingUrl}</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={shareWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t("wizard.shareWhatsApp")}
        </button>

        <button
          onClick={copyLink}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Share2 className="h-4 w-4" />
          {t("wizard.copyLink")}
        </button>
      </div>

      {/* Add details prompt */}
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left">
        <p className="text-sm font-semibold text-orange-800">{t("wizard.addDetailsTitle")}</p>
        <p className="mt-1 text-xs text-orange-600">{t("wizard.addDetailsDesc")}</p>
        <Link
          href={`/my-listings/${listingId}/edit`}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("wizard.addDetailsCta")}
        </Link>
      </div>

      {/* Exit links */}
      <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
        <Link
          href={`/listings/${listingId}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          {t("wizard.viewListing")}
        </Link>
        <Link href="/" className="text-xs font-semibold text-gray-400 hover:text-gray-600">
          {t("wizard.backToHome")}
        </Link>
      </div>
    </div>
  );
}
