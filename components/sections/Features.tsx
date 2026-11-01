import { useLocale, useTranslations } from "next-intl";
import type { Feature } from "@/lib/content";
import { clip, type Clip } from "@/lib/media";
import { Section } from "@/components/ui/Section";
import { AccentWord } from "@/components/ui/AccentWord";
import { BrowserFrame } from "@/components/media/BrowserFrame";
import { PhoneFrame } from "@/components/media/PhoneFrame";
import { LoopVideo } from "@/components/media/LoopVideo";

type FeatureMedia = { kind: "window" | "phone"; clip: Clip };

// Three features with recordings, no section heading and no rules between them. The recording
// alternates sides (01 window left, 02 phone right, 03 window left); on phones it sits above the text.
export function Features() {
  const t = useTranslations();
  const locale = useLocale();
  const features = t.raw("features") as Feature[];
  const media: FeatureMedia[] = [
    { kind: "window", clip: clip("offline", locale) },
    { kind: "phone", clip: clip("recipientLink", locale) },
    { kind: "window", clip: clip("idle", locale) },
  ];

  return (
    <Section
      padding="pb-[clamp(64px,8vw,128px)] pt-[clamp(32px,4vw,56px)]"
      containerClassName="flex flex-col gap-[clamp(72px,9vw,136px)]"
    >
      {features.map((f, i) => {
        const m = media[i];
        const video = <LoopVideo clip={m.clip} label={f.video} />;
        return (
          <article
            key={f.num}
            className={`flex flex-col gap-10 md:items-center md:gap-x-[72px] ${
              i % 2 ? "md:flex-row-reverse" : "md:flex-row"
            }`}
          >
            {m.kind === "window" ? (
              <div className="min-w-0 md:flex-[1_1_560px]">
                <BrowserFrame ratio="16 / 10" glow>
                  {video}
                </BrowserFrame>
              </div>
            ) : (
              <div className="flex min-w-0 justify-center md:flex-[1_1_560px]">
                <PhoneFrame ratio={`${m.clip.width} / ${m.clip.height}`} className="w-[min(300px,72%)] shadow-glow">
                  {video}
                </PhoneFrame>
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-5 md:flex-[1_1_380px]">
              <span className="t-data text-accent-deep">{f.num}</span>
              <h2 className="t-feature">
                {f.title} <AccentWord>{f.titleAccent}</AccentWord>
              </h2>
              <p className="text-[clamp(17px,1.6vw,19px)] leading-[1.55] text-ink-muted">{f.text}</p>
              <span className="flex items-center gap-2 font-mono text-xs font-medium text-ink-muted">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-accent" />
                {f.caption}
              </span>
            </div>
          </article>
        );
      })}
    </Section>
  );
}
