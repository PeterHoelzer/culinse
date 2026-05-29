import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RecipeEditorClient from "../RecipeEditorClient";

export const metadata: Metadata = {
  title: "Create Recipe – Culinse",
};

export default function CreateRecipePage() {
  return (
    <>
      <Navbar />
      <RecipeEditorClient mode="create" />
    </>
  );
}
