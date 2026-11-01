import { useTranslations } from "next-intl";
import { AccentWord } from "./ui/AccentWord";
import { BrowserFrame } from "./ui/BrowserFrame";
import { PhoneFrame } from "./ui/PhoneFrame";
import { LoopVideo } from "./ui/LoopVideo";

// Three features with recordings, no section heading and no rules between them. The recording
// alternates sides (01 window left, 02 phone right, 03 window left); on phones it sits above the text.
const media = [
  { kind: "window", src: "/media/06-offline.ru.mp4", poster: "/media/06-offline.ru.webp", width: 1920, height: 1200 },
  { kind: "phone", src: "/media/07-recipient-link.ru.mp4", poster: "/media/07-recipient-link.ru.webp", width: 720, height: 1558 },
  { kind: "window", src: "/media/08-idle.ru.mp4", poster: "/media/08-idle.ru.webp", width: 1920, height: 1200 },
] as const;

type Feature = { num: string; title: string; titleAccent: string; text: string; caption: string; video: string };

export function Features() {
  const t = useTranslations();
  const features = t.raw("features") as Feature[];

  return (
    <section className="pb-[clamp(64px,8vw,128px)] pt-[clamp(32px,4vw,56px)]">
      <div className="container-page flex flex-col gap-[clamp(72px,9vw,136px)]">
        {features.map((f, i) => {
          const m = media[i];
          const video = (
            <LoopVideo src={m.src} poster={m.poster} label={f.video} width={m.width} height={m.height} />
          );
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
                  <PhoneFrame ratio="720 / 1558" className="w-[min(300px,72%)] shadow-glow">
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
      </div>
    </section>
  );
}
