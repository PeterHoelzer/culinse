import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import MyRecipesClient from "./MyRecipesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "myRecipes" });
  return { title: t("title"), description: t("metaDescription") };
}

export default function MyRecipesPage() {
  return (
    <>
      <Navbar />
      <MyRecipesClient />
    </>
  );
}
