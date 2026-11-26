"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { useLoginLink } from "@/lib/useLoginHref";

/*
  Hinweis für Gäste (25.11.2026): Alles auf Culinse ist kostenlos, zum Speichern
  und Nutzen braucht es nur ein kostenloses Konto. Steht dort, wo früher Pro
  beworben wurde. Der Verweis führt zur Anmeldung und danach zurück auf die
  Seite, auf der der Hinweis steht. Texte: messages/*.json, Bereich "freeAccess".
*/
export default function FreeAccountNote({ className = "" }: { className?: string }) {
  const t = useTranslations("freeAccess");
  const login = useLoginLink();

  return (
    <p className={`text-base text-ink-2 ${className}`}>
      {t("text")}{" "}
      <Link
        href={login.href as "/"}
        onClick={login.onClick}
        className="font-semibold text-brand underline underline-offset-[3px] hover:text-brand-hover"
      >
        {t("link")}
      </Link>
    </p>
  );
}
