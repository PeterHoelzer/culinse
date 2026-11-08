"use client";

import { useTranslations } from "next-intl";
import { Icon, SectionHeader, type IconName } from "@/components/ui";

/*
  So funktioniert Culinse (DESIGN.md §3): linksbündig, drei Spalten mit
  oberer Linie, Strich-Icon statt Emoji-Kachel, Titel in Serife.
*/
const STEP_ICONS: IconName[] = ["search", "heart", "cart"];

export default function HowItWorks() {
  const t = useTranslations();
  const steps = t.raw("howItWorks.steps") as Array<{ icon?: string; title: string; desc: string }>;

  return (
    <section id="how-it-works" className="bg-surface-soft">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeader title={t("howItWorks.title")} subtitle={t("howItWorks.subtitle")} />
      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col items-start gap-3 border-t border-line pt-4">
            <Icon name={STEP_ICONS[i] ?? "utensils"} size={24} className="text-ink-3" />
            <h3 className="text-h3">{step.title}</h3>
            <p className="text-base text-ink-2">{step.desc}</p>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
