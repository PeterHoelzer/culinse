import type { Metadata } from "next";
import Link from "next/link";

// Widerrufsbelehrung fuer das Culinse-Pro-Abo (Verbraucher, digitale Dienstleistung).

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
      ? "Widerrufsbelehrung und Muster-Widerrufsformular für Culinse Pro."
      : "Right of withdrawal and model withdrawal form for Culinse Pro.",
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

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: Culinse Pro

Bestellt am (*)/erhalten am (*):
Name des/der Verbraucher(s):
Anschrift des/der Verbraucher(s):
Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
Datum:

(*) Unzutreffendes streichen.`
    : `Model withdrawal form

(If you wish to withdraw from the contract, please fill in this form and send it back.)

To: Culinse — operator see legal notice, email: peter@hoelzer.xyz

I/we (*) hereby withdraw from the contract concluded by me/us (*) for the provision of the following service: Culinse Pro

Ordered on (*)/received on (*):
Name of consumer(s):
Address of consumer(s):
Signature of consumer(s) (only if this form is notified on paper):
Date:

(*) Delete as appropriate.`;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-10">
          {de ? "Widerrufsbelehrung" : "Cancellation Policy"}
        </h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Widerrufsrecht" : "Right of withdrawal"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses. Um dein Widerrufsrecht auszuüben, musst du uns (Culinse, Betreiber siehe Impressum, E-Mail: peter@hoelzer.xyz) mittels einer eindeutigen Erklärung (z. B. E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest."
              : "You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the day the contract is concluded. To exercise your right of withdrawal, you must inform us (Culinse, operator see legal notice, email: peter@hoelzer.xyz) of your decision to withdraw from this contract by an unequivocal statement (e.g. an email). You may use the attached model withdrawal form, but it is not obligatory. To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Folgen des Widerrufs" : "Effects of withdrawal"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet. Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zur Mitteilung des Widerrufs bereits erbrachten Dienstleistung im Vergleich zum Gesamtumfang der vorgesehenen Dienstleistung entspricht."
              : "If you withdraw from this contract, we shall reimburse all payments received from you without undue delay and at the latest within fourteen days from the day on which we received notice of your withdrawal. We will use the same means of payment as you used for the initial transaction, unless expressly agreed otherwise with you; in no event will you be charged any fees for this reimbursement. If you requested that the service begin during the withdrawal period, you shall pay us a reasonable amount corresponding to the proportion of the service already provided up to the time you notified us of the withdrawal, compared with the full scope of the contracted service."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Hinweis zur Testphase" : "Note on the free trial"}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {de
              ? "Culinse Pro beginnt mit einer 7-tägigen kostenlosen Testphase; abgebucht wird erst nach deren Ende. Kündigst du innerhalb der Testphase über dein Profil, entstehen keine Kosten — unabhängig vom Widerrufsrecht, das dir daneben zusteht."
              : "Culinse Pro starts with a 7-day free trial; you are only charged after it ends. If you cancel during the trial via your profile, nothing is charged — independently of your statutory right of withdrawal, which exists alongside."}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {de ? "Muster-Widerrufsformular" : "Model withdrawal form"}
          </h2>
          <div className="border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50">
            {formular}
          </div>
        </section>

        <p className="text-gray-600 leading-relaxed mb-10">
          {de ? "Siehe auch unsere " : "See also our "}
          <Link href={`/${locale}/agb`} className="underline hover:text-orange-500">
            {de ? "AGB" : "Terms of Service"}
          </Link>
          .
        </p>

        <p className="text-xs text-gray-400">
          {de ? "Stand: August 2026" : "Last updated: August 2026"}
        </p>
      </main>
    </div>
  );
}
