"use client";

import { useTranslations } from "next-intl";
import { PlusCircle } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

/** Sticky "Post an ad" bar for phones (the Navbar CTA is hidden below `sm`). Not shown inside the post flow. */
export default function MobilePostButton() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  if (pathname === "/post" || pathname.startsWith("/post/")) return null;

  return (
    <>
      {/* Spacer so the bar never covers the end of the page */}
      <div className="h-20 sm:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
        <Link
          href="/post"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 active:scale-[.98]"
        >
          <PlusCircle className="h-4 w-4" />
          {t("post")}
        </Link>
      </div>
    </>
  );
}
