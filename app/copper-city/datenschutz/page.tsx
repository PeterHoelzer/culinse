import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copper City – Datenschutz · Privacy Policy",
  description:
    "Datenschutzerklärung für das Detektivspiel Copper City (iPhone, iPad, Mac) – deutsch und englisch. Privacy policy for the detective game Copper City.",
  alternates: { canonical: "https://culinse.com/copper-city/datenschutz" },
};

export default function CopperCityDatenschutz() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/copper-city" className="font-semibold text-gray-900">
            🔎 Copper City
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a href="#english" className="text-gray-500 hover:underline">
              English
            </a>
            <Link href="/copper-city" className="text-orange-500 hover:underline">
              Support
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung – Copper City</h1>
        <p className="text-gray-400 text-sm mb-8">
          Stand: November 2026 ·{" "}
          <a href="#english" className="underline">
            English version below
          </a>
        </p>

        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">
            Copper City („Ungelöste Mordfälle 1893“) ist ein Detektivspiel für iPhone, iPad und Mac. Es läuft
            vollständig auf dem Gerät. Kurz gesagt:{" "}
            <b className="text-gray-800">Die App erhebt keine Daten.</b> Einzige Ausnahme ist der
            einmalige Kauf der Vollversion, den Apple abwickelt (Abschnitt 6).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Verantwortlicher</h2>
          <p className="text-gray-600 leading-relaxed">
            Peter Hölzer
            <br />
            Eichholz 8
            <br />
            37284 Waldkappel
            <br />
            E-Mail:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Keine Datenerhebung</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App erhebt, speichert oder übermittelt keine personenbezogenen Daten. Sie enthält keine
            Konten, keine Anmeldung, keine Werbung und keine Analyse- oder Absturzberichte.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Keine Verbindung zu Servern</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App baut keine Verbindung zu eigenen Servern auf. Alle Fälle, Bilder, Filme und Texte liegen in
            der App selbst; jeder Fall wird auf dem Gerät erzeugt. Die einzige Verbindung ins Internet ist die
            zu Apples App Store beim Kauf oder Wiederherstellen der Vollversion (Abschnitt 6).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Spielstände auf dem Gerät</h2>
          <p className="text-gray-600 leading-relaxed">
            Deine Fälle, dein Dienstbuch und ein frei wählbarer Profilname werden ausschließlich lokal auf
            deinem Gerät gespeichert, im Datenbereich der App. Über „Sichern“ in den Einstellungen kannst du
            deinen Spielstand als Datei an einen Ort deiner Wahl legen; die App legt außerdem beim Wechsel in
            den Hintergrund bis zu drei Sicherungen im eigenen Datenbereich an. Diese Dateien verlassen das
            Gerät nur, wenn du sie selbst weitergibst. Beim Löschen der App werden die Spielstände mit
            entfernt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Keine Berechtigungen</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App fragt keine Berechtigungen an – kein Standort, keine Kamera, kein Mikrofon, keine
            Kontakte, keine Mitteilungen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. In-App-Kauf und App Store</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Die ersten zwei Stunden Spielzeit sind kostenlos. Damit die App weiß, wie viel davon verbraucht
            ist, zählt sie die gespielte Zeit lokal auf dem Gerät mit; dieser Wert verlässt das Gerät nicht.
            Danach lässt sich die Vollversion durch einen einmaligen In-App-Kauf freischalten.
          </p>
          <p className="text-gray-600 leading-relaxed mb-3">
            Den Kauf wickelt Apple (Apple Distribution International Ltd., Hollyhill Industrial Estate, Cork,
            Irland) über den App Store ab. Apple verarbeitet dabei deine Zahlungs- und Kontodaten nach seinen
            eigenen Datenschutzbestimmungen; die App erhält von Apple lediglich die Bestätigung, dass der Kauf
            vorliegt – keine Zahlungsdaten, keinen Namen, keine Apple-ID. Diese Bestätigung wird auf dem Gerät
            gespeichert und bei „Käufe wiederherstellen“ erneut bei Apple abgefragt. Rechtsgrundlage ist die
            Erfüllung des Vertrags mit dir (Art. 6 Abs. 1 lit. b DSGVO). Mehr dazu:{" "}
            <a
              href="https://www.apple.com/legal/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              apple.com/legal/privacy
            </a>
          </p>
          <p className="text-gray-600 leading-relaxed">
            Auch beim Laden der App über den App Store verarbeitet Apple Daten nach seinen eigenen
            Bestimmungen. Darauf haben wir keinen Einfluss; Copper City selbst erhält davon nichts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Kinder</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App ist nicht für Kinder unter 13 Jahren gestaltet und erhebt auch von ihnen keine Daten.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Änderungen</h2>
          <p className="text-gray-600 leading-relaxed">
            Sollte sich daran etwas ändern, wird diese Erklärung aktualisiert und die Änderung in der App
            genannt.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Kontakt</h2>
          <p className="text-gray-600 leading-relaxed">
            Fragen zum Datenschutz:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>{" "}
            ·{" "}
            <Link href="/impressum" className="text-orange-500 hover:underline">
              Impressum
            </Link>
          </p>
        </section>

        {/* ---------- English ---------- */}
        <hr className="border-gray-200 mb-10" />
        <div id="english" lang="en">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy – Copper City</h2>
          <p className="text-gray-400 text-sm mb-8">Last updated: November 2026</p>

          <section className="mb-8">
            <p className="text-gray-600 leading-relaxed">
              Copper City (“Unsolved Murders of 1893”) is a detective game for iPhone, iPad and Mac. It runs
              entirely on your device. In short: <b className="text-gray-800">the app does not collect any data.</b> The only exception is
              the one-time purchase of the full version, which is handled by Apple (section 6).
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Controller</h3>
            <p className="text-gray-600 leading-relaxed">
              Peter Hölzer, Eichholz 8, 37284 Waldkappel, Germany ·{" "}
              <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
                peter@hoelzer.xyz
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">2. No data collection</h3>
            <p className="text-gray-600 leading-relaxed">
              The app does not collect, store or transmit any personal data. It has no accounts, no sign-in,
              no advertising and no analytics or crash reporting.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">3. No server connection</h3>
            <p className="text-gray-600 leading-relaxed">
              The app does not connect to any servers of our own. All cases, images, films and texts are
              contained in the app itself; every case is generated on the device. The only internet
              connection is to Apple’s App Store when you buy or restore the full version (section 6).
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Saved games stay on the device</h3>
            <p className="text-gray-600 leading-relaxed">
              Your cases, your service record and an optional profile name are stored only locally on your
              device, in the app’s data container. Using “Back up” in the settings you can export your
              progress as a file to a location of your choice; the app also keeps up to three automatic
              backups in its own data container when it goes to the background. These files leave the device
              only if you share them yourself. Deleting the app removes the saved games.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">5. No permissions</h3>
            <p className="text-gray-600 leading-relaxed">
              The app requests no permissions – no location, camera, microphone, contacts or notifications.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">6. In-app purchase and App Store</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              The first two hours of play are free. To know how much of that time has been used, the app
              counts play time locally on the device; this value never leaves the device. After that, the
              full version can be unlocked with a single in-app purchase.
            </p>
            <p className="text-gray-600 leading-relaxed mb-3">
              The purchase is processed by Apple (Apple Distribution International Ltd., Hollyhill Industrial
              Estate, Cork, Ireland) through the App Store. Apple processes your payment and account data
              under its own privacy policy; the app receives from Apple only the confirmation that the
              purchase exists – no payment details, no name, no Apple ID. This confirmation is stored on the
              device and is queried from Apple again when you use “Restore Purchases”. The legal basis is the
              performance of our contract with you (Art. 6(1)(b) GDPR). More:{" "}
              <a
                href="https://www.apple.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                apple.com/legal/privacy
              </a>
            </p>
            <p className="text-gray-600 leading-relaxed">
              When you download the app from the App Store, Apple likewise processes data under its own
              terms. We have no influence on this; Copper City itself receives none of it.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">7. Children</h3>
            <p className="text-gray-600 leading-relaxed">
              The app is not designed for children under 13 and does not collect data from them either.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">8. Changes</h3>
            <p className="text-gray-600 leading-relaxed">
              If any of this changes, this statement will be updated and the change will be mentioned in the
              app.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">9. Contact</h3>
            <p className="text-gray-600 leading-relaxed">
              Privacy questions:{" "}
              <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
                peter@hoelzer.xyz
              </a>{" "}
              ·{" "}
              <Link href="/impressum" className="text-orange-500 hover:underline">
                Legal notice / Impressum
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
