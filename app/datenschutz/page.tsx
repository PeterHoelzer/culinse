import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Culinse",
  description: "Datenschutzerklärung von Culinse gemäß DSGVO",
};

export default function Datenschutz() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-400 text-sm mb-8">Stand: Mai 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Verantwortlicher</h2>
          <p className="text-gray-600 leading-relaxed">
            Verantwortlicher im Sinne der DSGVO ist:<br /><br />
            Peter Hölzer<br />
            Eichholz 8<br />
            37284 Waldkappel<br />
            E-Mail:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Welche Daten wir erheben</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Culinse erhebt derzeit keine personenbezogenen Daten von Nutzern. Es gibt keine Nutzerkonten, keine Registrierung und keine Anmeldung. Die Plattform ist vollständig ohne Account nutzbar.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Beim Besuch der Website werden technisch notwendige Daten durch den Hosting-Anbieter Vercel Inc. verarbeitet (siehe Abschnitt 4). Diese Daten umfassen insbesondere die IP-Adresse des anfragenden Geräts sowie Datum und Uhrzeit des Zugriffs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Rezeptdaten (Spoonacular API)</h2>
          <p className="text-gray-600 leading-relaxed">
            Rezeptinhalte, Bilder und Metadaten werden über die Spoonacular API (Spoonacular LLC, USA) bereitgestellt. Bei der Anzeige von Rezepten wird eine serverseitige Anfrage an Spoonacular gestellt. Dabei werden keine personenbezogenen Nutzerdaten an Spoonacular übermittelt. Alle Rezepte verweisen auf ihre Originalquellen. Datenschutzerklärung von Spoonacular:{" "}
            <a
              href="https://spoonacular.com/food-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              spoonacular.com/food-api/terms
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Hosting (Vercel)</h2>
          <p className="text-gray-600 leading-relaxed">
            Diese Website wird gehostet von Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA. Beim Aufruf der Website verarbeitet Vercel technische Zugriffsdaten (sog. Server-Logs) im Rahmen ihrer Infrastruktur. Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb der Website). Weitere Informationen:{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              vercel.com/legal/privacy-policy
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Culinse verwendet derzeit keine Cookies und kein Tracking. Es werden keine Analyse- oder Marketing-Tools eingesetzt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Ihre Rechte</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Da wir keine personenbezogenen Daten erheben, entfallen die meisten Betroffenenrechte praktisch. Sollten Sie dennoch Fragen zum Datenschutz haben, können Sie uns jederzeit kontaktieren:
          </p>
          <p className="text-gray-600 leading-relaxed">
            Sie haben grundsätzlich das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-gray-600 leading-relaxed">
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen — insbesondere wenn neue Funktionen (z. B. Nutzerkonten) eingeführt werden. Die jeweils aktuelle Version ist stets auf dieser Seite abrufbar.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 flex gap-6">
          <Link href="/" className="text-orange-500 hover:underline text-sm">
            ← Zurück zur Startseite
          </Link>
          <Link href="/impressum" className="text-orange-500 hover:underline text-sm">
            Impressum
          </Link>
        </div>
      </main>
    </div>
  );
}
