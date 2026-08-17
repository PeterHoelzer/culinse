import type { Metadata } from "next";
import Link from "next/link";

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
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center">
            <img src="/culinse-logo.png" alt="culinse" style={{ height: "24px", width: "auto" }} />
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl mb-6">🍳</div>
        <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-xl text-gray-500 mb-2">Seite nicht gefunden · Page not found</p>
        <p className="text-gray-400 mb-10">
          Diese Seite existiert nicht (mehr). · This page does not exist (anymore).
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#f97316" }}
        >
          Zur Startseite · Back home →
        </Link>
      </div>
    </div>
  );
}
