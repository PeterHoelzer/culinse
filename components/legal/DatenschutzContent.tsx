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
            Culinse kann ohne Konto genutzt werden. Wer sich registriert, erstellt ein Nutzerkonto mit E-Mail-Adresse und Passwort (oder über die Anmeldung mit Google oder Apple). Anmeldung und Konto laufen über einen Anmeldedienst, den wir selbst betreiben (siehe Abschnitt 3). Im Rahmen des Kontos werden gespeicherte Rezepte, Sammlungen und Ernährungspräferenzen des Nutzers in unserer Datenbank auf einem Server in Deutschland gespeichert.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Beim Besuch der Website werden technisch notwendige Daten durch unseren Server-Anbieter netcup und durch Cloudflare verarbeitet (siehe Abschnitt 4). Diese Daten umfassen insbesondere die IP-Adresse des anfragenden Geräts sowie Datum und Uhrzeit des Zugriffs.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">3. Nutzerkonto &amp; Authentifizierung</h2>
          <p className="text-base text-ink leading-relaxed mb-4">
            Anmeldung, Nutzerkonten und alle Kontodaten liegen auf unserem eigenen Server in Deutschland (siehe Abschnitt 4). Wir betreiben dort die frei verfügbare Software Supabase selbst; das Unternehmen Supabase Inc. erhält dabei keine Daten. Beim Erstellen eines Kontos werden E-Mail-Adresse und – bei Google-Login – grundlegende Profildaten (Name, Profilbild) verarbeitet; bei der Anmeldung mit Apple die E-Mail-Adresse und, soweit Apple ihn übermittelt, der Name. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Wer sich mit Google anmeldet, wird dafür zu Google weitergeleitet (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland); Google erfährt dabei, dass die Anmeldung bei Culinse erfolgt.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Wer sich mit Apple anmeldet, wird dafür zu Apple weitergeleitet (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irland); Apple erfährt dabei, dass die Anmeldung bei Culinse erfolgt. Wer bei Apple „E-Mail-Adresse verbergen“ wählt, gibt uns statt der eigenen Adresse eine Weiterleitungsadresse von Apple; E-Mails zum Konto laufen dann über Apple an das eigene Postfach.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            E-Mails zum Konto (Bestätigung der E-Mail-Adresse, Zurücksetzen des Passworts) versenden wir über den Dienst Resend (Resend, Inc., San Francisco, CA, USA). Dabei werden die E-Mail-Adresse und der Inhalt der Nachricht an Resend übermittelt; eine Verarbeitung in den USA ist möglich. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Nutzer können ihr Konto jederzeit löschen. Dabei werden alle personenbezogenen Daten (gespeicherte Rezepte, Sammlungen, Präferenzen) unwiderruflich gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">3a. Rezeptinhalte und KI-Bilder</h2>
          <p className="text-base text-ink leading-relaxed">
            Rezeptinhalte und Rezeptbilder unseres Korpus erstellen wir selbst — KI-gestützt und redaktionell geprüft (Bilder: KI-generiert mit Higgsfield). Sie werden in unserer Datenbank und unserem Dateispeicher auf dem eigenen Server gespeichert (siehe Abschnitt 4). Externe Rezept-APIs werden nicht mehr eingebunden. Bei der KI-Erstellung von Rezepten und Bildern werden keine personenbezogenen Nutzerdaten an KI-Anbieter übermittelt.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">4. Hosting (netcup) und Auslieferung (Cloudflare)</h2>

          <p className="text-base text-ink leading-relaxed mb-4">
            Website, Datenbank und Dateispeicher laufen auf einem Server, den wir bei der netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe, gemietet haben. Der Server steht in einem Rechenzentrum in Nürnberg. Beim Aufruf der Website fallen dort technische Zugriffsdaten (sog. Server-Logs) an, insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs und die aufgerufene Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer und stabiler Betrieb der Website). Mit netcup besteht eine Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Die Seiten von culinse.com werden über das Netz von Cloudflare ausgeliefert (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA). Cloudflare nimmt die Aufrufe entgegen, wehrt Angriffe ab, hält öffentliche Seiten ohne persönliche Inhalte kurzzeitig zwischengespeichert vor und leitet alle anderen Anfragen an unseren Server weiter. Dabei verarbeitet Cloudflare technische Zugriffsdaten, insbesondere die IP-Adresse; eine Verarbeitung in den USA ist möglich. Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert; ergänzend gelten die Standardvertragsklauseln der EU-Kommission. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (schnelle Auslieferung und Schutz der Website). Bilder, Anmeldung und Kontodaten laufen nicht über Cloudflare, sondern direkt über unseren Server.
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">5. Cookies &amp; Session</h2>
          <p className="text-base text-ink leading-relaxed">
            Culinse selbst setzt nur technisch notwendige Cookies: Für eingeloggte Nutzer setzt unser Anmeldedienst ein Session-Cookie, und die Website merkt sich die gewählte Sprache in einem Cookie (Art. 6 Abs. 1 lit. f DSGVO, § 25 Abs. 2 Nr. 2 TDDDG). Cloudflare kann zum Schutz vor Angriffen im Einzelfall ein technisch notwendiges Cookie setzen. Die Reichweitenmessung kommt ohne Cookies aus (siehe Abschnitt 5b). Cookies und ähnliche Kennungen zu Werbezwecken werden nur gesetzt, wenn Sie zuvor eingewilligt haben (siehe Abschnitt 5a).
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">5b. Reichweitenmessung ohne Cookies</h2>
          <p className="text-base text-ink leading-relaxed mb-4">
            Um zu sehen, wie viele Menschen Culinse besuchen und welche Seiten gelesen werden, zählen wir die Seitenaufrufe selbst, auf unserem eigenen Server. Dafür wird kein Cookie gesetzt und nichts auf Ihrem Gerät gespeichert oder ausgelesen; es ist kein fremder Dienst beteiligt.
          </p>
          <p className="text-base text-ink leading-relaxed mb-4">
            Je Seitenaufruf speichern wir: die aufgerufene Seite, den Zeitpunkt, das Land, die Art des Geräts, Browser und Betriebssystem in grober Form, ob Sie angemeldet sind (nicht, wer Sie sind) und, falls Sie über einen Link zu uns kommen, den Namen der verweisenden Website. Ihre IP-Adresse speichern wir nicht. Um mehrere Aufrufe desselben Besuchers an einem Tag zusammenzuzählen, bilden wir aus IP-Adresse, Browserkennung und einem täglich neu gewürfelten Zufallswert eine Prüfsumme. Der Zufallswert wird am Folgetag gelöscht; danach lässt sich die Prüfsumme niemandem mehr zuordnen, und Besuche an verschiedenen Tagen lassen sich nicht verbinden. Ein Profil über Sie entsteht nicht.
          </p>
          <p className="text-base text-ink leading-relaxed">
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO: unser berechtigtes Interesse, die Nutzung der Website in Summen auszuwerten und das Angebot zu verbessern. Sie können dem widersprechen; schreiben Sie uns dazu an die Adresse aus Abschnitt 1.
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

        <div className="pt-6 border-t border-line flex gap-6">
          <Link href="/" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Zurück zur Startseite</Link>
          <Link href="/impressum" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Impressum</Link>
          <Link href="/support" className="text-brand underline underline-offset-[3px] hover:text-brand-hover text-sm">Support</Link>
        </div>
      </main>
    </div>
  );
}
