import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum – Culinse",
  description: "Impressum von Culinse gemäß § 5 TMG",
};

export default function Impressum() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar minimal */}
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
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
            <a
              href="mailto:peter@hoelzer.xyz"
              className="text-orange-500 hover:underline"
            >
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
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Rezeptdaten und -bilder werden über die Spoonacular API bezogen und unterliegen den jeweiligen Nutzungsbedingungen der Originalquellen. Alle verlinkten Rezepte verweisen auf die Originalseiten der jeweiligen Autoren.
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
