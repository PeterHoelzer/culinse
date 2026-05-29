import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RecipeEditorClient from "../../RecipeEditorClient";

export const metadata: Metadata = { title: "Edit Recipe – Culinse" };

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <RecipeEditorClient mode="edit" recipeId={id} />
    </>
  );
}
