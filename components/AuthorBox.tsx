import Link from "next/link";

/**
 * Visible author box for blog articles (E-E-A-T).
 *
 * Google's quality guidance for food/health-adjacent content strongly favors
 * verifiable human expertise. Peter's credentials (head chef, and since 2024
 * Fleischermeister — German master butcher) are the site's strongest trust
 * signal, so every article shows who wrote it and links to the About page.
 * The same person is emitted as schema.org Person in the Article JSON-LD
 * (see app/[locale]/blog/[slug]/page.tsx) — keep both in sync.
 */
export default function AuthorBox({ locale }: { locale: string }) {
  const isDE = locale === "de";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10 flex items-start gap-4">
      <div
        className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
        style={{ background: "#f97316" }}
        aria-hidden="true"
      >
        P
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">
          {isDE ? "Geschrieben von Peter Hölzer" : "Written by Peter Hölzer"}
        </p>
        <p className="text-xs font-medium text-orange-500 mb-2">
          {isDE
            ? "Küchenchef · Fleischermeister · Gründer von Culinse"
            : "Head Chef · German Master Butcher · Founder of Culinse"}
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          {isDE
            ? "Peter hat als Küchenchef in Restaurants in ganz Deutschland gekocht und 2024 seinen Meistertitel im Fleischerhandwerk erworben — die höchste Qualifikation des Handwerks. Auf Culinse teilt er, was in echten Küchen funktioniert."
            : "Peter cooked as a head chef in restaurants across Germany and earned his Fleischermeister title (German master butcher, the trade's highest qualification) in 2024. On Culinse he shares what actually works in real kitchens."}
        </p>
        <Link
          href={`/${locale}/about`}
          className="text-sm font-medium text-orange-500 hover:underline"
        >
          {isDE ? "Mehr über Peter →" : "More about Peter →"}
        </Link>
      </div>
    </div>
  );
}
