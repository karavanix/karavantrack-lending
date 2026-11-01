import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLiveLocale, isLocale, locales } from "./i18n/routing";

const intl = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Everyone lands on /ru until the uz/en translations exist.
  localeDetection: false,
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && !isLiveLocale(first)) {
    // Temporary: /uz and /en → /ru (307) until the translations and recordings are ready.
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${rest.length ? `/${rest.join("/")}` : ""}`;
    return NextResponse.redirect(url, 307);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
