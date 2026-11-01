import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLiveLocale, isLocale, locales } from "./i18n/routing";

const intl = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  // `/` always goes to /ru: the main audience reads Russian; uz and en are a click away in the
  // switcher. Browser-language detection would also send Uzbek visitors with ru browsers astray.
  localeDetection: false,
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && !isLiveLocale(first)) {
    // A locale that is built but not served yet (none right now) → /ru (307).
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${rest.length ? `/${rest.join("/")}` : ""}`;
    return NextResponse.redirect(url, 307);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
