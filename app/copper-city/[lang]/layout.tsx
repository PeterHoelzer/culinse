import { getCopperCityLocale } from "@/lib/copper-city";

// Setzt <html lang> passend zur Sprache; das übergeordnete copper-city/layout.tsx
// liefert bereits html/body, deshalb hier nur ein Wrapper mit lang-Attribut.
export default async function CopperCityLangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = getCopperCityLocale(lang);
  return <div lang={locale?.htmlLang ?? "en"}>{children}</div>;
}
