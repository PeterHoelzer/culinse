import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";

export default function DatenschutzContent() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-line px-4 py-4">
        <div className="max-w-prose mx-auto">
          <Wordmark plain />
        </div>
      </nav>

      <main className="max-w-prose mx-auto px-4 py-12">
        <h1 className="text-h1-sm sm:text-h1 mb-2">Datenschutzerklärung</h1>
        <p className="text-ink-3 text-sm mb-8">Stand: November 2026</p>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">1. Verantwortlicher</h2>
          <p className="text-base text-ink leading-relaxed">
            Verantwortlicher im Sinne der DSGVO ist:<br /><br />
            Peter Hölzer<br />Eichholz 8<br />37284 Waldkappel<br />
            E-Mail: <a href="mailto:peter@hoelzer.xyz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">peter@hoelzer.xyz</a>
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">2. Welche Daten wir erheben</h2>
          <p className="text-base text-ink leading-relaxed mb-4">
            Culinse kann ohne Konto genutzt werden. Wer sich registriert, erstellt ein Nutzerkonto mit E-Mail-Adresse und Passwort (oder über Google OAuth). Die Authentifizierung erfolgt über Supabase Auth (siehe Abschnitt 3a). Im Rahmen des Kontos werden gespeicherte Rezepte, Sammlungen und Ernährungspräferenzen des Nutzers in einer Supabase-Datenbank gespeichert.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Beim Besuch der Website werden technisch notwendige Daten durch den Hosting-Anbieter Vercel Inc. verarbeitet (siehe Abschnitt 4). Diese Daten umfassen insbesondere die IP-Adresse des anfragenden Geräts sowie Datum und Uhrzeit des Zugriffs.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">3. Nutzerkonto &amp; Authentifizierung (Supabase)</h2>
          <p className="text-base text-ink leading-relaxed mb-4">
            Die Nutzer­authentifizierung und Datenspeicherung erfolgt über Supabase (Supabase Inc., San Francisco, CA, USA). Beim Erstellen eines Kontos werden E-Mail-Adresse und – bei Google-Login – grundlegende Profildaten (Name, Profilbild) verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
          <p className="text-base text-ink leading-relaxed">
            Nutzer können ihr Konto jederzeit löschen. Dabei werden alle personenbezogenen Daten (gespeicherte Rezepte, Sammlungen, Präferenzen) unwiderruflich gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">3a. Rezeptinhalte und KI-Bilder</h2>
          <p className="text-base text-ink leading-relaxed">
            Rezeptinhalte und Rezeptbilder unseres Korpus erstellen wir selbst — KI-gestützt und redaktionell geprüft (Bilder: KI-generiert mit Higgsfield). Sie werden in unserer Supabase-Datenbank und im Supabase-Storage gespeichert (siehe Abschnitt 3). Externe Rezept-APIs werden nicht mehr eingebunden. Bei der KI-Erstellung von Rezepten und Bildern werden keine personenbezogenen Nutzerdaten an KI-Anbieter übermittelt.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">4. Hosting (Vercel)</h2>

          <p className="text-base text-ink leading-relaxed">
            Diese Website wird gehostet von Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA. Beim Aufruf der Website verarbeitet Vercel technische Zugriffsdaten (sog. Server-Logs) auf Basis von Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">5. Cookies &amp; Session</h2>
          <p className="text-base text-ink leading-relaxed">
            Culinse selbst setzt nur technisch notwendige Cookies: Für eingeloggte Nutzer setzt Supabase ein Session-Cookie (Art. 6 Abs. 1 lit. f DSGVO, § 25 Abs. 2 Nr. 2 TDDDG). Zur Reichweitenmessung nutzen wir Vercel Web Analytics; der Dienst arbeitet ohne Cookies und erkennt Besucher nicht über mehrere Tage oder Websites hinweg wieder. Cookies und ähnliche Kennungen zu Werbezwecken werden nur gesetzt, wenn Sie zuvor eingewilligt haben (siehe Abschnitt 5a).
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">5a. Werbung (Google AdSense)</h2>
          <p className="text-base text-ink leading-relaxed mb-4">
            Culinse finanziert sich unter anderem durch Werbung. Dafür können auf dieser Website Anzeigen über Google AdSense eingeblendet werden, einen Dienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Solange keine Anzeigen geschaltet sind, erscheint kein Einwilligungsfenster, und es werden keine Werbe-Cookies gesetzt.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Google und seine Werbepartner verwenden Cookies und ähnliche Kennungen, um Anzeigen auszuliefern, ihre Häufigkeit zu begrenzen, Missbrauch zu erkennen und die Wirkung der Anzeigen zu messen. Mit Ihrer Einwilligung werden Anzeigen außerdem anhand Ihrer früheren Besuche auf dieser und anderen Websites personalisiert. Verarbeitet werden dabei insbesondere die IP-Adresse, Angaben zu Gerät und Browser, Cookie-Kennungen sowie Angaben zu den aufgerufenen Seiten.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Anzeigen von Google werden erst geladen, nachdem Sie in einem Einwilligungsfenster darüber entschieden haben. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Sie können Ihre Auswahl jederzeit mit Wirkung für die Zukunft ändern oder widerrufen; das Einwilligungsfenster lässt sich dazu über einen Link am Seitenende erneut öffnen.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Google kann Daten auch in den USA verarbeiten. Die Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert; ergänzend gelten die Standardvertragsklauseln der EU-Kommission. Wie Google Daten aus der Werbung verwendet, steht unter{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">policies.google.com/technologies/partner-sites</a>
            . Personalisierte Werbung können Sie außerdem unter{" "}
            <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">myadcenter.google.com</a>{" "}
            und{" "}
            <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">youronlinechoices.eu</a>{" "}
            abschalten.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Mitgliedern mit Culinse Pro werden keine Anzeigen eingeblendet.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">6. Ihre Rechte</h2>
          <p className="text-base text-ink leading-relaxed">
            Sie haben grundsätzlich das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO).
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">7. Apps im App Store (Copper City, Kernfusion)</h2>
          <p className="text-base text-ink leading-relaxed mb-3">
            Peter Hölzer ist außerdem Anbieter der Apps <b>Copper City – Ungelöste Mordfälle 1893</b> (iPhone, iPad, Mac) und{" "}
            <b>Kernfusion</b> (iPad, Mac) im Apple App Store. Die Apps erheben, speichern und übermitteln keine personenbezogenen Daten. Sie enthalten keine Konten, keine Anmeldung, keine Werbung und keine Analyse- oder Absturzberichte und fragen keine Berechtigungen an. Spielstände liegen ausschließlich lokal auf dem Gerät; ein Culinse-Nutzerkonto wird in den Apps nicht verwendet.
          </p>
          <p className="text-base text-ink leading-relaxed mb-3">
            <b>Copper City</b> kann zwei Stunden kostenlos gespielt werden; die gespielte Zeit zählt die App lokal auf dem Gerät mit, dieser Wert verlässt das Gerät nicht. Danach lässt sich die Vollversion durch einen einmaligen In-App-Kauf freischalten. Den Kauf wickelt Apple (Apple Distribution International Ltd., Cork, Irland) über den App Store ab und verarbeitet dabei Zahlungs- und Kontodaten nach seinen eigenen Datenschutzbestimmungen; die App erhält von Apple nur die Bestätigung, dass der Kauf vorliegt (Art. 6 Abs. 1 lit. b DSGVO). Die einzige Internetverbindung der App ist die zum App Store beim Kauf oder beim Wiederherstellen des Kaufs.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Die vollständigen Datenschutzerklärungen der Apps (deutsch und englisch):{" "}
            <Link href="/copper-city/datenschutz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Copper City</Link>{" "}
            ·{" "}
            <Link href="/kernfusion/datenschutz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">Kernfusion</Link>
            . Support zu den Apps: <Link href="/support" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">culinse.com/support</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">Amazon Associates / Affiliate-Links</h2>
          <p className="text-base text-ink leading-relaxed mb-3">
            Diese Website nimmt am Amazon Services LLC Associates Program und am Ninja Kitchen Affiliate-Programm teil. Bei Klick auf Amazon-Links setzt Amazon.com, Inc. einen Cookie mit einer Laufzeit von 24 Stunden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <div className="pt-6 border-t border-line flex gap-6">
          <Link href="/" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Zurück zur Startseite</Link>
          <Link href="/impressum" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Impressum</Link>
          <Link href="/support" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Support</Link>
        </div>
      </main>
    </div>
  );
}
