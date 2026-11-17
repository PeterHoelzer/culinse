import { revalidateTag } from "next/cache";
import { purgeRecipeAtCloudflare } from "@/lib/cloudflareCache";

/*
  Zwischenspeicher der Rezeptseiten (Kostenbremse 16.11.2026).

  Eine Rezeptseite bleibt 30 Tage im Cache. Vorher lief sie nach 12 Stunden ab;
  bei rund 70.000 Seiten und Bots, die alles abholen, hieß das 40.000 Neuaufbauten
  am Tag (je drei Funktionsaufrufe, sechs bis zwölf Datenbankabfragen).

  Ändert sich ein Rezept, wird seine Seite gezielt erneuert: jede Stelle in der
  App, die ein Rezept schreibt, ruft refreshRecipePage auf. Skripte, die direkt
  in die Datenbank schreiben, erreichen den Cache nicht. Nach einer solchen
  Korrektur die Versionsnummer im Abruf der Rezeptseite hochzählen
  (app/[locale]/recipe/[id]/page.tsx, "?v=") und ausliefern.

  Seit 17.11.2026 speichert auch Cloudflare die Rezeptseiten. Deshalb zwei Dinge:
  - Die Seite läuft sofort ab ({ expire: 0 }) statt mit "max". Mit "max" bekäme
    der nächste Abruf noch einmal die alte Seite (und erst der übernächste die
    neue); Cloudflare würde genau diese alte Fassung für 30 Tage einlagern.
  - Danach werden die Adressen des Rezepts bei Cloudflare geleert
    (lib/cloudflareCache.ts).
*/

/** 30 Tage in Sekunden. In `export const revalidate` muss die Zahl selbst stehen. */
export const RECIPE_TTL = 2592000;

/** Cache-Schlüssel einer Rezeptseite; `pageId` ist die ID aus der Adresse (user_<uuid>). */
export function recipeTag(pageId: string): string {
  return `recipe-${pageId}`;
}

/** Erneuert die Seite eines Rezepts beim nächsten Abruf; `uuid` ist die ID der Datenbankzeile. */
export function refreshRecipePage(uuid: string): void {
  const pageId = `user_${uuid}`;
  revalidateTag(recipeTag(pageId), { expire: 0 });
  purgeRecipeAtCloudflare(pageId);
}
