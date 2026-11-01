import { setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Benefits } from "@/components/sections/Benefits";
import { Features } from "@/components/sections/Features";
import { Drivers } from "@/components/sections/Drivers";
import { Start } from "@/components/sections/Start";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

// The funnel, top to bottom (docs/funnel/README.md). Every block is a server component that
// reads its texts from messages/<locale>.json and hands clips and strings to its client parts.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Features />
        <Drivers />
        <Start />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
