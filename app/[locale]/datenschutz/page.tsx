import type { Metadata } from "next";
import DatenschutzContent from "@/components/legal/DatenschutzContent";

/*
  Der Text ist in jeder Sprache derselbe deutsche Rechtstext. Bis 25.11.2026
  nannte jede Sprachfassung sich selbst als Hauptadresse und verwies per
  hreflang auf eine „englische“ Fassung, die es nicht gibt. Google führte die
  Seiten deshalb als Doppelung. Jetzt gilt für alle Fassungen die feste Adresse
  ohne Sprache als Hauptadresse (app/(legal)/datenschutz), ohne Sprachverweise.
*/
export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung von Culinse gemäß DSGVO",
  alternates: { canonical: "https://culinse.com/datenschutz" },
};

export default function Datenschutz() {
  return <DatenschutzContent />;
}
