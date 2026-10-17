import { getTranslations } from "next-intl/server";
import { BellOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createSupabasePublicClient } from "@/lib/supabase-public";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const t = await getTranslations("alerts");
  let ok = false;
  if (token && /^[0-9a-f-]{36}$/i.test(token)) {
    const { data } = await createSupabasePublicClient().rpc("unsubscribe_alert", { p_token: token });
    ok = data === true;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <BellOff className="h-6 w-6 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{ok ? t("unsubscribedTitle") : t("unsubscribeInvalid")}</h1>
        {ok && <p className="mt-2 text-sm text-gray-500">{t("unsubscribedDesc")}</p>}
        <Link href="/listings" className="btn-primary mt-6">{t("browse")}</Link>
      </main>
      <Footer />
    </>
  );
}
