import Link from "next/link";
import { copperCityLocales, privacyPath, supportPath } from "@/lib/copper-city";

/**
 * Sprachübersicht unter den Copper-City-Seiten: ein Link pro Sprache,
 * die aktuelle Sprache ohne Link. kind entscheidet, ob auf Support- oder
 * Datenschutzseiten verlinkt wird.
 */
export default function LanguageLinks({
  kind,
  current,
  label,
}: {
  kind: "support" | "privacy";
  current: string | string[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
      <p className="mb-2">{label}:</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {copperCityLocales.map((l) => {
          const href = kind === "support" ? supportPath(l.code) : privacyPath(l.code);
          const isCurrent = Array.isArray(current) ? current.includes(l.code) : l.code === current;
          return (
            <li key={l.code} lang={l.htmlLang}>
              {isCurrent ? (
                <span className="font-semibold text-gray-800">{l.support.languageName}</span>
              ) : (
                <Link href={href} className="text-orange-500 hover:underline">
                  {l.support.languageName}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
