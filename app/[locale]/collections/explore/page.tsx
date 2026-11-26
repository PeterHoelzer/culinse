import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "exploreCollections" });
  return { title: t("title"), description: t("metaDescription"), alternates };
}

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <ExploreClient />
    </>
  );
}
