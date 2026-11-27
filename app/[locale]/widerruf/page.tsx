import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/ui/Wordmark";

// Widerrufsbelehrung fuer die Nutzung von Culinse mit einem kostenlosen Konto
// (Verbraucher, digitale Dienstleistung). Seit 25.11.2026 gibt es kein Abo und
// keine Zahlungen mehr; seit 27.11.2026 steht hier nichts mehr zu Culinse Pro.
// Ob die Seite ohne Bezahlangebot ueberhaupt bleiben soll, entscheidet Peter;
// der Abschnitt "Folgen des Widerrufs" weicht vom gesetzlichen Muster ab, weil
// es nichts zurueckzuzahlen gibt (Pruefung durch Generator/Anwalt empfohlen).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const de = locale === "de";
  return {
    title: de ? "Widerrufsbelehrung" : "Cancellation Policy",
    description: de
      ? "Widerrufsbelehrung und Muster-Widerrufsformular für das kostenlose Konto bei Culinse."
      : "Right of withdrawal and model withdrawal form for the free Culinse account.",
    alternates: {
      canonical: `https://culinse.com/${locale}/widerruf`,
      languages: {
        en: "https://culinse.com/en/widerruf",
        de: "https://culinse.com/de/widerruf",
        "x-default": "https://culinse.com/en/widerruf",
      },
    },
  };
}

export default async function Widerruf({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const de = locale === "de";

  const formular = de
    ? `Muster-Widerrufsformular

(Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es zurück.)

An: Culinse — Betreiber siehe Impressum, E-Mail: peter@hoelzer.xyz

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: Nutzung von Culinse (kostenloses Konto)

Bestellt am (*)/erhalten am (*):
Name des/der Verbraucher(s):
Anschrift des/der Verbraucher(s):
Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
Datum:

(*) Unzutreffendes streichen.`
    : `Model withdrawal form

(If you wish to withdraw from the contract, please fill in this form and send it back.)

To: Culinse — operator see legal notice, email: peter@hoelzer.xyz

I/we (*) hereby withdraw from the contract concluded by me/us (*) for the provision of the following service: use of Culinse (free account)

Ordered on (*)/received on (*):
Name of consumer(s):
Address of consumer(s):
Signature of consumer(s) (only if this form is notified on paper):
Date:

(*) Delete as appropriate.`;

  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-line px-4 py-4">
        <div className="max-w-prose mx-auto">
          <Wordmark />
        </div>
      </nav>
      <main className="max-w-prose mx-auto px-4 py-12">
        <h1 className="text-h1-sm sm:text-h1 mb-6">
          {de ? "Widerrufsbelehrung" : "Cancellation Policy"}
        </h1>
        <p className="text-base text-ink leading-relaxed mb-10">
          {de
            ? "Culinse ist für alle kostenlos; es gibt kein Abo, und es fallen keine Zahlungen an. Diese Widerrufsbelehrung gilt für die Nutzung von Culinse mit einem kostenlosen Konto."
            : "Culinse is free for everyone; there is no subscription and no payments are due. This cancellation policy applies to using Culinse with a free account."}
        </p>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">
            {de ? "Widerrufsrecht" : "Right of withdrawal"}
          </h2>
          <p className="text-base text-ink leading-relaxed">
            {de
              ? "Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses. Um dein Widerrufsrecht auszuüben, musst du uns (Culinse, Betreiber siehe Impressum, E-Mail: peter@hoelzer.xyz) mittels einer eindeutigen Erklärung (z. B. E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest."
              : "You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the day the contract is concluded. To exercise your right of withdrawal, you must inform us (Culinse, operator see legal notice, email: peter@hoelzer.xyz) of your decision to withdraw from this contract by an unequivocal statement (e.g. an email). You may use the attached model withdrawal form, but it is not obligatory. To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired."}
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">
            {de ? "Folgen des Widerrufs" : "Effects of withdrawal"}
          </h2>
          <p className="text-base text-ink leading-relaxed">
            {de
              ? "Wenn du diesen Vertrag widerrufst, endet deine Nutzung von Culinse mit einem Konto. Culinse ist kostenlos: Wir haben von dir keine Zahlungen erhalten, es ist deshalb nichts zurückzuzahlen, und du schuldest uns auch für die bis dahin genutzte Zeit nichts. Dein Konto und die darin gespeicherten Daten löschen wir nach deinem Widerruf."
              : "If you withdraw from this contract, your use of Culinse with an account ends. Culinse is free: we have not received any payments from you, so there is nothing to reimburse, and you owe us nothing for the time you have already used the service. After your withdrawal we delete your account and the data stored in it."}
          </p>
        </section>

        <section>
          <h2 className="text-h2-sm mt-10 mb-3">
            {de ? "Muster-Widerrufsformular" : "Model withdrawal form"}
          </h2>
          <div className="border border-line rounded-2 p-5 text-base text-ink leading-relaxed whitespace-pre-line bg-surface-soft">
            {formular}
          </div>
        </section>

        <p className="text-base text-ink leading-relaxed mb-10">
          {de ? "Siehe auch unsere " : "See also our "}
          <Link href={`/${locale}/agb`} className="underline underline-offset-[3px] hover:text-brand">
            {de ? "AGB" : "Terms of Service"}
          </Link>
          .
        </p>

        <p className="text-caption text-ink-3">
          {de ? "Stand: November 2026" : "Last updated: November 2026"}
        </p>
      </main>
    </div>
  );
}
