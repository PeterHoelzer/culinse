import type { Metadata } from "next";
import ImpressumContent from "@/components/legal/ImpressumContent";

export const metadata: Metadata = {
  title: "Impressum – Culinse",
  description: "Impressum von Peter Hölzer für culinse.com und die Apps Copper City und Kernfusion (§ 5 TMG).",
  alternates: { canonical: "https://culinse.com/impressum" },
};

// Feste Adresse ohne Locale-Präfix – steht so in den Apps und in App Store Connect.
export default function Impressum() {
  return <ImpressumContent />;
}
