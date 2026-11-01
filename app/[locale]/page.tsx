import { setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/funnel/Nav";
import { Hero } from "@/components/funnel/Hero";
import { HowItWorks } from "@/components/funnel/HowItWorks";
import { Benefits } from "@/components/funnel/Benefits";
import { Footer } from "@/components/funnel/Footer";

// Block order follows docs/funnel/design/landing.html:
// Nav → Hero → HowItWorks → Benefits → Features → Drivers → StartBlock (+ LeadForm) → Faq → FinalCta → Footer.
// Sessions 3–4 add the remaining middle blocks here (docs/funnel/plan.md).
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
      </main>
      <Footer />
    </>
  );
}
