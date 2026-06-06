import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";

export default function TrustBar() {
  const t = useTranslations("home");
  const items = [
    { title: t("trust1Title"), desc: t("trust1Desc") },
    { title: t("trust2Title"), desc: t("trust2Desc") },
    { title: t("trust3Title"), desc: t("trust3Desc") },
    { title: t("trust4Title"), desc: t("trust4Desc") },
    { title: t("trust5Title"), desc: t("trust5Desc") },
  ];
  return (
    <section className="border-y border-teal-100 bg-teal-50 py-5">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
          {items.map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
