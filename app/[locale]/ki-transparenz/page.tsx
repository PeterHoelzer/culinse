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
              ? "Die Rezepte unseres Korpus werden mit Künstlicher Intelligenz erstellt (Recherche, Text und Struktur) und vor der Veröffentlichung redaktionell geprüft — einschließlich Zutaten, Mengen und Zubereitungsschritten. Sie erscheinen in unserer redaktionellen Verantwortung und tragen den Hinweis „Rezept und Bild mit KI erstellt, redaktionell geprüft“ direkt auf der Rezeptseite. Von Community-Mitgliedern selbst verfasste Rezepte sind davon ausgenommen und als Community-Inhalte gekennzeichnet."
              : "The recipes in our corpus are created with artificial intelligence (research, text and structure) and editorially reviewed before publication — including ingredients, quantities and preparation steps. They are published under our editorial responsibility and carry the note “Recipe and image AI-created, editorially reviewed” on the recipe page. Recipes written by community members themselves are exempt and labelled as community content."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Blog & Übersetzungen" : "Blog & translations"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Blog-Artikel entstehen mit KI-Unterstützung und werden vor der Veröffentlichung redaktionell geprüft und verantwortet. Unsere Inhalte werden außerdem KI-gestützt in mehrere Sprachen übersetzt; Übersetzungsfehler können vorkommen."
              : "Blog articles are created with AI assistance and are editorially reviewed and approved before publication. Our content is also AI-translated into several languages; translation errors may occur."}
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
              ? "Alle Rezeptbilder unseres Korpus sind KI-generiert. Wir erstellen sie mit Higgsfield und kennzeichnen sie doppelt: sichtbar im Bild selbst („KI-generiert · AI-generated“) und mit dem KI-Hinweis auf der Rezeptseite. Die Bilder sind Serviervorschläge — das gekochte Gericht kann im Detail anders aussehen. Eigene Fotos, die Community-Mitglieder zu ihren Rezepten hochladen, sind von der KI-Kennzeichnung ausgenommen."
              : "All recipe images in our corpus are AI-generated. We create them with Higgsfield and label them twice: visibly inside the image itself (“KI-generiert · AI-generated”) and with the AI note on the recipe page. The images are serving suggestions — the cooked dish may look different in detail. Photos that community members upload for their own recipes are exempt from the AI label."}
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
          {de ? "Stand: September 2026" : "Last updated: September 2026"}
        </p>
      </main>
    </div>
  );
}
