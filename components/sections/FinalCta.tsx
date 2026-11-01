import { useLocale, useTranslations } from "next-intl";
import { ANCHORS, SITE, appLink } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { AccentWord } from "@/components/ui/AccentWord";
import { Button } from "@/components/ui/Button";

// Closing screen: the `display` headline one step smaller than the hero's and the same two buttons.
export function FinalCta() {
  const t = useTranslations("final");
  const locale = useLocale();
  return (
    <Section
      tone="card"
      border="top"
      padding="py-[clamp(64px,8vw,128px)]"
      containerClassName="flex flex-col items-start gap-7"
    >
      <h2 className="t-display text-[clamp(44px,7.5vw,104px)]!">
        {t("title")} <AccentWord>{t("titleAccent")}</AccentWord>
      </h2>
      <div className="flex w-[min(100%,520px)] flex-wrap gap-x-3 gap-y-2">
        <Button href={appLink(SITE.register, locale)} arrow data-track="final_cta" className="flex-[1_1_240px]">
          {t("cta")}
        </Button>
        <Button href={ANCHORS.drivers} variant="secondary" data-track="driver_cta" className="flex-[1_1_160px]">
          {t("driver")}
        </Button>
      </div>
    </Section>
  );
}
