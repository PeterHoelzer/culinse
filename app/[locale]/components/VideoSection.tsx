"use client";

import { useTranslations } from "next-intl";

// Coming-soon-Zustand (13.09.2026): Die frueheren Tasty-Videos sind mit dem
// Provider-Ausbau entfallen — hier entsteht Platz fuer eigene Koch-Videos.
export default function VideoSection() {
  const t = useTranslations();
  return (
    <section className="pb-12" style={{ background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          {t("videoSection.title")}
        </h2>
        <p className="text-sm text-gray-400 mb-8">{t("videoSection.subtitle")}</p>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-14 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 border border-orange-400/40 rounded-full px-3 py-1 mb-4">
            {t("videoSection.comingSoonBadge")}
          </span>
          <p className="text-white text-lg font-semibold mb-2">{t("videoSection.comingSoonTitle")}</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{t("videoSection.comingSoonText")}</p>
        </div>
      </div>
    </section>
  );
}
