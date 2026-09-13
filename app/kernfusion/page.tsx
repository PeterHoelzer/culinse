import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kernfusion – Support",
  description:
    "Support und Kontakt für das Spiel Kernfusion – Das Serverrack-Archipel (iPad und Mac).",
  alternates: { canonical: "https://culinse.com/kernfusion" },
};

export default function KernfusionSupport() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">⚛️ Kernfusion</span>
          <Link href="/kernfusion/datenschutz" className="text-sm text-orange-500 hover:underline">
            Datenschutz
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kernfusion – Das Serverrack-Archipel</h1>
        <p className="text-gray-400 text-sm mb-8">Support-Seite für die App auf iPad und Mac</p>

        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">
            Kernfusion ist ein ruhiges Merge-Spiel durch die Computergeschichte: Drei gleiche Teile
            nebeneinander verschmelzen zu einem besseren – vom Relais bis zum Quantenrechner. Das Spiel
            läuft komplett auf dem Gerät, ohne Konto, ohne Werbung und ohne Internet.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Kontakt</h2>
          <p className="text-gray-600 leading-relaxed">
            Fragen, Fehler, Wünsche:{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
              peter@hoelzer.xyz
            </a>
            <br />
            Wir antworten in der Regel innerhalb weniger Tage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Häufige Fragen</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              <b className="text-gray-800">Wo liegt mein Spielstand?</b>
              <br />
              Nur auf deinem Gerät. Er wird nach jedem Zug automatisch gespeichert.
            </p>
            <p>
              <b className="text-gray-800">Wie bekomme ich den Spielstand auf ein anderes Gerät?</b>
              <br />
              Im Spiel oben rechts auf ❓ tippen → „Speicherstand exportieren“. Der Text ist dein
              Spielstand. Auf dem anderen Gerät ❓ → „Importieren“ und den Text einfügen.
            </p>
            <p>
              <b className="text-gray-800">Warum ist das Spiel nur im Querformat?</b>
              <br />
              Das Serverrack ist breiter als hoch. Dreh das iPad quer, dann füllt das Spiel den ganzen
              Bildschirm.
            </p>
            <p>
              <b className="text-gray-800">Was ist, wenn ich nicht weiterweiß?</b>
              <br />
              Der Knopf „Ziele“ links zeigt immer den nächsten Schritt und was du dafür brauchst. Jedes
              Teil erklärt beim Antippen, woher es kommt.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Rechtliches</h2>
          <p className="text-gray-600 leading-relaxed">
            <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">
              Datenschutzerklärung
            </Link>{" "}
            ·{" "}
            <Link href="/de/impressum" className="text-orange-500 hover:underline">
              Impressum
            </Link>
            <br />
            Kernfusion ist ein Spiel von Peter Hölzer.
          </p>
        </section>
      </main>
    </div>
  );
}
