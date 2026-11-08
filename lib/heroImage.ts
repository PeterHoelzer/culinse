/*
  Responsive Varianten für das Hero-Foto (LCP-Element): Der Supabase-Bilddienst
  rendert jede Breite auf Zuruf. Mobil lädt so ein 480-px-Bild statt 1280 px.
*/
export const HERO_WIDTHS = [480, 768, 1024, 1280, 1600];
export const HERO_SIZES = "(min-width: 1024px) 60vw, 100vw";

export function widthVariant(url: string, width: number): string {
  try {
    const u = new URL(url);
    if (u.pathname.includes("/storage/v1/render/image/")) {
      u.searchParams.set("width", String(width));
      u.searchParams.set("height", String(Math.round(width * 0.75)));
      return u.toString();
    }
  } catch {
    /* keine URL, unverändert zurück */
  }
  return url;
}

export function heroSrcSet(url: string): string | undefined {
  if (!url.includes("/storage/v1/render/image/")) return undefined;
  return HERO_WIDTHS.map((w) => `${widthVariant(url, w)} ${w}w`).join(", ");
}
