import { useLocale, useTranslations } from "next-intl";
import { clip } from "@/lib/media";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { PhoneFrame } from "@/components/media/PhoneFrame";
import { LoopVideo } from "@/components/media/LoopVideo";

// «Водителям»: the one block for the second audience. Headline without the accent word, the store
// badges, and the driver app recording. The clip is the top of the screen (header + the load card
// with its button), so the phone rises from the section's bottom edge and is cut there.
export function Drivers() {
  const t = useTranslations("drivers");
  const driver = clip("driverStart", useLocale());

  return (
    <Section
      id="drivers"
      tone="card"
      border="y"
      padding="pt-[clamp(64px,7vw,112px)]"
      className="overflow-hidden"
      containerClassName="flex flex-wrap items-end gap-x-16 gap-y-10"
    >
      {/* The text keeps the block's bottom padding; the phone column runs to the edge. */}
      <div className="flex flex-[1_1_380px] flex-col gap-5 self-center pb-[clamp(64px,7vw,112px)]">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="t-feature">{t("title")}</h2>
        <p className="text-[clamp(17px,1.6vw,19px)] leading-[1.55] text-ink-muted">{t("text")}</p>
        <StoreBadges googlePlay={t("googlePlay")} appStore={t("appStore")} className="mt-1" />
      </div>
      <div className="flex min-w-0 flex-[1_1_420px] justify-center">
        <PhoneFrame ratio={`${driver.width} / ${driver.height}`} cut="bottom" className="w-[min(340px,78%)]">
          <LoopVideo clip={driver} label={t("video")} />
        </PhoneFrame>
      </div>
    </Section>
  );
}
