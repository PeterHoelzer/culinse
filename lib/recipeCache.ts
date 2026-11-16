import { revalidateTag } from "next/cache";

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
*/

/** 30 Tage in Sekunden. In `export const revalidate` muss die Zahl selbst stehen. */
export const RECIPE_TTL = 2592000;

/** Cache-Schlüssel einer Rezeptseite; `pageId` ist die ID aus der Adresse (user_<uuid>). */
export function recipeTag(pageId: string): string {
  return `recipe-${pageId}`;
}

/** Erneuert die Seite eines Rezepts beim nächsten Abruf; `uuid` ist die ID der Datenbankzeile. */
export function refreshRecipePage(uuid: string): void {
  revalidateTag(recipeTag(`user_${uuid}`), "max");
}
