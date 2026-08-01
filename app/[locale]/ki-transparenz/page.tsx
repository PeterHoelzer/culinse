import type { Metadata } from "next";
import Link from "next/link";

// KI-Transparenz gemaess EU-KI-Verordnung (AI Act, Art. 50) — bewusst
// ausfuehrlicher als gesetzlich noetig: Vertrauen ist ein Feature.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const de = locale === "de";
  return {
    title: de ? "KI-Transparenz" : "AI Transparency",
    description: de
      ? "Wo Culinse Künstliche Intelligenz einsetzt — und wo nicht. Transparenz gemäß EU-KI-Verordnung (AI Act)."
      : "Where Culinse uses artificial intelligence — and where it doesn't. Transparency under the EU AI Act.",
    alternates: {
      canonical: `https://culinse.com/${locale}/ki-transparenz`,
      languages: {
        en: "https://culinse.com/en/ki-transparenz",
        de: "https://culinse.com/de/ki-transparenz",
        "x-default": "https://culinse.com/en/ki-transparenz",
      },
    },
  };
}

export default async function KiTransparenz({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const de = locale === "de";

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/${locale}`} className="flex items-center w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "24px", width: "auto" }} />
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {de ? "KI-Transparenz" : "AI Transparency"}
        </h1>
        <p className="text-gray-600 leading-relaxed mb-10">
          {de
            ? "Seit dem 2. August 2026 gelten die Transparenzpflichten der EU-KI-Verordnung (AI Act, Art. 50). Culinse geht bewusst einen Schritt weiter, als es das Gesetz verlangt: Auf dieser Seite steht offen, wo bei uns Künstliche Intelligenz im Einsatz ist — und wo nicht."
            : "Since August 2, 2026, the transparency obligations of the EU AI Act (Art. 50) apply. Culinse deliberately goes one step further than the law requires: this page openly explains where we use artificial intelligence — and where we don't."}
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Rezepte aus unserem Korpus" : "Recipes from our corpus"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Ein Teil der Rezepte auf Culinse entsteht mit KI-Unterstützung (Recherche und Textentwurf). Jedes dieser Rezepte wird vor der Veröffentlichung redaktionell geprüft — einschließlich Zutaten, Mengen und Zubereitungsschritten — und liegt in unserer redaktionellen Verantwortung. Du erkennst diese Rezepte am Hinweis „Mit KI-Unterstützung erstellt und redaktionell geprüft“ direkt auf der Rezeptseite. Rezepte von Community-Mitgliedern und Rezepte externer Quellen (z. B. Spoonacular, Tasty) sind davon nicht betroffen."
              : "Some recipes on Culinse are created with AI assistance (research and text drafting). Every one of these recipes is editorially reviewed before publication — including ingredients, quantities and preparation steps — and is published under our editorial responsibility. You can recognise them by the note “Created with AI assistance and editorially reviewed” on the recipe page. Recipes from community members and from external sources (e.g. Spoonacular, Tasty) are not affected."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Blog & Übersetzungen" : "Blog & translations"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Blog-Artikel entstehen teils mit KI-Unterstützung und werden vor der Veröffentlichung redaktionell geprüft und verantwortet. Einzelne Inhalte — etwa Videotitel oder Rezepttitel externer Quellen — werden maschinell übersetzt; Übersetzungsfehler können vorkommen."
              : "Blog articles are partly created with AI assistance and are editorially reviewed and approved before publication. Some content — such as video titles or recipe titles from external sources — is machine-translated; translation errors may occur."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Automatische Schätzungen" : "Automated estimates"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Geschätzte Einkaufskosten (Discounter-Preisniveau) und Nährwertangaben sind algorithmische Schätzungen auf Basis der Zutatenlisten. Sie sind eine hilfreiche Orientierung, aber keine zugesicherten Werte — tatsächliche Preise und Nährwerte variieren."
              : "Estimated grocery costs (discount-store price level) and nutrition values are algorithmic estimates based on the ingredient lists. They are a helpful guide, not guaranteed values — actual prices and nutrition vary."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Bilder" : "Images"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Rezeptfotos stammen derzeit aus echten Quellen: eigene Aufnahmen, Uploads von Community-Mitgliedern und Bilddatenbanken der Rezeptquellen. Sollten wir künftig KI-generierte Bilder einsetzen, kennzeichnen wir sie sichtbar auf der Seite und — wo technisch möglich — maschinenlesbar in den Bilddaten (z. B. IPTC digitalSourceType)."
              : "Recipe photos currently come from real sources: our own shots, uploads by community members and the image libraries of our recipe sources. Should we use AI-generated images in the future, we will label them visibly on the page and — where technically possible — machine-readably in the image metadata (e.g. IPTC digitalSourceType)."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Was wir nicht tun" : "What we don't do"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Auf Culinse gibt es keinen KI-Chatbot — sollte einmal einer dazukommen, wird er sich klar als KI zu erkennen geben. Wir treffen keine automatisierten Entscheidungen mit rechtlicher Wirkung über Nutzerkonten, betreiben kein Profiling zu Werbezwecken, keine Emotionserkennung und keine biometrische Kategorisierung."
              : "There is no AI chatbot on Culinse — if we ever add one, it will clearly identify itself as AI. We make no automated decisions with legal effect about user accounts, and we do no advertising profiling, no emotion recognition and no biometric categorisation."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Verantwortung & Kontakt" : "Responsibility & contact"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de ? (
              <>
                Verantwortlich für alle Inhalte ist der Betreiber von Culinse (siehe{" "}
                <Link href={`/${locale}/impressum`} className="underline hover:text-orange-500">
                  Impressum
                </Link>
                ). Fragen zum KI-Einsatz beantworten wir gern per E-Mail an{" "}
                <a href="mailto:peter@hoelzer.xyz" className="underline hover:text-orange-500">
                  peter@hoelzer.xyz
                </a>
                . Wie wir mit personenbezogenen Daten umgehen, steht in der{" "}
                <Link href={`/${locale}/datenschutz`} className="underline hover:text-orange-500">
                  Datenschutzerklärung
                </Link>
                .
              </>
            ) : (
              <>
                The operator of Culinse is responsible for all content (see{" "}
                <Link href={`/${locale}/impressum`} className="underline hover:text-orange-500">
                  Legal Notice
                </Link>
                ). Questions about our use of AI? Email{" "}
                <a href="mailto:peter@hoelzer.xyz" className="underline hover:text-orange-500">
                  peter@hoelzer.xyz
                </a>
                . How we handle personal data is described in our{" "}
                <Link href={`/${locale}/datenschutz`} className="underline hover:text-orange-500">
                  Privacy Policy
                </Link>
                .
              </>
            )}
          </p>
        </section>

        <p className="text-xs text-gray-400">
          {de ? "Stand: August 2026" : "Last updated: August 2026"}
        </p>
      </main>
    </div>
  );
}
