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
            <b className="text-gray-800">Die App erhebt keine Daten.</b>
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
            Konten, keine Anmeldung, keine Werbung, keine Analyse- oder Absturzberichte und keine Käufe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Keine Verbindung zu Servern</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App baut keine Verbindung ins Internet auf. Alle Fälle, Bilder, Filme und Texte liegen in der
            App selbst; jeder Fall wird auf dem Gerät erzeugt.
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
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. App Store</h2>
          <p className="text-gray-600 leading-relaxed">
            Beim Laden der App über den App Store verarbeitet Apple Daten nach seinen eigenen Bestimmungen.
            Darauf haben wir keinen Einfluss; Copper City selbst erhält davon nichts.
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
            <Link href="/de/impressum" className="text-orange-500 hover:underline">
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
              entirely on your device. In short: <b className="text-gray-800">the app does not collect any data.</b>
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
              no advertising, no analytics or crash reporting and no purchases.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">3. No server connection</h3>
            <p className="text-gray-600 leading-relaxed">
              The app does not connect to the internet. All cases, images, films and texts are contained in
              the app itself; every case is generated on the device.
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">6. App Store</h3>
            <p className="text-gray-600 leading-relaxed">
              When you download the app from the App Store, Apple processes data under its own terms. We
              have no influence on this; Copper City itself receives none of it.
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
              <Link href="/de/impressum" className="text-orange-500 hover:underline">
                Legal notice / Impressum
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
