import { useLocale, useTranslations } from "next-intl";
import { ANCHORS, SITE } from "@/lib/site";
import { clip } from "@/lib/media";
import { Section } from "@/components/ui/Section";
import { AccentWord } from "@/components/ui/AccentWord";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HeroMedia } from "./HeroMedia";

// First screen: eyebrow, the display headline, lead + two buttons, then the synced pair of
// recordings (cabinet window + driver's phone).
export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();

  return (
    <Section
      padding="pb-[clamp(64px,6vw,80px)] pt-[clamp(28px,5vw,72px)]"
      containerClassName="flex flex-col gap-[clamp(20px,3vw,40px)]"
    >
      <Eyebrow line>{t("eyebrow")}</Eyebrow>

      <h1 className="t-display">
        {t("title")} <AccentWord>{t("titleAccent")}</AccentWord>
      </h1>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <p data-hero-lead className="t-lead max-w-[520px] flex-[1_1_360px] text-ink-muted">
          {t("lead")}
        </p>
        <div className="flex flex-[0_1_500px] flex-col gap-3">
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <Button href={SITE.register} arrow data-hero-cta data-track="hero_cta" className="flex-[1_1_240px]">
              {t("cta")}
            </Button>
            <Button href={ANCHORS.drivers} variant="secondary" data-track="driver_cta" className="flex-[1_1_160px]">
              {t("driver")}
            </Button>
          </div>
          <span className="font-mono text-xs font-medium text-ink-muted">{t("note")}</span>
        </div>
      </div>

      <HeroMedia
        cabinet={clip("heroCabinet", locale)}
        phone={clip("heroPhone", locale)}
        cabinetLabel={t("videoCabinet")}
        phoneLabel={t("videoPhone")}
      />
    </Section>
  );
}
