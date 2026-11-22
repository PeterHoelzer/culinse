import type { Metadata } from "next";
import { searchLanguages } from "@/lib/searchLocales";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const alternates = {
    canonical: `https://culinse.com/${locale}/pro`,
    languages: searchLanguages((l) => `https://culinse.com/${l}/pro`),
  };
  if (locale === "de") {
    return {
      title: "Culinse Pro – Wochenplaner & smarte Einkaufsliste",
      description:
        "Plane deine Woche, erhalte eine automatische Einkaufsliste und organisiere deine Lieblingsrezepte in unbegrenzten Sammlungen. Jederzeit kündbar.",
      alternates,
      openGraph: {
        title: "Culinse Pro – Wochenplaner & smarte Einkaufsliste",
        description:
          "Wochenplaner, automatische Einkaufsliste und unbegrenzte Rezept-Sammlungen.",
        url: "https://culinse.com/de/pro",
      },
    };
  }
  return {
    title: "Culinse Pro – Meal Planner & Smart Shopping List",
    description:
      "Plan your week, get an automatic shopping list, and organize every recipe you love in unlimited collections. Cancel anytime.",
    alternates,
    openGraph: {
      title: "Culinse Pro – Meal Planner & Smart Shopping List",
      description:
        "Weekly meal planner, automatic shopping list, and unlimited recipe collections.",
      url: "https://culinse.com/en/pro",
    },
  };
}

export { default } from "../../pro/page";
