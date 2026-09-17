// Supabase Storage liefert Original-Uploads (oft ~800 KB) aus. Fuer die Anzeige
// biegen wir public-Object-URLs auf die Render-/Transformations-API um --
// gleiche Datei, serverseitig skaliert (Messung 27.07.: 822 KB -> 138 KB bei
// width=828).
// 17.09.26: height=width + resize=contain ergaenzt -- nur width liess die
// Render-API die Originalhoehe stehen (1600x893 -> 1200x893 = seitlich
// beschnitten, KI-Kennzeichnung in Gefahr). contain skaliert IMMER proportional
// auf die laengste Seite; Karten croppen weiter selbst via CSS. Fremde Hosts (Spoonacular, Tasty, ...) laufen unveraendert durch.
const SUPA_OBJECT = "/storage/v1/object/public/";
const SUPA_RENDER = "/storage/v1/render/image/public/";

export function optimizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 75
): string | null {
  if (!url) return null;
  if (!url.includes(SUPA_OBJECT)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return url.replace(SUPA_OBJECT, SUPA_RENDER) + `${sep}width=${width}&height=${width}&resize=contain&quality=${quality}`;
}
