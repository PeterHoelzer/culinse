import type { Metadata } from "next";
import ImpressumContent from "@/components/legal/ImpressumContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Impressum",
    description: "Impressum von Culinse gemäß § 5 TMG",
    alternates: {
      canonical: `https://culinse.com/${locale}/impressum`,
      languages: {
        en: "https://culinse.com/en/impressum",
        de: "https://culinse.com/de/impressum",
        "x-default": "https://culinse.com/en/impressum",
      },
    },
  };
}

export default function Impressum() {
  return <ImpressumContent />;
}
