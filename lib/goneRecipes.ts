/*
  Alte Rezeptadressen fremder Anbieter (25.11.2026).

  Bis 13.09.2026 gab es Rezepte von Spoonacular, TheMealDB, Edamam und Tasty,
  zum Beispiel /de/recipe/715467. Seitdem gibt es nur noch eigene Rezepte, deren
  ID mit "user_" beginnt. Die alten Adressen kommen nicht wieder.

  Sie antworteten bisher mit 404 ("nicht gefunden"). Die Search Console führte
  am 25.11.2026 noch 15 davon im Index und rund 85 in den Listen der
  abgelehnten Seiten. 410 ("dauerhaft entfernt") sagt Suchmaschinen deutlicher,
  dass sie die Adresse streichen und nicht wieder abrufen sollen.

  Die Antwort kommt aus middleware.ts, weil eine Seite in Next.js nur 404
  auslösen kann (notFound), nicht 410.
*/

const RECIPE_PATH = /^\/([a-z]{2})\/recipe\/([^/]+)\/?$/;
// Spoonacular und TheMealDB: nur Ziffern. Edamam und Tasty: fester Vorsatz.
const OLD_PROVIDER_ID = /^(?:\d+|(?:edamam|tasty|mealdb)_.+)$/;

/** Sprache der Adresse, wenn sie zu einem alten Anbieter-Rezept gehört; sonst null. */
export function goneRecipeLocale(pathname: string): string | null {
  const match = pathname.match(RECIPE_PATH);
  if (!match) return null;
  return OLD_PROVIDER_ID.test(match[2]) ? match[1] : null;
}

/** Kleine Seite für Menschen, die noch über einen alten Link kommen. */
export function goneRecipeResponse(locale: string): Response {
  const de = locale === "de";
  const title = de ? "Dieses Rezept gibt es nicht mehr" : "This recipe is no longer available";
  const text = de
    ? "Die Adresse gehört zu einem Rezept, das wir entfernt haben."
    : "This address belonged to a recipe we have removed.";
  const link = de ? "Alle Rezepte ansehen" : "Browse all recipes";
  const html = `<!doctype html>
<html lang="${de ? "de" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | Culinse</title>
<style>
body{box-sizing:border-box;margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7f2;color:#23201c;font-family:Georgia,"Times New Roman",serif;padding:24px}
main{max-width:28rem;text-align:center}
h1{font-size:1.5rem;margin:0 0 .75rem}
p{font-family:system-ui,sans-serif;margin:0 0 1.5rem;color:#5c564e}
a{font-family:system-ui,sans-serif;color:#bf4a14;font-weight:600}
</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p>${text}</p>
<a href="/${locale}/recipes">${link}</a>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Die Antwort ändert sich nicht mehr; ein Tag im Zwischenspeicher genügt.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
