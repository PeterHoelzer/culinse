import type { Metadata } from "next";
import DatenschutzContent from "@/components/legal/DatenschutzContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Datenschutzerklärung",
    description: "Datenschutzerklärung von Culinse gemäß DSGVO",
    alternates: {
      canonical: `https://culinse.com/${locale}/datenschutz`,
      languages: {
        en: "https://culinse.com/en/datenschutz",
        de: "https://culinse.com/de/datenschutz",
        "x-default": "https://culinse.com/en/datenschutz",
      },
    },
  };
}

export default function Datenschutz() {
  return <DatenschutzContent />;
}
