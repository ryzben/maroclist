"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Menu, X, PlusCircle, Globe, LayoutList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const LOCALES = [
  { code: "fr", short: "FR", full: "Français" },
  { code: "en", short: "EN", full: "English" },
  { code: "ar", short: "عر", full: "العربية" },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/");
  }

  const tSell = useTranslations("sell");
  const navLinks = [
    { href: "/listings", label: t("listings") },
    { href: "/sell",     label: tSell("navLink") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm"
          : "bg-white border-b border-gray-100"
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img src="/maroclist-logo2.jpg" alt="MarocList" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  pathname === href
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400 ms-0.5" />
              {LOCALES.map(({ code, short, full }) => (
                <Link
                  key={code}
                  href={pathname}
                  locale={code}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-sm font-semibold transition whitespace-nowrap",
                    locale === code
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm"
                  )}
                >
                  <span className="hidden lg:inline">{full}</span>
                  <span className="lg:hidden">{short}</span>
                </Link>
              ))}
            </div>

            {/* Auth – desktop */}
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  <Link
                    href="/my-listings"
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
                      pathname === "/my-listings"
                        ? "bg-orange-50 text-orange-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                    {t("myListings")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  {t("login")}
                </Link>
              )}
            </div>

            {/* Post ad CTA */}
            <Link
              href="/post"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              {t("post")}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="container-page space-y-1 py-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-xl px-4 py-2.5 text-sm font-medium",
                  pathname === href
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {label}
              </Link>
            ))}

            {/* Language + auth */}
            <div className="border-t border-gray-100 pt-3 pb-1 flex flex-col gap-2">
              {/* Language switcher mobile */}
              <div className="flex items-center gap-1.5 px-4 py-2">
                <Globe className="h-4 w-4 text-gray-400 me-1 shrink-0" />
                {LOCALES.map(({ code, short, full }) => (
                  <Link
                    key={code}
                    href={pathname}
                    locale={code}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-center text-sm font-semibold transition",
                      locale === code
                        ? "bg-orange-500 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {full}
                  </Link>
                ))}
              </div>

              {user ? (
                <>
                  <Link href="/my-listings" onClick={() => setMobileOpen(false)} className="btn-secondary justify-start gap-2">
                    <LayoutList className="h-4 w-4" />
                    {t("myListings")}
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary justify-start gap-2">
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary justify-start">
                  {t("login")}
                </Link>
              )}

              <Link href="/post" onClick={() => setMobileOpen(false)} className="btn-primary justify-start">
                <PlusCircle className="h-4 w-4" />
                {t("post")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
