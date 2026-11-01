import { useLocale, useTranslations } from "next-intl";
import type { Step } from "@/lib/content";
import { clip } from "@/lib/media";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HowSteps, type StepMedia } from "./HowSteps";

// «Как это работает»: header + the steps/stage switcher. Texts come from `how.steps[]`;
// the recordings per step are chosen here, in the order of the steps.
export function HowItWorks() {
  const t = useTranslations("how");
  const locale = useLocale();
  const steps = t.raw("steps") as Step[];
  const media: StepMedia[] = [
    { window: clip("createLoad", locale) },
    { window: clip("inviteLink", locale), phone: clip("sendLink", locale) },
    { window: clip("inTransit", locale) },
  ];

  return (
    <Section id="how" tone="card" border="top" className="scroll-mt-16">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      <HowSteps steps={steps} media={media} />
    </Section>
  );
}
