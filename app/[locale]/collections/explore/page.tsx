import type { Metadata } from "next";
import { searchLanguages } from "@/lib/searchLocales";
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
    languages: searchLanguages((l) => `https://culinse.com/${l}/collections/explore`),
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
