"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { Wordmark } from "@/components/ui";

/*
  Fußzeile (DESIGN.md §5): warm-dunkle Fläche, ab md vier Spalten:
  Wortmarke mit einem Satz, Entdecken, Werkzeuge, Rechtliches.
  Links hell bei Hover, Copyright in caption und dark-text (nicht dunkler).
*/

const linkClass = "text-base text-dark-text transition-colors hover:text-white";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-white">{title}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

export default function HomeFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const de = locale === "de";

  const tagline = t.has("footer.tagline")
    ? t("footer.tagline")
    : de
      ? "Rezepte aus deiner Küche, deinem Supermarkt und deiner Familie."
      : "Recipes from your kitchen, your supermarket and your family.";
  const explore = t.has("footer.explore") ? t("footer.explore") : de ? "Entdecken" : "Explore";
  const tools = t.has("footer.tools") ? t("footer.tools") : de ? "Werkzeuge" : "Tools";
  const legal = t.has("footer.legal") ? t("footer.legal") : de ? "Rechtliches" : "Legal";
  const collections = t.has("footer.collections") ? t("footer.collections") : de ? "Rezept-Kollektionen" : "Recipe collections";

  return (
    <footer className="bg-dark text-dark-text">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-4 md:gap-8">
          <div className="flex flex-col items-start gap-3">
            <Wordmark onDark />
            <p className="max-w-prose text-base text-dark-text">{tagline}</p>
          </div>

          <FooterColumn title={explore}>
            <li><Link href="/recipes" className={linkClass}>{de ? "Rezepte" : "Recipes"}</Link></li>
            <li><Link href="/collections/explore" className={linkClass}>{collections}</Link></li>
            <li><Link href="/blog" className={linkClass}>Blog</Link></li>
            <li><Link href="/about" className={linkClass}>{t("footer.about")}</Link></li>
          </FooterColumn>

          <FooterColumn title={tools}>
            <li><Link href="/weekly-meal-planner" className={linkClass}>{t("footer.planner")}</Link></li>
            <li><Link href="/grocery-list-calculator" className={linkClass}>{t("footer.calculator")}</Link></li>
          </FooterColumn>

          <FooterColumn title={legal}>
            <li><Link href="/impressum" className={linkClass}>{t("footer.impressum")}</Link></li>
            <li><Link href="/datenschutz" className={linkClass}>{t("footer.datenschutz")}</Link></li>
            <li><Link href="/ki-transparenz" className={linkClass}>{t("footer.aiTransparency")}</Link></li>
            <li><Link href="/agb" className={linkClass}>{t("footer.agb")}</Link></li>
            <li><Link href="/widerruf" className={linkClass}>{t("footer.widerruf")}</Link></li>
            <li><a href="mailto:peter@hoelzer.xyz" className={linkClass}>{t("footer.contact")}</a></li>
          </FooterColumn>
        </div>

        <p className="mt-10 border-t border-dark-text/20 pt-6 text-caption text-dark-text">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
