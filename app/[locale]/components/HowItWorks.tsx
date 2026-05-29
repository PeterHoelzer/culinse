"use client";
import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations();
  const steps = t.raw("howItWorks.steps") as Array<{ icon: string; title: string; desc: string }>;

  return (
    <section id="how-it-works" className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("howItWorks.title")}</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 bg-orange-50">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
