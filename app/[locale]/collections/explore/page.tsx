import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ExploreClient from "./ExploreClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const alternates = {
    canonical: `https://culinse.com/${locale}/collections/explore`,
    languages: {
      en: "https://culinse.com/en/collections/explore",
      de: "https://culinse.com/de/collections/explore",
      "x-default": "https://culinse.com/en/collections/explore",
    },
  };
  if (locale === "de") {
    return {
      title: "Sammlungen entdecken",
      description: "Entdecke öffentliche Rezept-Sammlungen der Culinse-Community.",
      alternates,
    };
  }
  return {
    title: "Explore Collections",
    description: "Discover public recipe collections shared by the Culinse community.",
    alternates,
  };
}

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <ExploreClient />
    </>
  );
}
