import type { Metadata } from "next";
import ImpressumContent from "@/components/legal/ImpressumContent";

/*
  Der Text ist in jeder Sprache derselbe deutsche Rechtstext. Bis 25.11.2026
  nannte jede Sprachfassung sich selbst als Hauptadresse und verwies per
  hreflang auf eine „englische“ Fassung, die es nicht gibt. Google führte die
  Seiten deshalb als Doppelung. Jetzt gilt für alle Fassungen die feste Adresse
  ohne Sprache als Hauptadresse (app/(legal)/impressum), ohne Sprachverweise.
*/
export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum von Culinse gemäß § 5 TMG",
  alternates: { canonical: "https://culinse.com/impressum" },
};

export default function Impressum() {
  return <ImpressumContent />;
}
