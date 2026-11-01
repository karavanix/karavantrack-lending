import { setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/funnel/Nav";
import { Hero } from "@/components/funnel/Hero";
import { HowItWorks } from "@/components/funnel/HowItWorks";
import { Benefits } from "@/components/funnel/Benefits";
import { Features } from "@/components/funnel/Features";
import { Drivers } from "@/components/funnel/Drivers";
import { Footer } from "@/components/funnel/Footer";

// Block order follows docs/funnel/design/landing.html:
// Nav → Hero → HowItWorks → Benefits → Features → Drivers → StartBlock (+ LeadForm) → Faq → FinalCta → Footer.
// Session 4 adds StartBlock, LeadForm, Faq and FinalCta here (docs/funnel/plan.md).
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
      </main>
      <Footer />
    </>
  );
}
