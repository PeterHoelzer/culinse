import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Seite nicht gefunden · Page not found",
};

// Bewusst OHNE next-intl: not-found.tsx erhält keine params, und
// getTranslations ohne explizite Locale warf hier in Produktion einen 500 —
// jeder unbekannte Blog-Slug lieferte "Internal Server Error" statt 404
// (Soft-Error-Signale an Google, SEO-Runde 17.08). Statisch + zweisprachig
// kann nicht crashen. Link bewusst via next/link auf "/" (Root leitet zur
// Locale weiter) statt @/lib/navigation, das ebenfalls Locale-Kontext braucht.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <nav className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-content items-center px-4 sm:px-6">
          {/* Statische Wortmarke: kein next-intl-Kontext nötig (siehe Hinweis oben) */}
          <Link href="/" aria-label="Culinse" className="text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">
            culi<span className="text-brand">nse</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-prose flex-1 items-center px-4 py-12 sm:px-6">
        <EmptyState
          className="w-full"
          icon="utensils"
          title={<span role="heading" aria-level={1} className="block font-serif text-h1-sm sm:text-h1">Seite nicht gefunden · Page not found</span>}
          text="Diese Seite existiert nicht (mehr). This page does not exist (anymore)."
          action={
            <Link href="/" className={buttonClasses({})}>
              Zur Startseite · Back home
            </Link>
          }
        />
      </main>
    </div>
  );
}
