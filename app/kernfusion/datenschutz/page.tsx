import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kernfusion – Datenschutz",
  description: "Datenschutzerklärung für das Spiel Kernfusion – Das Serverrack-Archipel.",
  alternates: { canonical: "https://culinse.com/kernfusion/datenschutz" },
};

export default function KernfusionDatenschutz() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/kernfusion" className="font-semibold text-gray-900">
            ⚛️ Kernfusion
          </Link>
          <Link href="/kernfusion" className="text-sm text-orange-500 hover:underline">
            Support
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung – Kernfusion</h1>
        <p className="text-gray-400 text-sm mb-8">Stand: September 2026</p>

        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">
            Kernfusion („Das Serverrack-Archipel“) ist ein Spiel für iPad und Mac von Peter Hölzer. Kurz
            gesagt: <b className="text-gray-800">Die App erhebt keine Daten.</b>
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
          <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Welche Daten werden verarbeitet?</h2>
          <p className="text-gray-600 leading-relaxed">
            Keine. Die App hat kein Benutzerkonto, keine Anmeldung, keine Werbung und keine
            Analyse-Werkzeuge. Sie stellt keine Verbindung zum Internet her und sendet nichts an uns
            oder an Dritte.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Wo liegt mein Spielstand?</h2>
          <p className="text-gray-600 leading-relaxed">
            Der Spielstand wird ausschließlich lokal auf deinem Gerät gespeichert, im Speicher der App.
            Er verlässt das Gerät nur, wenn du ihn selbst über „Speicherstand exportieren“ als Text
            kopierst und weitergibst.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. App Store</h2>
          <p className="text-gray-600 leading-relaxed">
            Beim Laden der App über den App Store verarbeitet Apple Daten nach seinen eigenen
            Bestimmungen. Darauf haben wir keinen Einfluss; Kernfusion selbst erhält davon nichts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">5. In-App-Kauf</h2>
          <p className="text-gray-600 leading-relaxed">
            Die Vollversion wird als einmaliger Kauf über Apple abgewickelt. Apple verarbeitet dabei deine
            Zahlungsdaten nach seinen eigenen Bestimmungen; die App erhält nur die Bestätigung, dass der
            Kauf vorliegt – keine Zahlungs- oder Kontodaten.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Kinder</h2>
          <p className="text-gray-600 leading-relaxed">
            Die App ist für alle Altersgruppen geeignet (4+). Da keine Daten erhoben werden, gibt es
            auch keine Daten von Kindern.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Kontakt</h2>
          <p className="text-gray-600 leading-relaxed">
            Fragen zum Datenschutz:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
