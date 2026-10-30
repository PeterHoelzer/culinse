import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kernfusion – Support & Kontakt · Support & Contact",
  description:
    "Support, Kontakt und häufige Fragen zum Spiel Kernfusion – Das Serverrack-Archipel (iPad und Mac). Support, contact and FAQ for the game Kernfusion.",
  alternates: { canonical: "https://culinse.com/kernfusion" },
};

const SUPPORT_MAIL = "peter@hoelzer.xyz";
const MAILTO_DE = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Kernfusion – Support-Anfrage")}`;
const MAILTO_EN = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Kernfusion – Support request")}`;

export default function KernfusionSupport() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">⚛️ Kernfusion</span>
          <div className="flex items-center gap-4 text-sm">
            <a href="#english" className="text-gray-500 hover:underline">
              English
            </a>
            <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">
              Datenschutz
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kernfusion – Support &amp; Kontakt</h1>
        <p className="text-gray-400 text-sm mb-8">
          Support-Seite für die App „Kernfusion – Das Serverrack-Archipel“ auf iPad und Mac ·{" "}
          <a href="#english" className="underline">
            English version below
          </a>
        </p>

        {/* Kontakt zuerst: Hier stellen Nutzer:innen Fragen und melden Probleme (App Store Guideline 1.5) */}
        <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fragen? Problem? Wunsch? – So erreichst du uns</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Schreib uns eine E-Mail an{" "}
            <a href={MAILTO_DE} className="font-semibold text-orange-600 hover:underline">
              {SUPPORT_MAIL}
            </a>
            . Wir antworten in der Regel innerhalb von 1–3 Tagen – auf Deutsch oder Englisch. Hilfreich sind:
            Gerät (iPad oder Mac), Version des Spiels (❓ → unten im Dialog) und eine kurze Beschreibung, was
            passiert ist.
          </p>
          <a
            href={MAILTO_DE}
            className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            ✉️ Support-Anfrage per E-Mail senden
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Kein Konto, kein Login nötig. Für Fragen zu Kauf, Rechnung oder Rückerstattung des In-App-Kaufs
            „Vollversion“ ist außerdem Apple zuständig:{" "}
            <a href="https://support.apple.com/billing" className="text-orange-600 hover:underline">
              support.apple.com/billing
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Über das Spiel</h2>
          <p className="text-gray-600 leading-relaxed">
            Kernfusion ist ein ruhiges Merge-Spiel durch die Computergeschichte: Drei gleiche Teile
            nebeneinander verschmelzen zu einem besseren – vom Relais bis zum Quantenrechner. Das Spiel
            läuft komplett auf dem Gerät, ohne Konto, ohne Werbung und ohne Internet. Epoche 1 ist
            kostenlos; die einmalige „Vollversion“ (In-App-Kauf über Apple) schaltet die Epochen 2 bis 5 frei.
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
              <b className="text-gray-800">Ich habe die Vollversion gekauft, aber sie ist nicht freigeschaltet.</b>
              <br />
              ❓ → „Vollversion“ → „Käufe wiederherstellen“ antippen (mit derselben Apple-ID wie beim Kauf).
              Klappt das nicht, schreib uns – wir helfen.
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

        <section className="mb-12">
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
            Kernfusion ist ein Spiel von Peter Hölzer, Deutschland.
          </p>
        </section>

        {/* ---------- English ---------- */}
        <hr className="border-gray-200 mb-10" />
        <div id="english" lang="en">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kernfusion – Support &amp; Contact</h2>
          <p className="text-gray-400 text-sm mb-8">
            Support page for the game “Kernfusion – Das Serverrack-Archipel” for iPad and Mac. The game is
            available in German.
          </p>

          <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Questions, problems, feedback – contact us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Email us at{" "}
              <a href={MAILTO_EN} className="font-semibold text-orange-600 hover:underline">
                {SUPPORT_MAIL}
              </a>
              . We usually reply within 1–3 days, in English or German. Please include your device (iPad or
              Mac), the game version (❓ → bottom of the dialog) and a short description of what happened.
            </p>
            <a
              href={MAILTO_EN}
              className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              ✉️ Send a support request by email
            </a>
            <p className="text-gray-500 text-sm mt-4">
              No account or login is required. For billing or refund questions about the in-app purchase
              “Vollversion” (full version), Apple handles payments:{" "}
              <a href="https://support.apple.com/billing" className="text-orange-600 hover:underline">
                support.apple.com/billing
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">About the game</h3>
            <p className="text-gray-600 leading-relaxed">
              Kernfusion is a relaxed merge puzzle through the history of computing: merge three identical
              parts into a better one, from the relay to the quantum computer. The game runs entirely on your
              device – no account, no ads, no internet connection. Epoch 1 is free; the one-time in-app
              purchase “Vollversion” unlocks epochs 2 to 5.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Frequently asked questions</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                <b className="text-gray-800">Where is my saved game?</b>
                <br />
                Only on your device. It is saved automatically after every move.
              </p>
              <p>
                <b className="text-gray-800">How do I move my saved game to another device?</b>
                <br />
                In the game tap ❓ (top right) → “Speicherstand exportieren” (export). The text is your
                saved game. On the other device tap ❓ → “Importieren” (import) and paste the text.
              </p>
              <p>
                <b className="text-gray-800">I bought the full version but it is not unlocked.</b>
                <br />
                Tap ❓ → “Vollversion” → “Käufe wiederherstellen” (restore purchases) with the same Apple
                Account you used for the purchase. If that does not help, email us.
              </p>
              <p>
                <b className="text-gray-800">Why is the game landscape only?</b>
                <br />
                The server rack is wider than it is tall. Turn your iPad sideways and the game fills the
                screen.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal</h3>
            <p className="text-gray-600 leading-relaxed">
              <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">
                Privacy policy (German)
              </Link>{" "}
              ·{" "}
              <Link href="/de/impressum" className="text-orange-500 hover:underline">
                Legal notice / Impressum
              </Link>
              <br />
              Kernfusion is a game by Peter Hölzer, Germany.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
