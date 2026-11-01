import { useTranslations } from "next-intl";
import { Eyebrow } from "./ui/Eyebrow";
import { HowSteps, type Step } from "./HowSteps";

// «Как это работает»: header + the steps/stage switcher (HowSteps, client). The texts come from
// messages (`how.steps[]`); the recordings are wired in HowSteps.
export function HowItWorks() {
  const t = useTranslations("how");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how" className="scroll-mt-16 border-t border-line-soft bg-card py-[clamp(64px,7vw,112px)]">
      <div className="container-page">
        <div className="flex max-w-[760px] flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="t-section">{t("title")}</h2>
          <p className="t-lead text-ink-muted">{t("lead")}</p>
        </div>
        <HowSteps steps={steps} />
      </div>
    </section>
  );
}
