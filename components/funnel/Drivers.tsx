import { useTranslations } from "next-intl";
import { Eyebrow } from "./ui/Eyebrow";
import { PhoneFrame } from "./ui/PhoneFrame";
import { LoopVideo } from "./ui/LoopVideo";
import { StoreBadges } from "./ui/StoreBadges";

// «Водителям»: the one block for the second audience. Headline without the accent word,
// the driver app recording (#9) in a phone, the store badges.
export function Drivers() {
  const t = useTranslations("drivers");
  return (
    <section id="drivers" className="border-y border-line-soft bg-card py-[clamp(64px,7vw,112px)]">
      <div className="container-page flex flex-wrap items-center gap-x-16 gap-y-10">
        <div className="flex flex-[1_1_380px] flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="t-feature">{t("title")}</h2>
          <p className="text-[clamp(17px,1.6vw,19px)] leading-[1.55] text-ink-muted">{t("text")}</p>
          <StoreBadges googlePlay={t("googlePlay")} appStore={t("appStore")} className="mt-1" />
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] justify-center">
          <PhoneFrame ratio="720 / 1528" className="w-[min(280px,72%)]">
            <LoopVideo
              src="/media/09-driver-start.ru.mp4"
              poster="/media/09-driver-start.ru.webp"
              label={t("video")}
              width={720}
              height={1528}
            />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
