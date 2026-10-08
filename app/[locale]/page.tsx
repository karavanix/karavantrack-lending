import { setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Trip } from "@/components/trip/Trip";
import { Start } from "@/components/sections/Start";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Nav />
      <main>
        <Trip />
        <Start />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
