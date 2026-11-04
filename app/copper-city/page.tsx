import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copper City – Support & Kontakt · Support & Contact",
  description:
    "Support, Kontakt und häufige Fragen zum Detektivspiel Copper City (iPhone, iPad, Mac). Support, contact and FAQ for the detective game Copper City.",
  alternates: { canonical: "https://culinse.com/copper-city" },
};

const SUPPORT_MAIL = "peter@hoelzer.xyz";
const MAILTO_DE = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Copper City – Support-Anfrage")}`;
const MAILTO_EN = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent("Copper City – Support request")}`;

export default function CopperCitySupport() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">🔎 Copper City</span>
          <div className="flex items-center gap-4 text-sm">
            <a href="#english" className="text-gray-500 hover:underline">
              English
            </a>
            <Link href="/copper-city/datenschutz" className="text-orange-500 hover:underline">
              Datenschutz
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Copper City – Support &amp; Kontakt</h1>
        <p className="text-gray-400 text-sm mb-8">
          Support-Seite für die App „Copper City – Ungelöste Mordfälle 1893“ auf iPhone, iPad und Mac ·{" "}
          <a href="#english" className="underline">
            English version below
          </a>
        </p>

        {/* Kontakt zuerst (App Store Guideline 1.5: Support-URL muss zeigen, wie man Fragen stellt) */}
        <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fragen? Problem? Wunsch? – So erreichst du uns</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Schreib uns eine E-Mail an{" "}
            <a href={MAILTO_DE} className="font-semibold text-orange-600 hover:underline">
              {SUPPORT_MAIL}
            </a>
            . Wir antworten in der Regel innerhalb von 1–3 Tagen – auf Deutsch oder Englisch. Hilfreich sind:
            Gerät (iPhone, iPad oder Mac), bei einem Fall die Fallnummer (z. B. 1893-0427) und eine kurze
            Beschreibung, was passiert ist.
          </p>
          <a
            href={MAILTO_DE}
            className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            ✉️ Support-Anfrage per E-Mail senden
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Kein Konto, kein Login nötig, keine Werbung. Die ersten zwei Stunden spielst du kostenlos; danach
            schaltet ein einmaliger Kauf die Vollversion dauerhaft frei – kein Abo.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Über das Spiel</h2>
          <p className="text-gray-600 leading-relaxed">
            Copper City ist ein Detektivspiel für eine Person: Kupferstadt, 1893 – ein Mord, vier bis sechs
            Verdächtige, eine Wahrheitsmaschine aus Messing. Jeder Fall wird auf deinem Gerät neu erzeugt; du
            untersuchst den Tatort, forderst Berichte über die Rohrpost an, vernimmst Verdächtige und legst
            der Wahrheitsmaschine Täter, Tatwaffe, Tatzeit und Motiv vor. Das Spiel läuft vollständig offline,
            ohne Konto und ohne Werbung – auf Deutsch und Englisch. Die ersten zwei Stunden sind kostenlos;
            danach schaltet ein einmaliger In-App-Kauf die Vollversion dauerhaft frei.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Häufige Fragen</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              <b className="text-gray-800">Wo liegen meine Fälle und mein Dienstbuch?</b>
              <br />
              Nur auf deinem Gerät, im Speicher der App. Nichts wird ins Internet übertragen. Beim Löschen der
              App werden die Spielstände mit entfernt – vorher sichern.
            </p>
            <p>
              <b className="text-gray-800">Wie sichere ich meinen Spielstand oder nehme ihn auf ein anderes Gerät mit?</b>
              <br />
              Einstellungen → „Sichern“. Auf iPhone und iPad öffnet sich das Teilen-Blatt, am Mac der
              Sichern-Dialog; die Datei kannst du z. B. in iCloud Drive ablegen. Auf dem anderen Gerät
              Einstellungen → „Einspielen“ und die Datei auswählen – Profilname und Fälle kommen mit.
              Zusätzlich legt die App beim Wechsel in den Hintergrund selbst bis zu drei Sicherungen an
              (iPhone/iPad: Dateien → „Auf meinem iPhone/iPad“ → Copper City → Sicherungen; Mac: Menü
              „Ablage → Sicherungen im Finder zeigen“).
            </p>
            <p>
              <b className="text-gray-800">Wie wechsle ich die Sprache?</b>
              <br />
              Die App folgt der Gerätesprache (Deutsch oder Englisch). Umschalten geht oben im Blatt „Bevor
              es losgeht“ oder unter Einstellungen → Sprache. Ein laufender Fall bleibt in seiner Sprache;
              der nächste erscheint in der neuen.
            </p>
            <p>
              <b className="text-gray-800">Die Rohrpost dauert mir zu lange.</b>
              <br />
              Vor dem Übernehmen eines Falls kannst du im Menü „Rohrpost“ eine kürzere Wartezeit wählen.
              Wer wartet, kann in der Zwischenzeit vernehmen.
            </p>
            <p>
              <b className="text-gray-800">Kann ich einen Fall noch einmal spielen oder mit jemandem teilen?</b>
              <br />
              Ja – jeder Fall hat eine Fallnummer (z. B. 1893-0427). Wer dieselbe Nummer eingibt, bekommt meist
              denselben Fall. Leer gelassen entscheidet der Zufall.
            </p>
            <p>
              <b className="text-gray-800">Das Flackern stört mich / mein Gerät ist älter.</b>
              <br />
              In der Wachstube auf „Ton und Darstellung …“ tippen und dort die „ruhige Darstellung“ einschalten –
              sie nimmt Gaslicht-Flackern und Effekte zurück.
            </p>
            <p>
              <b className="text-gray-800">Sind die Bilder echt? Gibt es die Personen?</b>
              <br />
              Nein. Alle Bilder und Filme wurden mit künstlicher Intelligenz erzeugt; Kupferstadt, seine
              Bewohner und alle Fälle sind frei erfunden, die dargestellten Personen existieren nicht. Das
              steht auch beim ersten Start und unter Einstellungen → Rechtliches.
            </p>
            <p>
              <b className="text-gray-800">Für wen ist das Spiel geeignet?</b>
              <br />
              Es behandelt Mordfälle mit gemalten Tatorten, ohne bewegte Gewalt, ohne Horror. Es ist nicht
              für Kinder unter 13 Jahren gestaltet; die Altersfreigabe steht im App Store.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Kostenlose Spielzeit und Vollversion</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              <b className="text-gray-800">Was kostet Copper City?</b>
              <br />
              Das Laden ist kostenlos, und die ersten zwei Stunden Spielzeit sind es auch – mit allem, was das
              Spiel kann. Danach fragt die App einmalig, ob du die Vollversion kaufen möchtest. Es ist ein
              einziger Kauf über den App Store, kein Abo; den Preis in deiner Landeswährung zeigt die App vor
              dem Kauf an. Wer nicht kauft, kann seine bisherigen Fälle weiter ansehen, aber keine neuen
              übernehmen.
            </p>
            <p>
              <b className="text-gray-800">Ich habe schon gekauft, die App fragt aber wieder (neues Gerät, Neuinstallation).</b>
              <br />
              In den Einstellungen der App auf „Käufe wiederherstellen“ tippen. Voraussetzung ist dieselbe
              Apple-ID, mit der du gekauft hast. Danach ist die Vollversion wieder frei – ohne erneute
              Zahlung.
            </p>
            <p>
              <b className="text-gray-800">Kann ich den Kauf zurückgeben?</b>
              <br />
              Käufe wickelt Apple ab, deshalb läuft auch eine Rückerstattung über Apple:{" "}
              <a
                href="https://reportaproblem.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                reportaproblem.apple.com
              </a>
              . Wir selbst sehen keine Zahlungsdaten und können keine Erstattung auslösen – bei Problemen
              hilf uns aber gern per E-Mail weiter, wir schauen uns das an.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Rechtliches</h2>
          <p className="text-gray-600 leading-relaxed">
            <Link href="/copper-city/datenschutz" className="text-orange-500 hover:underline">
              Datenschutzerklärung
            </Link>{" "}
            ·{" "}
            <Link href="/de/impressum" className="text-orange-500 hover:underline">
              Impressum
            </Link>
            <br />
            Herausgeber: Peter Hölzer, Deutschland. Schriften unter SIL Open Font License 1.1 und Apache
            License 2.0 (Lizenztexte in der App unter Einstellungen → Lizenzen).
          </p>
        </section>

        {/* ---------- English ---------- */}
        <hr className="border-gray-200 mb-10" />
        <div id="english" lang="en">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Copper City – Support &amp; Contact</h2>
          <p className="text-gray-400 text-sm mb-8">
            Support page for the app “Copper City – Unsolved Murders of 1893” for iPhone, iPad and Mac. The
            game is available in English and German.
          </p>

          <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Questions, problems, feedback – contact us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Email us at{" "}
              <a href={MAILTO_EN} className="font-semibold text-orange-600 hover:underline">
                {SUPPORT_MAIL}
              </a>
              . We usually reply within 1–3 days, in English or German. Please include your device (iPhone,
              iPad or Mac), the case number if a case is affected (e.g. 1893-0427) and a short description
              of what happened.
            </p>
            <a
              href={MAILTO_EN}
              className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              ✉️ Send a support request by email
            </a>
            <p className="text-gray-500 text-sm mt-4">
              No account or login is required, and there is no advertising. The first two hours are free to
              play; after that a single one-time purchase unlocks the full version for good – no
              subscription.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">About the game</h3>
            <p className="text-gray-600 leading-relaxed">
              Copper City is a single-player detective game: Copper City, 1893 – one murder, four to six
              suspects, a Truth Machine of brass. Every case is generated on your device; you inspect the crime
              scene, request reports by pneumatic post, question suspects and put culprit, weapon, time and
              motive before the Truth Machine. The game runs entirely offline – no account, no ads – in English and
              German. The first two hours are free; after that a single in-app purchase unlocks the full
              version permanently.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Frequently asked questions</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                <b className="text-gray-800">Where are my cases and my service record stored?</b>
                <br />
                Only on your device, in the app’s own storage. Nothing is sent to the internet. Deleting the
                app removes the saved games – back up first.
              </p>
              <p>
                <b className="text-gray-800">How do I back up my progress or move it to another device?</b>
                <br />
                Settings → “Back up”. On iPhone and iPad the share sheet opens, on the Mac the save dialog;
                you can store the file in iCloud Drive, for example. On the other device choose Settings →
                “Restore” and pick the file – profile name and cases come along. The app also keeps up to
                three automatic backups when it goes to the background (iPhone/iPad: Files → “On My
                iPhone/iPad” → Copper City → Sicherungen; Mac: menu “File → Show Backups in Finder”).
              </p>
              <p>
                <b className="text-gray-800">How do I change the language?</b>
                <br />
                The app follows your device language (English or German). You can switch at the top of the
                “Before we begin” sheet or under Settings → Language. A running case keeps its language; the
                next one appears in the new language.
              </p>
              <p>
                <b className="text-gray-800">The pneumatic post takes too long.</b>
                <br />
                Before taking a case, choose a shorter waiting time in the “Pneumatic post” menu. While you
                wait, you can question suspects.
              </p>
              <p>
                <b className="text-gray-800">Can I replay a case or share it with someone?</b>
                <br />
                Yes – every case has a case number (e.g. 1893-0427). Entering the same number usually gives the
                same case; leave it blank and chance decides.
              </p>
              <p>
                <b className="text-gray-800">The flicker bothers me / my device is older.</b>
                <br />
                In the station house, tap “Sound & Display …” and turn on the “calm display” – it tones down
                gaslight flicker and effects.
              </p>
              <p>
                <b className="text-gray-800">Are the pictures real? Do these people exist?</b>
                <br />
                No. All images and films were created with artificial intelligence; Copper City, its
                inhabitants and all cases are entirely fictitious, and the persons depicted do not exist.
                The app says so on first launch and under Settings → Legal notices.
              </p>
              <p>
                <b className="text-gray-800">Who is the game suitable for?</b>
                <br />
                It deals with murder cases and shows painted crime scenes – no moving violence, no horror.
                It is not designed for children under 13; see the age rating in the App Store.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Free play time and full version</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                <b className="text-gray-800">How much does Copper City cost?</b>
                <br />
                Downloading is free, and so are the first two hours of play – with everything the game can
                do. After that the app asks once whether you would like to buy the full version. It is a
                single purchase through the App Store, not a subscription; the app shows the price in your
                local currency before you buy. If you decide not to, you can still look at your previous
                cases but cannot take on new ones.
              </p>
              <p>
                <b className="text-gray-800">I already bought it, but the app asks again (new device, reinstall).</b>
                <br />
                Tap “Restore Purchases” in the app’s settings. You need to be signed in with the same Apple
                ID you bought with. The full version is then unlocked again – no second payment.
              </p>
              <p>
                <b className="text-gray-800">Can I get a refund?</b>
                <br />
                Purchases are handled by Apple, so refunds are too:{" "}
                <a
                  href="https://reportaproblem.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  reportaproblem.apple.com
                </a>
                . We never see your payment details and cannot issue refunds ourselves – but if something
                went wrong, do email us and we will look into it.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal</h3>
            <p className="text-gray-600 leading-relaxed">
              <Link href="/copper-city/datenschutz" className="text-orange-500 hover:underline">
                Privacy policy (German and English)
              </Link>{" "}
              ·{" "}
              <Link href="/de/impressum" className="text-orange-500 hover:underline">
                Legal notice / Impressum
              </Link>
              <br />
              Publisher: Peter Hölzer, Germany. Fonts under the SIL Open Font License 1.1 and the Apache
              License 2.0 (license texts in the app under Settings → Licences).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
