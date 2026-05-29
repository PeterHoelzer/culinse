"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function CTA() {
  const t = useTranslations();
  return (
    <section
      className="py-20 px-4 text-white text-center"
      style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("cta.title")}</h2>
        <p className="text-orange-100 text-lg mb-8 max-w-lg mx-auto">{t("cta.subtitle")}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3.5 rounded-full text-base transition-opacity hover:opacity-90"
          style={{ color: "#f97316" }}
        >
          {t("cta.button")}
        </Link>
      </div>
    </section>
  );
}
