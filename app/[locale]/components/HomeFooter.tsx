"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function HomeFooter() {
  const t = useTranslations();
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "22px", width: "auto", filter: "brightness(0) invert(1)" }} />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">{t("footer.about")}</Link>
            <Link href="/impressum" className="hover:text-white transition-colors">{t("footer.impressum")}</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">{t("footer.datenschutz")}</Link>
            <a href="mailto:peter@hoelzer.xyz" className="hover:text-white transition-colors">{t("footer.contact")}</a>
          </div>
          <p className="text-xs text-gray-600">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
