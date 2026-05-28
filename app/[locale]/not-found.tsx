import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("error");
  return { title: t("notFound") };
}

export default async function NotFound() {
  const t = await getTranslations("error");

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
        <p className="text-xl text-gray-500 mb-2">{t("notFound")}</p>
        <p className="text-gray-400 mb-10">{t("notFoundSub")}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#f97316" }}
        >
          {t("backHome")} →
        </Link>
      </div>
    </div>
  );
}
