import { useTranslations } from "next-intl";
import { Eyebrow } from "./ui/Eyebrow";
import { BrowserFrame } from "./ui/BrowserFrame";

// «Как это работает»: three steps with huge grey numerals over a rule, frames aligned to the
// bottom. On phones the steps become a horizontal strip with scroll-snap (no JS).
// Frames: steps 1 and 3 are cabinet screenshots in a browser window, step 2 is the Telegram message.
const frames = [
  { src: "/media/03-create-load.ru.webp", width: 1600, height: 1000, window: true },
  { src: "/media/04-telegram-link.ru.webp", width: 920, height: 575, window: false },
  { src: "/media/05-in-transit.ru.webp", width: 1600, height: 1000, window: true },
] as const;

export function HowItWorks() {
  const t = useTranslations("how");
  const steps = t.raw("steps") as { title: string; text: string; image: string }[];

  return (
    <section id="how" className="scroll-mt-16 border-t border-line-soft bg-card py-[clamp(64px,7vw,112px)]">
      <div className="container-page flex flex-col gap-[clamp(32px,4vw,56px)]">
        <div className="flex max-w-[760px] flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="t-section">{t("title")}</h2>
          <p className="t-lead text-ink-muted">{t("lead")}</p>
        </div>

        <ol
          className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-x-10 gap-y-6 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
        >
          {steps.map((step, i) => {
            const f = frames[i];
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.src}
                alt={step.image}
                width={f.width}
                height={f.height}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            );
            return (
              <li
                key={step.title}
                className="flex w-[80%] shrink-0 snap-start flex-col gap-3.5 border-t-2 border-ink pt-5 md:w-auto"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[clamp(104px,11vw,168px)] font-extrabold leading-[0.8] tracking-[-0.06em] text-number"
                >
                  {i + 1}
                </span>
                <h3 className="mt-2 font-display text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="t-body text-ink-muted">{step.text}</p>
                <div className="mt-auto pt-2">
                  {f.window ? (
                    <BrowserFrame ratio="16 / 10">{img}</BrowserFrame>
                  ) : (
                    <div
                      className="relative overflow-hidden rounded-card border border-line-soft bg-surface"
                      style={{ aspectRatio: "16 / 10" }}
                    >
                      {img}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
