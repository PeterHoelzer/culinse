import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Impressum",
    description: "Impressum von Culinse gemäß § 5 TMG",
    alternates: {
      canonical: `https://culinse.com/${locale}/impressum`,
      languages: {
        en: "https://culinse.com/en/impressum",
        de: "https://culinse.com/de/impressum",
        "x-default": "https://culinse.com/en/impressum",
      },
    },
  };
}

export default function Impressum() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center w-fit">
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "24px", width: "auto" }} />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Angaben gemäß § 5 TMG</h2>
          <p className="text-gray-600 leading-relaxed">
            Peter Hölzer<br />
            Eichholz 8<br />
            37284 Waldkappel<br />
            Deutschland
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Kontakt</h2>
          <p className="text-gray-600 leading-relaxed">
            E-Mail:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p className="text-gray-600 leading-relaxed">
            Peter Hölzer<br />
            Eichholz 8<br />
            37284 Waldkappel
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Haftungsausschluss</h2>
          <h3 className="font-medium text-gray-700 mb-2">Haftung für Inhalte</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <h3 className="font-medium text-gray-700 mb-2">Haftung für Links</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
          <h3 className="font-medium text-gray-700 mb-2">Urheberrecht</h3>
          <p className="text-gray-600 leading-relaxed">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Rezepttexte unseres Korpus entstehen mit KI-Unterstützung und werden redaktionell geprüft; die zugehörigen Rezeptbilder sind KI-generiert (erstellt mit Higgsfield) und im Bild als solche gekennzeichnet. Inhalte von Community-Mitgliedern bleiben deren geistiges Eigentum.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Apps im App Store</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Peter Hölzer ist außerdem Anbieter folgender Apps im Apple App Store (iPhone, iPad, Mac). Dieses
            Impressum gilt auch für sie; Support und Datenschutzerklärung findest du auf der jeweiligen
            Seite:
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-1 mb-3">
            <li>
              <b className="text-gray-800">Copper City – Ungelöste Mordfälle 1893</b> ·{" "}
              <Link href="/copper-city" className="text-orange-500 hover:underline">Support</Link> ·{" "}
              <Link href="/copper-city/datenschutz" className="text-orange-500 hover:underline">Datenschutz</Link>
            </li>
            <li>
              <b className="text-gray-800">Kernfusion</b> ·{" "}
              <Link href="/kernfusion" className="text-orange-500 hover:underline">Support</Link> ·{" "}
              <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">Datenschutz</Link>
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Käufe in diesen Apps (einmaliger Kauf der Vollversion) werden ausschließlich über Apple
            abgewickelt; Vertragspartner für den Kauf ist Apple Distribution International Ltd., Cork, Irland.
            Preise werden vor dem Kauf in der App und im App Store angezeigt. Rückerstattungen laufen über
            Apple (reportaproblem.apple.com).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Verbraucherstreitbeilegung</h2>
          <p className="text-gray-600 leading-relaxed">
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Affiliate-Links / Werbung</h2>
          <p className="text-gray-600 leading-relaxed">
            Diese Website enthält Affiliate-Links, insbesondere zu Amazon.de (Amazon Associates Partnerprogramm) und Ninja Kitchen. Wenn Sie über einen solchen Link ein Produkt kaufen, erhalten wir eine kleine Provision – für Sie entstehen keine Mehrkosten. Alle Empfehlungen basieren auf redaktioneller Einschätzung und nicht auf Zahlungen der Hersteller. Affiliate-Links sind mit dem Hinweis „Affiliate link" oder „Ad" gekennzeichnet.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100">
          <Link href="/" className="text-orange-500 hover:underline text-sm">
            ← Zurück zur Startseite
          </Link>
        </div>
      </main>
    </div>
  );
}
