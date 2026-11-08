import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";

export default function ImpressumContent() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-line px-4 py-4">
        <div className="max-w-prose mx-auto">
          <Wordmark />
        </div>
      </nav>

      <main className="max-w-prose mx-auto px-4 py-12">
        <h1 className="text-h1-sm sm:text-h1 mb-8">Impressum</h1>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Angaben gemäß § 5 TMG</h2>
          <p className="text-base text-ink leading-relaxed">
            Peter Hölzer<br />
            Eichholz 8<br />
            37284 Waldkappel<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Kontakt</h2>
          <p className="text-base text-ink leading-relaxed">
            E-Mail:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">
              peter@hoelzer.xyz
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p className="text-base text-ink leading-relaxed">
            Peter Hölzer<br />
            Eichholz 8<br />
            37284 Waldkappel
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Haftungsausschluss</h2>
          <h3 className="text-h3 mt-6 mb-2">Haftung für Inhalte</h3>
          <p className="text-base text-ink leading-relaxed mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <h3 className="text-h3 mt-6 mb-2">Haftung für Links</h3>
          <p className="text-base text-ink leading-relaxed mb-4">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
          <h3 className="text-h3 mt-6 mb-2">Urheberrecht</h3>
          <p className="text-base text-ink leading-relaxed">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Rezepttexte unseres Korpus entstehen mit KI-Unterstützung und werden redaktionell geprüft; die zugehörigen Rezeptbilder sind KI-generiert (erstellt mit Higgsfield) und im Bild als solche gekennzeichnet. Inhalte von Community-Mitgliedern bleiben deren geistiges Eigentum.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Apps im App Store</h2>
          <p className="text-base text-ink leading-relaxed mb-3">
            Peter Hölzer ist außerdem Anbieter folgender Apps im Apple App Store (iPhone, iPad, Mac). Dieses
            Impressum gilt auch für sie; Support und Datenschutzerklärung findest du auf der jeweiligen
            Seite:
          </p>
          <ul className="text-base text-ink leading-relaxed list-disc pl-5 space-y-1 mb-3">
            <li>
              <b>Copper City – Ungelöste Mordfälle 1893</b> ·{" "}
              <Link href="/copper-city" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Support</Link> ·{" "}
              <Link href="/copper-city/datenschutz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Datenschutz</Link>
            </li>
            <li>
              <b>Kernfusion</b> ·{" "}
              <Link href="/kernfusion" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Support</Link> ·{" "}
              <Link href="/kernfusion/datenschutz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Datenschutz</Link>
            </li>
          </ul>
          <p className="text-base text-ink leading-relaxed">
            Käufe in diesen Apps (einmaliger Kauf der Vollversion) werden ausschließlich über Apple
            abgewickelt; Vertragspartner für den Kauf ist Apple Distribution International Ltd., Cork, Irland.
            Preise werden vor dem Kauf in der App und im App Store angezeigt. Rückerstattungen laufen über
            Apple (reportaproblem.apple.com). Support zu Website und Apps:{" "}
            <Link href="/support" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">culinse.com/support</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Verbraucherstreitbeilegung</h2>
          <p className="text-base text-ink leading-relaxed">
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Affiliate-Links / Werbung</h2>
          <p className="text-base text-ink leading-relaxed">
            Diese Website enthält Affiliate-Links, insbesondere zu Amazon.de (Amazon Associates Partnerprogramm) und Ninja Kitchen. Wenn Sie über einen solchen Link ein Produkt kaufen, erhalten wir eine kleine Provision – für Sie entstehen keine Mehrkosten. Alle Empfehlungen basieren auf redaktioneller Einschätzung und nicht auf Zahlungen der Hersteller. Affiliate-Links sind mit dem Hinweis „Affiliate link“ oder „Ad“ gekennzeichnet.
          </p>
        </section>

        <div className="pt-6 border-t border-line">
          <Link href="/" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">
            Zurück zur Startseite
          </Link>
        </div>
      </main>
    </div>
  );
}
