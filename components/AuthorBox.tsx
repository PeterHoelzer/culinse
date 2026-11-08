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
 *
 * Gestaltung nach DESIGN.md: weiße Fläche mit Linie, Serifen-Titel, keine
 * Verläufe, kein Pfeil im Link.
 */
export default function AuthorBox({ locale }: { locale: string }) {
  const isDE = locale === "de";

  return (
    <aside className="mb-10 flex items-start gap-5 rounded-2 border border-line p-6">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-brand-soft font-serif text-h3 font-semibold text-brand"
        aria-hidden="true"
      >
        P
      </div>
      <div className="min-w-0">
        <p className="font-serif text-h3 text-ink">
          {isDE ? "Geschrieben von Peter Hölzer" : "Written by Peter Hölzer"}
        </p>
        <p className="mt-1 text-sm text-ink-3">
          {isDE
            ? "Küchenchef · Fleischermeister · Gründer von Culinse"
            : "Head Chef · German Master Butcher · Founder of Culinse"}
        </p>
        <p className="mt-3 max-w-prose text-base text-ink-2">
          {isDE
            ? "Peter hat als Küchenchef in Restaurants in ganz Deutschland gekocht und 2024 seinen Meistertitel im Fleischerhandwerk erworben, die höchste Qualifikation des Handwerks. Auf Culinse teilt er, was in echten Küchen funktioniert."
            : "Peter cooked as a head chef in restaurants across Germany and earned his Fleischermeister title (German master butcher, the trade's highest qualification) in 2024. On Culinse he shares what actually works in real kitchens."}
        </p>
        <Link
          href={`/${locale}/about`}
          className="mt-3 inline-block text-base font-semibold text-brand underline underline-offset-[3px] transition-colors hover:text-brand-hover"
        >
          {isDE ? "Mehr über Peter" : "More about Peter"}
        </Link>
      </div>
    </aside>
  );
}
