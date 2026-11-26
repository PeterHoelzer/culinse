import type { Metadata } from "next";
import SystemPage from "@/components/SystemPage";

export const metadata: Metadata = {
  title: "Seite nicht gefunden · Page not found",
};

// Bewusst OHNE next-intl: not-found.tsx erhält keine params, und
// getTranslations ohne explizite Locale warf hier in Produktion einen 500 —
// jeder unbekannte Blog-Slug lieferte "Internal Server Error" statt 404
// (Soft-Error-Signale an Google, SEO-Runde 17.08). Die Seite liest die Sprache
// deshalb aus der Adresse und die Texte aus einer festen Tabelle
// (components/SystemPage.tsx, lib/systemTexts.ts); das kann nicht crashen.
export default function NotFound() {
  return <SystemPage kind="notFound" />;
}
