import {
  AFFILIATE_PRODUCTS,
  getAffiliateUrl,
  getToolsForRecipe,
  trackedUrl,
  type AffiliateProduct,
} from "@/lib/affiliateProducts";

/**
 * Affiliate-Empfehlungsbox für Blog-Artikel (Server-Komponente, kein JS-Bundle).
 *
 * Matching: versucht zuerst kontextuelle Tools über den Artikel-Haystack
 * (Titel + Kategorie + Headings, gleiche Logik wie auf Rezeptseiten).
 * Liefert das Matching < 2 Treffer, fällt die Box auf drei Evergreen-
 * Essentials zurück (Messer, Pfanne, Waage) — breit relevant für jedes
 * Koch-Thema, statt gar nichts zu zeigen.
 *
 * Kennzeichnung: sichtbares "Werbung"-Badge + rel="sponsored".
 * Alle Klicks laufen über /api/out (source: "blog").
 */

const FALLBACK_NAMES = ["Kochmesser", "Gusseisenpfanne", "Küchenwaage"];

interface Props {
  title: string;
  category: string;
  headings: string[];
  locale: string;
}

export default function BlogAffiliateBox({ title, category, headings, locale }: Props) {
  const de = locale === "de";

  let products: AffiliateProduct[] = getToolsForRecipe(
    [category],
    [],
    `${title} ${headings.join(" ")}`
  );

  if (products.length < 2) {
    products = AFFILIATE_PRODUCTS.filter((p) => FALLBACK_NAMES.includes(p.name));
  }

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {de ? "Küchen-Empfehlungen der Redaktion" : "Kitchen picks from the editor"}
        </h3>
        <span className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5">
          {de ? "Werbung" : "Ad"}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {products.slice(0, 3).map((p) => (
          <a
            key={p.name}
            href={trackedUrl(getAffiliateUrl(p), "blog")}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:bg-orange-50/40 transition-colors group"
          >
            <span className="text-2xl">{p.emoji}</span>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors mt-2 leading-snug">
              {p.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{p.price} · Amazon</p>
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-4">
        {de
          ? "Als Amazon-Partner verdienen wir an qualifizierten Käufen — für dich ändert sich der Preis nicht."
          : "As an Amazon Associate we earn from qualifying purchases — the price stays the same for you."}
      </p>
    </div>
  );
}
