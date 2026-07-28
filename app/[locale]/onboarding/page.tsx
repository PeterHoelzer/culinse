import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "de" ? "Los geht's" : "Get started",
    robots: { index: false, follow: false },
  };
}

export default function OnboardingPage() {
  return <OnboardingClient />;
}
