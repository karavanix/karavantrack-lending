import { useTranslations } from "next-intl";
import { Eyebrow } from "./ui/Eyebrow";
import { PhoneFrame } from "./ui/PhoneFrame";
import { LoopVideo } from "./ui/LoopVideo";
import { StoreBadges } from "./ui/StoreBadges";

// «Водителям»: the one block for the second audience. Headline without the accent word,
// the driver app recording (#9) in a phone, the store badges. The recording is the top 660 px of
// the screen (header + the load card with its button), so the phone rises from the section's
// bottom edge and is cut there — the empty list below the card never shows.
export function Drivers() {
  const t = useTranslations("drivers");
  return (
    <section id="drivers" className="overflow-hidden border-y border-line-soft bg-card pt-[clamp(64px,7vw,112px)]">
      <div className="container-page flex flex-wrap items-end gap-x-16 gap-y-10">
        <div className="flex flex-[1_1_380px] flex-col gap-5 self-center pb-[clamp(64px,7vw,112px)]">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="t-feature">{t("title")}</h2>
          <p className="text-[clamp(17px,1.6vw,19px)] leading-[1.55] text-ink-muted">{t("text")}</p>
          <StoreBadges googlePlay={t("googlePlay")} appStore={t("appStore")} className="mt-1" />
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] justify-center">
          <PhoneFrame ratio="720 / 660" cut="bottom" className="w-[min(340px,78%)]">
            <LoopVideo
              src="/media/09-driver-start.ru.mp4"
              poster="/media/09-driver-start.ru.webp"
              label={t("video")}
              width={720}
              height={660}
            />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
