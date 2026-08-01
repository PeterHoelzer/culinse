import type { Metadata } from "next";
import Link from "next/link";

// AGB / Nutzungsbedingungen — Basis-Entwurf, fachlich sauber aufgebaut;
// finale Freigabe durch Generator/Anwalt empfohlen (siehe Plan Phase 2, F1).

interface Sec {
  t: string;
  b: string;
  link?: { href: string; label: string };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const de = locale === "de";
  return {
    title: de ? "AGB" : "Terms of Service",
    description: de
      ? "Allgemeine Geschäftsbedingungen und Nutzungsbedingungen von Culinse."
      : "Terms of service for Culinse.",
    alternates: {
      canonical: `https://culinse.com/${locale}/agb`,
      languages: {
        en: "https://culinse.com/en/agb",
        de: "https://culinse.com/de/agb",
        "x-default": "https://culinse.com/en/agb",
      },
    },
  };
}

const DE_SECTIONS: Sec[] = [
  {
    t: "1. Geltungsbereich und Anbieter",
    b: "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform Culinse (culinse.com) einschließlich aller Unterseiten und Funktionen. Anbieter ist der im Impressum genannte Betreiber.",
    link: { href: "/impressum", label: "Zum Impressum" },
  },
  {
    t: "2. Leistungsbeschreibung",
    b: "Culinse ist ein Rezept- und Wochenplaner-Dienst. Das Basisangebot (Rezepte entdecken, Suche, Rezepte speichern, eine Sammlung, Einkaufsrechner) ist kostenlos. Culinse Pro erweitert den Dienst um den vollständigen Wochenplaner, automatische Einkaufslisten, unbegrenzte Sammlungen und weitere Funktionen. Umfang und Preise werden auf der Pro-Seite vor Vertragsschluss angezeigt.",
  },
  {
    t: "3. Registrierung und Konto",
    b: "Für einige Funktionen ist ein kostenloses Konto erforderlich. Du musst bei der Registrierung wahrheitsgemäße Angaben machen, deine Zugangsdaten geheim halten und uns eine missbräuchliche Nutzung deines Kontos umgehend melden. Die Nutzung setzt ein Mindestalter von 16 Jahren voraus. Ein Anspruch auf Registrierung besteht nicht.",
  },
  {
    t: "4. Culinse Pro: Preise, Laufzeit, Kündigung",
    b: "Culinse Pro ist ein Abonnement mit monatlicher oder jährlicher Laufzeit; der jeweils gültige Preis wird vor dem Abschluss angezeigt. Neue Abos beginnen mit einer 7-tägigen kostenlosen Testphase; erst nach deren Ablauf wird der gewählte Preis über unseren Zahlungsdienstleister Stripe abgebucht. Wenn du in der Testphase kündigst, entstehen keine Kosten. Das Abo verlängert sich automatisch um die jeweilige Laufzeit, wenn es nicht vor Ablauf der laufenden Periode über dein Profil (Abo verwalten) gekündigt wird. Die Kündigung ist jederzeit zum Ende der laufenden Periode möglich; bereits gezahlte Entgelte für die laufende Periode werden nicht erstattet, dein Pro-Zugang bleibt bis zum Periodenende bestehen.",
  },
  {
    t: "5. Widerrufsrecht",
    b: "Verbrauchern steht ein gesetzliches Widerrufsrecht von 14 Tagen zu. Einzelheiten, Rechtsfolgen und das Muster-Widerrufsformular findest du in der Widerrufsbelehrung.",
    link: { href: "/widerruf", label: "Zur Widerrufsbelehrung" },
  },
  {
    t: "6. Deine Inhalte (Community-Rezepte)",
    b: "Du kannst eigene Rezepte mit Fotos veröffentlichen. Dabei gilt: (a) Du versicherst, dass du alle erforderlichen Rechte an den hochgeladenen Inhalten (Texte, Fotos) hast und keine Rechte Dritter verletzt werden — insbesondere ist das Kopieren fremder Rezepttexte oder Fotos untersagt. (b) Für deine Inhalte bist du selbst verantwortlich; das gilt auch, wenn du sie mit KI-Werkzeugen erstellt hast. Wir freuen uns über freiwillige Transparenz bei KI-erstellten Inhalten. (c) Verboten sind rechtswidrige, irreführende oder gefährliche Inhalte, insbesondere Anleitungen, deren Befolgung Gesundheitsschäden verursachen kann. (d) Mit dem Veröffentlichen räumst du uns das einfache, widerrufliche Recht ein, deine Inhalte auf Culinse darzustellen und technisch zu verarbeiten (z. B. Bildgrößen, Übersetzung); deine Urheberrechte bleiben bei dir. (e) Wir übernehmen fremde Inhalte nicht als eigene; sie sind als Community-Inhalte gekennzeichnet. (f) Hinweise auf Rechtsverletzungen kannst du uns jederzeit per E-Mail melden (siehe Impressum); gemeldete Inhalte prüfen wir und entfernen oder sperren sie bei Verstößen unverzüglich. Bei wiederholten oder schweren Verstößen können wir Inhalte entfernen und Konten sperren.",
  },
  {
    t: "7. Unsere Inhalte, KI-Kennzeichnung und Schätzwerte",
    b: "Ein Teil der Culinse-Rezepte entsteht mit KI-Unterstützung und wird redaktionell geprüft; diese Rezepte sind auf der Rezeptseite entsprechend gekennzeichnet (siehe KI-Transparenz). Preis- und Nährwertangaben sind unverbindliche algorithmische Schätzungen. Culinse bietet keine Ernährungs-, Gesundheits- oder Allergieberatung; prüfe Zutaten bei Allergien oder Unverträglichkeiten stets selbst.",
    link: { href: "/ki-transparenz", label: "Zur KI-Transparenz" },
  },
  {
    t: "8. Verfügbarkeit und Weiterentwicklung",
    b: "Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes, schulden aber keine ununterbrochene Erreichbarkeit; Wartungsarbeiten und Störungen können zu vorübergehenden Einschränkungen führen. Wir dürfen den Dienst weiterentwickeln und Funktionen ändern, soweit dies für dich zumutbar ist und vertraglich zugesagte Kernfunktionen von Culinse Pro erhalten bleiben.",
  },
  {
    t: "9. Haftung",
    b: "Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt. Für Inhalte von Nutzern haften wir erst ab Kenntnis eines konkreten Rechtsverstoßes nach Maßgabe der gesetzlichen Regelungen.",
  },
  {
    t: "10. Datenschutz",
    b: "Informationen zur Verarbeitung personenbezogener Daten findest du in der Datenschutzerklärung.",
    link: { href: "/datenschutz", label: "Zur Datenschutzerklärung" },
  },
  {
    t: "11. Änderungen dieser AGB",
    b: "Wir können diese AGB mit Wirkung für die Zukunft anpassen, wenn dafür ein triftiger Grund besteht (z. B. Gesetzesänderungen, neue Funktionen) und die Änderung dich nicht unangemessen benachteiligt. Über wesentliche Änderungen informieren wir registrierte Nutzer in Textform mit angemessener Frist; widersprichst du nicht oder nutzt du den Dienst weiter, gelten die neuen AGB. Auf dein Widerspruchsrecht und die Folgen weisen wir in der Mitteilung hin.",
  },
  {
    t: "12. Schlussbestimmungen",
    b: "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts; zwingende Verbraucherschutzvorschriften deines gewöhnlichen Aufenthaltsstaats bleiben unberührt. Zur Teilnahme an einem Verbraucherschlichtungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt der Vertrag im Übrigen wirksam.",
  },
];

const EN_SECTIONS: Sec[] = [
  {
    t: "1. Scope and provider",
    b: "These terms of service govern the use of the Culinse platform (culinse.com) including all subpages and features. The provider is the operator named in the legal notice.",
    link: { href: "/impressum", label: "Legal notice" },
  },
  {
    t: "2. Services",
    b: "Culinse is a recipe and meal-planning service. The basic offering (discovering recipes, search, saving recipes, one collection, the grocery calculator) is free. Culinse Pro adds the full weekly planner, automatic shopping lists, unlimited collections and further features. Scope and prices are shown on the Pro page before you subscribe.",
  },
  {
    t: "3. Registration and account",
    b: "Some features require a free account. You must provide accurate information, keep your credentials confidential and notify us immediately of any misuse of your account. You must be at least 16 years old. There is no entitlement to registration.",
  },
  {
    t: "4. Culinse Pro: prices, term, cancellation",
    b: "Culinse Pro is a subscription with a monthly or annual term; the applicable price is shown before checkout. New subscriptions start with a 7-day free trial; only after the trial ends is the selected price charged via our payment provider Stripe. If you cancel during the trial, nothing is charged. The subscription renews automatically for the respective term unless cancelled before the end of the current period via your profile (manage subscription). You can cancel at any time effective at the end of the current period; fees already paid for the current period are not refunded, and your Pro access remains active until the period ends.",
  },
  {
    t: "5. Right of withdrawal",
    b: "Consumers have a statutory 14-day right of withdrawal. Details, consequences and the model withdrawal form can be found in our cancellation policy.",
    link: { href: "/widerruf", label: "Cancellation policy" },
  },
  {
    t: "6. Your content (community recipes)",
    b: "You can publish your own recipes with photos. The following applies: (a) You warrant that you hold all necessary rights to the content you upload (texts, photos) and that no third-party rights are infringed — copying recipe texts or photos from other sites is prohibited. (b) You are responsible for your content; this also applies if you created it with AI tools. We welcome voluntary transparency for AI-created content. (c) Unlawful, misleading or dangerous content is prohibited, in particular instructions that may cause harm to health if followed. (d) By publishing, you grant us a simple, revocable right to display your content on Culinse and to process it technically (e.g. image sizes, translation); your copyright remains with you. (e) We do not adopt third-party content as our own; it is labelled as community content. (f) You can report legal violations to us by email at any time (see legal notice); we review reported content and remove or block it without undue delay in case of violations. In case of repeated or serious violations we may remove content and suspend accounts.",
  },
  {
    t: "7. Our content, AI labelling and estimates",
    b: "Some Culinse recipes are created with AI assistance and are editorially reviewed; these recipes are labelled on the recipe page (see AI transparency). Price and nutrition figures are non-binding algorithmic estimates. Culinse does not provide nutrition, health or allergy advice; always check ingredients yourself if you have allergies or intolerances.",
    link: { href: "/ki-transparenz", label: "AI transparency" },
  },
  {
    t: "8. Availability and changes to the service",
    b: "We aim for high availability but do not owe uninterrupted access; maintenance and outages may lead to temporary restrictions. We may develop the service further and change features to the extent reasonable for you, provided the contractually promised core features of Culinse Pro are preserved.",
  },
  {
    t: "9. Liability",
    b: "We are liable without limitation for intent and gross negligence and for injury to life, body and health. In cases of slight negligence we are liable only for the breach of essential contractual obligations, limited to the foreseeable damage typical for this type of contract. Liability under product liability law remains unaffected. For user content we are liable only from the moment we obtain knowledge of a specific infringement, in accordance with statutory rules.",
  },
  {
    t: "10. Privacy",
    b: "Information on the processing of personal data can be found in our privacy policy.",
    link: { href: "/datenschutz", label: "Privacy policy" },
  },
  {
    t: "11. Changes to these terms",
    b: "We may amend these terms with effect for the future where there is a valid reason (e.g. changes in law, new features) and the amendment does not unreasonably disadvantage you. We will inform registered users of material changes in text form with reasonable notice; if you do not object or continue using the service, the new terms apply. The notification will point out your right to object and the consequences.",
  },
  {
    t: "12. Final provisions",
    b: "German law applies, excluding the UN Convention on Contracts for the International Sale of Goods; mandatory consumer-protection rules of your country of habitual residence remain unaffected. We are neither obliged nor willing to participate in dispute-resolution proceedings before a consumer arbitration board. Should individual provisions of these terms be invalid, the remainder of the contract remains effective.",
  },
];

export default async function Agb({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const de = locale === "de";
  const sections = de ? DE_SECTIONS : EN_SECTIONS;

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/${locale}`} className="flex items-center w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "24px", width: "auto" }} />
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {de ? "Allgemeine Geschäftsbedingungen" : "Terms of Service"}
        </h1>
        <p className="text-gray-600 leading-relaxed mb-10">
          {de
            ? "Diese Bedingungen regeln die Nutzung von Culinse — kurz, verständlich und ohne Kleingedrucktes im Kleingedruckten."
            : "These terms govern the use of Culinse — short, understandable, and without fine print hidden in the fine print."}
        </p>
        {sections.map((s) => (
          <section key={s.t} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{s.t}</h2>
            <p className="text-gray-600 leading-relaxed">
              {s.b}
              {s.link && (
                <>
                  {" "}
                  <Link href={`/${locale}${s.link.href}`} className="underline hover:text-orange-500">
                    {s.link.label}
                  </Link>
                  .
                </>
              )}
            </p>
          </section>
        ))}
        <p className="text-xs text-gray-400">
          {de ? "Stand: August 2026" : "Last updated: August 2026"}
        </p>
      </main>
    </div>
  );
}
