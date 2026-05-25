import type { Metadata } from "next";
import LoginClient from "./LoginClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "de") {
    return {
      title: "Anmelden",
      description: "Melde dich bei Culinse an, um Rezepte zu speichern und deinen persönlichen Feed zu erhalten.",
    };
  }
  return {
    title: "Log in",
    description: "Log in to Culinse to save recipes and get your personalized feed.",
  };
}

export default function LoginPage() {
  return <LoginClient />;
}
