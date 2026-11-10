import { CULINSE_OWNER_ID } from "./culinse";

// Bilder für die Anzeige verkleinern.
//
// Feste Fassungen (seit 10.11.2026): Für die Rezeptbilder des eigenen Korpus
// (<owner>/papa/) liegen verkleinerte Dateien im Bildspeicher unter
// recipe-media/_sized/<breite>/<pfad des originals>. Sie werden von
// scripts/sized-images.mjs und von der Bilder-Werkstatt (lib/sizedImages.ts)
// erzeugt. Vorher ließ die Seite jedes Bild von Supabase verkleinern
// (render/image); das ist im Tarif auf 100 Bilder im Monat begrenzt, der
// Korpus hat über 3.000.
//
// Alle anderen Supabase-Bilder (Uploads aus dem Rezept-Editor, Entwürfe des
// Rezept-Agenten) laufen weiter über die Render-API. Das sind so wenige, dass
// das Freikontingent reicht.
// 17.09.26: height=width + resize=contain -- nur width liess die Render-API
// die Originalhoehe stehen (seitlich beschnitten, KI-Kennzeichnung in Gefahr).
// Fremde Hosts laufen unveraendert durch.
const SUPA_OBJECT = "/storage/v1/object/public/";
const SUPA_RENDER = "/storage/v1/render/image/public/";
const BUCKET = "recipe-media/";
const SIZED_DIR = "_sized/";

/** Breiten der festen Fassungen (längste Seite in Pixeln). Auch in scripts/sized-images.mjs. */
export const SIZED_WIDTHS = [640, 1280] as const;

/** Ordner, für den feste Fassungen gepflegt werden. */
const SIZED_FOLDER = `${SUPA_OBJECT}${BUCKET}${CULINSE_OWNER_ID}/papa/`;

/** Pfad einer festen Fassung im Bucket, z. B. _sized/640/<owner>/papa/bild.jpg. */
export function sizedPath(path: string, width: number): string {
  return `${SIZED_DIR}${width}/${path}`;
}

/** Hat dieses Bild feste Fassungen? Gilt für die Originaladresse ohne Parameter. */
export function hasSizedVariants(url: string): boolean {
  return url.includes(SIZED_FOLDER);
}

/** Zeigt die Adresse schon auf eine feste Fassung? */
export function isSizedUrl(url: string): boolean {
  return url.includes(`${SUPA_OBJECT}${BUCKET}${SIZED_DIR}`);
}

/** Feste Fassung in einer bestimmten Breite, ausgehend von Original oder anderer Fassung. */
export function sizedImageUrl(url: string, width: (typeof SIZED_WIDTHS)[number]): string {
  const original = originalImageUrl(url);
  return original.replace(`${SUPA_OBJECT}${BUCKET}`, `${SUPA_OBJECT}${BUCKET}${SIZED_DIR}${width}/`);
}

/** Adresse des Originals, egal ob feste Fassung, Render-Adresse oder schon das Original. */
export function originalImageUrl(url: string): string {
  let out = url;
  if (out.includes(SUPA_RENDER)) out = out.replace(SUPA_RENDER, SUPA_OBJECT).replace(/\?.*$/, "");
  return out.replace(new RegExp(`(${SUPA_OBJECT}${BUCKET})${SIZED_DIR}\\d+/`), "$1");
}

export function optimizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 75
): string | null {
  if (!url) return null;
  if (!url.includes(SUPA_OBJECT)) return url;
  if (isSizedUrl(url)) return url;
  if (hasSizedVariants(url)) {
    // Kleinste Fassung, die mindestens so breit ist wie verlangt; darüber die größte.
    const fit = SIZED_WIDTHS.find((w) => w >= width) ?? SIZED_WIDTHS[SIZED_WIDTHS.length - 1];
    return sizedImageUrl(url.replace(/\?.*$/, ""), fit);
  }
  const sep = url.includes("?") ? "&" : "?";
  return url.replace(SUPA_OBJECT, SUPA_RENDER) + `${sep}width=${width}&height=${width}&resize=contain&quality=${quality}`;
}
