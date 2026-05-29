import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import MyRecipesClient from "./MyRecipesClient";

export const metadata: Metadata = {
  title: "My Recipes – Culinse",
  description: "Create, manage and share your own recipes on Culinse.",
};

export default function MyRecipesPage() {
  return (
    <>
      <Navbar />
      <MyRecipesClient />
    </>
  );
}
