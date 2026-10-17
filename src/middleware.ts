import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { LANG_COOKIE, countryFromHeaders, pickRootLocale } from "./lib/geoLocale";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // First visit to "/": saved language pick, else visitor's country (MA → fr, rest → en)
  if (request.nextUrl.pathname === "/") {
    const locale = pickRootLocale({
      cookie: request.cookies.get(LANG_COOKIE)?.value,
      country: countryFromHeaders((h) => request.headers.get(h)),
      acceptLanguage: request.headers.get("accept-language"),
    });
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const res = NextResponse.redirect(url);
    // Response depends on these, so shared caches must not serve one visitor's redirect to another
    res.headers.set("Vary", "Cookie, Accept-Language, X-Vercel-IP-Country, CF-IPCountry");
    return res;
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(en|fr|ar)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
