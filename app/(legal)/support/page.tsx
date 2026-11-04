import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support & Kontakt – Culinse, Copper City, Kernfusion · Support & Contact",
  description:
    "Support und Kontakt für culinse.com und die Apps Copper City und Kernfusion (iPhone, iPad, Mac). Support and contact for culinse.com and the apps Copper City and Kernfusion.",
  alternates: { canonical: "https://culinse.com/support" },
};

const SUPPORT_MAIL = "peter@hoelzer.xyz";
const MAILTO_DE = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Support-Anfrage")}`;
const MAILTO_EN = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Support request")}`;

// Feste Adresse ohne Locale-Präfix – steht so in den Apps und in App Store Connect.
export default function Support() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center w-fit">
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "24px", width: "auto" }} />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a href="#english" className="text-gray-500 hover:underline">
              English
            </a>
            <Link href="/datenschutz" className="text-orange-500 hover:underline">
              Datenschutz
            </Link>
            <Link href="/impressum" className="text-orange-500 hover:underline">
              Impressum
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support &amp; Kontakt</h1>
        <p className="text-gray-400 text-sm mb-8">
          Für culinse.com und die Apps Copper City und Kernfusion ·{" "}
          <a href="#english" className="underline">
            English version below
          </a>
        </p>

        {/* Kontakt zuerst (App Store Guideline 1.5: Support-URL muss zeigen, wie man Fragen stellt) */}
        <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fragen? Problem? Wunsch? – So erreichst du uns</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Schreib eine E-Mail an{" "}
            <a href={MAILTO_DE} className="font-semibold text-orange-600 hover:underline">
              {SUPPORT_MAIL}
            </a>
            . Wir antworten in der Regel innerhalb von 1–3 Tagen – auf Deutsch oder Englisch. Hilfreich sind:
            um welche App oder Seite es geht, dein Gerät (iPhone, iPad, Mac oder Browser) und eine kurze
            Beschreibung, was passiert ist.
          </p>
          <a
            href={MAILTO_DE}
            className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            ✉️ Support-Anfrage per E-Mail senden
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Anbieter: Peter Hölzer, Eichholz 8, 37284 Waldkappel, Deutschland (
            <Link href="/impressum" className="underline">
              Impressum
            </Link>
            ).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🔎 Copper City – Ungelöste Mordfälle 1893</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Detektivspiel für iPhone, iPad und Mac. Läuft vollständig offline, ohne Konto und ohne Werbung.
            Die ersten zwei Stunden sind kostenlos; danach schaltet ein einmaliger In-App-Kauf die Vollversion
            dauerhaft frei – kein Abo. Bei einer Anfrage hilft uns die Fallnummer (z. B. 1893-0427).
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
            <li>
              <Link href="/copper-city" className="text-orange-500 hover:underline">
                Häufige Fragen zu Copper City
              </Link>{" "}
              – Spielstand sichern, Sprache wechseln, Fallnummern, ruhige Darstellung, Kauf und
              „Käufe wiederherstellen“
            </li>
            <li>
              <Link href="/copper-city/datenschutz" className="text-orange-500 hover:underline">
                Datenschutzerklärung Copper City
              </Link>{" "}
              (deutsch und englisch)
            </li>
            <li>
              Rückerstattung eines Kaufs: über Apple unter{" "}
              <a
                href="https://reportaproblem.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                reportaproblem.apple.com
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">⚛️ Kernfusion – Das Serverrack-Archipel</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Spiel für iPad und Mac. Läuft offline, ohne Konto und ohne Werbung.
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
            <li>
              <Link href="/kernfusion" className="text-orange-500 hover:underline">
                Häufige Fragen zu Kernfusion
              </Link>
            </li>
            <li>
              <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">
                Datenschutzerklärung Kernfusion
              </Link>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🍳 culinse.com – Rezepte und Wochenplaner</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Fragen zur Website, zum Nutzerkonto oder zum Wochenplaner beantworten wir ebenfalls per E-Mail.
            Möchtest du dein Culinse-Konto samt aller Daten löschen lassen, schreib uns kurz von der
            E-Mail-Adresse, mit der du dich angemeldet hast.
          </p>
          <p className="text-gray-600 leading-relaxed">
            <Link href="/datenschutz" className="text-orange-500 hover:underline">
              Datenschutzerklärung
            </Link>{" "}
            ·{" "}
            <Link href="/impressum" className="text-orange-500 hover:underline">
              Impressum
            </Link>
          </p>
        </section>

        {/* ---------- English ---------- */}
        <hr className="border-gray-200 mb-10" />
        <div id="english" lang="en">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Support &amp; Contact</h2>
          <p className="text-gray-400 text-sm mb-8">For culinse.com and the apps Copper City and Kernfusion</p>

          <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Questions, problems, feedback – contact us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Email us at{" "}
              <a href={MAILTO_EN} className="font-semibold text-orange-600 hover:underline">
                {SUPPORT_MAIL}
              </a>
              . We usually reply within 1–3 days, in English or German. Please tell us which app or page it is
              about, your device (iPhone, iPad, Mac or browser) and briefly what happened.
            </p>
            <a
              href={MAILTO_EN}
              className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              ✉️ Send a support request by email
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Publisher: Peter Hölzer, Eichholz 8, 37284 Waldkappel, Germany (
              <Link href="/impressum" className="underline">
                legal notice
              </Link>
              ).
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔎 Copper City – Unsolved Murders of 1893</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              Detective game for iPhone, iPad and Mac. Runs entirely offline, no account, no ads. The first two
              hours are free; after that a single in-app purchase unlocks the full version for good – no
              subscription. If you write to us about a case, the case number (e.g. 1893-0427) helps.
            </p>
            <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
              <li>
                <Link href="/copper-city#english" className="text-orange-500 hover:underline">
                  Copper City FAQ
                </Link>{" "}
                – backups, language, case numbers, calm display, purchase and “Restore Purchases”
              </li>
              <li>
                <Link href="/copper-city/datenschutz#english" className="text-orange-500 hover:underline">
                  Copper City privacy policy
                </Link>
              </li>
              <li>
                Refunds for a purchase: through Apple at{" "}
                <a
                  href="https://reportaproblem.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  reportaproblem.apple.com
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">⚛️ Kernfusion</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              Game for iPad and Mac. Runs offline, no account, no ads.
            </p>
            <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
              <li>
                <Link href="/kernfusion#english" className="text-orange-500 hover:underline">
                  Kernfusion FAQ
                </Link>
              </li>
              <li>
                <Link href="/kernfusion/datenschutz" className="text-orange-500 hover:underline">
                  Kernfusion privacy policy
                </Link>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🍳 culinse.com – recipes and meal planner</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              Questions about the website, your account or the meal planner: email us as well. To have your
              Culinse account and all its data deleted, write to us from the email address you signed up
              with.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <Link href="/datenschutz" className="text-orange-500 hover:underline">
                Privacy policy (German)
              </Link>{" "}
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
