import { useTranslations } from "next-intl";
import {
  Battery,
  BatteryLow,
  Bell,
  Clock,
  FileText,
  History,
  Link,
  MapPin,
  Smartphone,
  Timer,
  Users,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import type { Benefit } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AccentWord } from "@/components/ui/AccentWord";
import { Rail } from "@/components/ui/Rail";

// One icon per card, in the order of `benefits.items` in messages.
const icons: LucideIcon[] = [
  WifiOff, Link, Timer, FileText, Clock, Bell, BatteryLow, MapPin, Smartphone, Battery, Users, History,
];

// «Звонить больше незачем»: 12 cards in a horizontal strip that runs past the right edge of the
// container. CSS scroll-snap does the scrolling; `Rail` adds the buttons and the progress mark.
export function Benefits() {
  const t = useTranslations("benefits");
  const items = t.raw("items") as Benefit[];

  return (
    <Section border="top" container={false}>
      <Rail
        head={
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={
              <>
                {t("title")} <AccentWord>{t("titleAccent")}</AccentWord>
              </>
            }
          />
        }
        hint={t("hint")}
        prev={t("prev")}
        next={t("next")}
        count={items.length}
      >
        {items.map((item, i) => {
          const Icon = icons[i];
          return (
            <li
              key={item.title}
              className="box-border flex min-h-[280px] w-[min(340px,82%)] shrink-0 snap-start flex-col gap-3 rounded-card border border-line-soft bg-card p-7"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-accent-deep">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-[22px] font-extrabold leading-[1.2] tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="t-body text-ink-muted">{item.text}</p>
            </li>
          );
        })}
      </Rail>
    </Section>
  );
}
