import type { Metadata } from "next";
import DatenschutzContent from "@/components/legal/DatenschutzContent";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Culinse",
  description: "Datenschutzerklärung für culinse.com und die Apps Copper City und Kernfusion gemäß DSGVO.",
  alternates: { canonical: "https://culinse.com/datenschutz" },
};

// Feste Adresse ohne Locale-Präfix – steht so in den Apps und in App Store Connect.
export default function Datenschutz() {
  return <DatenschutzContent />;
}
