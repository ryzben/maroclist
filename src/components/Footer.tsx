import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

function l(locale: string, en: string, fr: string, ar: string) {
  if (locale === "ar") return ar;
  if (locale === "fr") return fr;
  return en;
}

export default function Footer() {
  const locale = useLocale();

  const links = {
    explore: [
      { href: "/listings", label: l(locale, "All listings", "Toutes les annonces", "كل الإعلانات") },
      { href: "/listings?transaction_type=sale", label: l(locale, "For sale", "À vendre", "للبيع") },
      { href: "/listings?transaction_type=rent", label: l(locale, "For rent", "À louer", "للإيجار") },
      { href: "/listings?transaction_type=holiday_rental", label: l(locale, "Holiday rental", "Location vacances", "إيجار موسمي") },
    ],
    types: [
      { href: "/listings?property_type=apartment", label: l(locale, "Apartments", "Appartements", "شقق") },
      { href: "/listings?property_type=villa", label: l(locale, "Villas", "Villas", "فيلات") },
      { href: "/listings?property_type=riad", label: l(locale, "Riads", "Riads", "رياضات") },
      { href: "/listings?property_type=new_build", label: l(locale, "New builds", "Programmes neufs", "مشاريع جديدة") },
    ],
    account: [
      { href: "/post", label: l(locale, "Post a listing", "Déposer une annonce", "أضف إعلاناً") },
      { href: "/login", label: l(locale, "Log in", "Connexion", "تسجيل الدخول") },
      { href: "/signup", label: l(locale, "Sign up", "Inscription", "إنشاء حساب") },
    ],
  };

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/">
              <img src="/maroclist-logo2.jpg" alt="Maroclist" className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              {l(
                locale,
                "Morocco's real estate marketplace — trusted by Moroccans in the US, Canada & beyond.",
                "La plateforme immobilière au Maroc — pour les Marocains aux États-Unis, Canada et partout dans le monde.",
                "منصة العقارات في المغرب للمغاربة في أمريكا وكندا وحول العالم."
              )}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              {l(locale, "Explore", "Explorer", "تصفح")}
            </h3>
            <ul className="space-y-2.5">
              {links.explore.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              {l(locale, "Property types", "Types de biens", "أنواع العقارات")}
            </h3>
            <ul className="space-y-2.5">
              {links.types.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              {l(locale, "My account", "Mon compte", "حسابي")}
            </h3>
            <ul className="space-y-2.5">
              {links.account.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Maroclist. {l(locale, "All rights reserved.", "Tous droits réservés.", "جميع الحقوق محفوظة.")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
              {l(locale, "Privacy Policy", "Politique de confidentialité", "سياسة الخصوصية")}
            </Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
              {l(locale, "Terms of Service", "Conditions d'utilisation", "شروط الاستخدام")}
            </Link>
            <p className="text-xs text-gray-400">contact@maroclist.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
