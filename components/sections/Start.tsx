import { useTranslations } from "next-intl";
import { SITE } from "@/lib/site";
import type { LeadLabels } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { AccentWord } from "@/components/ui/AccentWord";
import { Button } from "@/components/ui/Button";
import { TelegramLink } from "@/components/ui/Telegram";
import { LeadForm } from "./LeadForm";

// The navy start band (#start): headline, three steps 01–03, the light main button and the
// «already have an account» link; the lead form for large fleets sits beside them, with
// «write to us in Telegram» under it for those who'd rather message than fill in fields.
export function Start() {
  const t = useTranslations("start");
  const l = useTranslations("lead");
  const steps = t.raw("steps") as string[];
  const labels: LeadLabels = {
    title: l("title"),
    text: l("text"),
    name: l("name"),
    company: l("company"),
    phone: l("phone"),
    fleet: l("fleet"),
    fleetOptions: l.raw("fleetOptions") as string[],
    submit: l("submit"),
    sending: l("sending"),
    success: l("success"),
    error: l("error"),
    required: l("required"),
  };

  return (
    <Section id="start" tone="dark" containerClassName="flex flex-wrap items-start gap-x-20 gap-y-12">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-7">
        <h2 className="t-section">
          {t("title")} <AccentWord tone="dark">{t("titleAccent")}</AccentWord>
        </h2>
        <ol className="flex flex-col gap-3.5 text-lg leading-[1.5] text-white/80">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3.5">
              <span className="font-mono font-medium text-accent-soft">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button href={SITE.register} variant="light" arrow data-track="start_cta" className="flex-[0_1_300px]">
            {t("cta")}
          </Button>
          <a href={SITE.login} data-track="login" className="text-[15px] font-medium text-accent-soft transition hover:text-white">
            {t("login")}
          </a>
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
        <LeadForm t={labels} />
        <p className="px-1 text-[15px] leading-[1.5] text-white/70">
          {l("telegramHint")}{" "}
          <TelegramLink place="start" className="font-medium text-accent-soft transition hover:text-white">
            {l("telegram")}
          </TelegramLink>
        </p>
      </div>
    </Section>
  );
}
