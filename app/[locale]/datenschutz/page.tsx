import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung von Culinse gemäß DSGVO",
};

export default function Datenschutz() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-400 text-sm mb-8">Stand: Mai 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Verantwortlicher</h2>
          <p className="text-gray-600 leading-relaxed">
            Verantwortlicher im Sinne der DSGVO ist:<br /><br />
            Peter Hölzer<br />Eichholz 8<br />37284 Waldkappel<br />
            E-Mail: <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">peter@hoelzer.xyz</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Welche Daten wir erheben</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Culinse kann ohne Konto genutzt werden. Wer sich registriert, erstellt ein Nutzerkonto mit E-Mail-Adresse und Passwort (oder über Google OAuth). Die Authentifizierung erfolgt über Supabase Auth (siehe Abschnitt 3a). Im Rahmen des Kontos werden gespeicherte Rezepte, Sammlungen und Ernährungspräferenzen des Nutzers in einer Supabase-Datenbank gespeichert.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Beim Besuch der Website werden technisch notwendige Daten durch den Hosting-Anbieter Vercel Inc. verarbeitet (siehe Abschnitt 4). Diese Daten umfassen insbesondere die IP-Adresse des anfragenden Geräts sowie Datum und Uhrzeit des Zugriffs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Nutzerkonto &amp; Authentifizierung (Supabase)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Die Nutzer­authentifizierung und Datenspeicherung erfolgt über Supabase (Supabase Inc., San Francisco, CA, USA). Beim Erstellen eines Kontos werden E-Mail-Adresse und – bei Google-Login – grundlegende Profildaten (Name, Profilbild) verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
          <p className="text-gray-600 leading-relaxed">
            Nutzer können ihr Konto jederzeit löschen. Dabei werden alle personenbezogenen Daten (gespeicherte Rezepte, Sammlungen, Präferenzen) unwiderruflich gelöscht.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3a. Rezeptdaten (externe APIs)</h2>
          <p className="text-gray-600 leading-relaxed">
            Rezeptinhalte, Bilder und Metadaten werden über externe APIs bezogen: <strong>Spoonacular</strong>, <strong>MealDB</strong>, <strong>Edamam</strong> und <strong>Tasty</strong>. Anfragen an diese Dienste erfolgen serverseitig. Dabei werden keine personenbezogenen Nutzerdaten übermittelt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Hosting (Vercel)</h2>

          <p className="text-gray-600 leading-relaxed">
            Diese Website wird gehostet von Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA. Beim Aufruf der Website verarbeitet Vercel technische Zugriffsdaten (sog. Server-Logs) auf Basis von Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Cookies &amp; Session</h2>
          <p className="text-gray-600 leading-relaxed">
            Culinse verwendet keine Analyse- oder Marketing-Cookies. Für eingeloggte Nutzer setzt Supabase ein Session-Cookie (technisch notwendig, Art. 6 Abs. 1 lit. f DSGVO). Es werden keine Tracking- oder Werbecookies eingesetzt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Ihre Rechte</h2>
          <p className="text-gray-600 leading-relaxed">
            Sie haben grundsätzlich das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Amazon Associates / Affiliate-Links</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Diese Website nimmt am Amazon Services LLC Associates Program und am Ninja Kitchen Affiliate-Programm teil. Bei Klick auf Amazon-Links setzt Amazon.com, Inc. einen Cookie mit einer Laufzeit von 24 Stunden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 flex gap-6">
          <Link href="/" className="text-orange-500 hover:underline text-sm">← Zurück zur Startseite</Link>
          <Link href="/impressum" className="text-orange-500 hover:underline text-sm">Impressum</Link>
        </div>
      </main>
    </div>
  );
}
