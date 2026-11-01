import { useTranslations } from "next-intl";
import { SITE } from "@/lib/site";
import { AccentWord } from "./ui/AccentWord";
import { Button } from "./ui/Button";
import { LeadForm } from "./LeadForm";

// The navy start band (#start): headline, three steps 01–03, the light main button and the
// «already have an account» link; the lead form for large fleets sits beside them.
export function StartBlock() {
  const t = useTranslations("start");
  const l = useTranslations("lead");
  const steps = t.raw("steps") as string[];
  const lead = {
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
    <section id="start" className="bg-bg py-[clamp(64px,7vw,112px)] text-surface">
      <div className="container-page flex flex-wrap items-start gap-x-20 gap-y-12">
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
            <Button href={SITE.register} variant="light" arrow className="flex-[0_1_300px]">
              {t("cta")}
            </Button>
            <a href={SITE.login} className="text-[15px] font-medium text-accent-soft transition hover:text-white">
              {t("login")}
            </a>
          </div>
        </div>
        <LeadForm t={lead} />
      </div>
    </section>
  );
}
