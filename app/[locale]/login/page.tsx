import type { Metadata } from "next";
import LoginClient from "./LoginClient";

interface Props {
  params: Promise<{ locale: string }>;
}

// Die Anmeldeseite gehört in keine Suchmaschine. robots.txt sperrt sie schon;
// "noindex" gilt für Crawler, die trotzdem kommen (26.11.2026).
const robots = { index: false, follow: true };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "de") {
    return {
      robots,
      title: "Anmelden",
      description: "Melde dich bei Culinse an, um Rezepte zu speichern und deinen persönlichen Feed zu erhalten.",
    };
  }
  return {
    robots,
    title: "Log in",
    description: "Log in to Culinse to save recipes and get your personalized feed.",
  };
}

export default function LoginPage() {
  return <LoginClient />;
}
