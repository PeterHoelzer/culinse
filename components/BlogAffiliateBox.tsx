import { buttonClasses, Icon } from "@/components/ui";
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
 * Matching: `productNames` (12.10.2026) erlaubt dem Artikel eine explizite,
 * kuratierte Produktliste (Name-Match gegen AFFILIATE_PRODUCTS, Reihenfolge =
 * Anzeige) — genutzt von den Kochschul-Artikeln (Messer/Bretter/Schärfen).
 * Ohne `productNames`: kontextuelle Tools über den Artikel-Haystack
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
  /** Explizite Produktauswahl (AffiliateProduct.name), überstimmt das Matching. */
  productNames?: string[];
}

export default function BlogAffiliateBox({ title, category, headings, locale, productNames }: Props) {
  const de = locale === "de";

  let products: AffiliateProduct[];
  if (productNames && productNames.length > 0) {
    const byName = new Map(AFFILIATE_PRODUCTS.map((p) => [p.name, p]));
    products = productNames
      .map((n) => byName.get(n))
      .filter((p): p is AffiliateProduct => Boolean(p));
  } else {
    products = getToolsForRecipe([category], [], `${title} ${headings.join(" ")}`);
    if (products.length < 2) {
      products = AFFILIATE_PRODUCTS.filter((p) => FALLBACK_NAMES.includes(p.name));
    }
  }

  if (products.length === 0) return null;

  return (
    <aside className="mb-12 rounded-2 border border-line p-6">
      <h2 className="mb-1 text-h3 text-ink">
        {de ? "Küchen-Empfehlungen der Redaktion" : "Kitchen picks from the editor"}
      </h2>
      <p className="mb-5 text-caption text-ink-3">{de ? "Werbung · Affiliate-Link" : "Ad · Affiliate link"}</p>

      <ul className="grid gap-4 sm:grid-cols-3">
        {products.slice(0, 9).map((p) => (
          <li key={p.name} className="flex flex-col justify-between gap-3 rounded-2 bg-surface-soft p-4">
            <div>
              <p className="font-semibold leading-snug text-ink">{p.name}</p>
              <p className="mt-0.5 text-sm text-ink-3">{p.price} · Amazon</p>
            </div>
            {/* Plain <a>: /api/out ist kein lokalisierter Pfad (kein i18n-Link). */}
            <a
              href={trackedUrl(getAffiliateUrl(p), "blog")}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={buttonClasses({ variant: "secondary", size: "sm", className: "self-start" })}
            >
              {de ? "Ansehen" : "View"}
              <Icon name="externalLink" size={16} />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-caption text-ink-3">
        {de
          ? "Als Amazon-Partner verdienen wir an qualifizierten Käufen. Für dich ändert sich der Preis nicht."
          : "As an Amazon Associate we earn from qualifying purchases. The price stays the same for you."}
      </p>
    </aside>
  );
}
