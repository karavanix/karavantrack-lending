import { setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Trip } from "@/components/trip/Trip";
import { TopDown } from "@/components/topdown/TopDown";
import { Start } from "@/components/sections/Start";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

// Two takes on the same story while they are being compared:
// /ru shows the trip from above, /ru?v=side the side view.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  setRequestLocale(locale);

  return (
    <>
      <Nav />
      <main>
        {v === "side" ? <Trip /> : <TopDown />}
        <Start />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
