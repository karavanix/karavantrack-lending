import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // The page's whole stylesheet is ~8 KB: inlined into the HTML it stops competing with the fonts
  // and the first-screen posters on the HTTP/2 connection (on prod the <link> arrived ~1 s after
  // the HTML on a 1.6 Mbit/s profile, and the headline waited for it).
  experimental: { inlineCss: true },
  async headers() {
    // Files in public/ are served with max-age=0 by default. Recordings and badges are big and
    // never change under the same name (lib/media.ts → MEDIA_VERSION busts the recordings).
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/media/:path*", headers: immutable },
      { source: "/badges/:path*", headers: immutable },
    ];
  },
};

export default withNextIntl(nextConfig);
