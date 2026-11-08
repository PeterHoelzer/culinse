import sharp from "sharp";
import type { DishColors } from "@/app/[locale]/components/home-types";

/*
  Die Farbe des Gerichts (DESIGN.md §11): Aus dem Rezeptfoto wird serverseitig
  die prägende Farbe gezogen. Daraus entstehen drei Töne:
  - stage: dunkel, Bühne hinter dem Titel (weißer Text ≥ 9:1)
  - tint:  sehr hell, Hintergrund der Suchzeile (dunkler Text ≥ 12:1)
  - accent: mittel, Farbstreifen auf Karten
  Das Foto wird über den Bilddienst auf 48 px verkleinert geladen (ca. 5 KB) und
  im Data Cache 24 h gehalten. Fehler liefern null; die Seite fällt dann auf die
  Markenfarben zurück.
*/

const memo = new Map<string, Promise<DishColors | null>>();

function tinyUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("supabase.co") && u.pathname.includes("/render/image/")) {
      u.searchParams.set("width", "48");
      u.searchParams.set("height", "48");
      u.searchParams.set("resize", "cover");
      u.searchParams.set("quality", "60");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

async function compute(url: string): Promise<DishColors | null> {
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).resize(32, 32, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  // 24 Farbton-Körbe à 15°, gewichtet nach Sättigung und mittlerer Helligkeit
  const buckets = Array.from({ length: 24 }, () => ({ w: 0, x: 0, y: 0, s: 0 }));
  // Das Gericht liegt in der Bildmitte, Tisch und Tuch am Rand. Erst wird der
  // Farbton des Randes bestimmt (Hintergrund), dann zählen Pixel der Mitte umso
  // mehr, je satter sie sind und je stärker ihr Ton vom Hintergrund abweicht.
  const cx = (info.width - 1) / 2, cy = (info.height - 1) / 2, maxD = Math.hypot(cx, cy);
  const px = new Float32Array(info.width * info.height * 4); // h, s, l, center
  let bx = 0, by = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const [h, s, l] = rgbToHsl(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    const x = i % info.width, y = Math.floor(i / info.width);
    const center = 1 - Math.hypot(x - cx, y - cy) / maxD;
    px[i * 4] = h; px[i * 4 + 1] = s; px[i * 4 + 2] = l; px[i * 4 + 3] = center;
    if (center < 0.35 && s >= 0.12 && l > 0.08 && l < 0.94) {
      const rad = (h * Math.PI) / 180;
      bx += Math.cos(rad) * s; by += Math.sin(rad) * s;
    }
  }
  const hasBg = Math.hypot(bx, by) > 0.5;
  const bgHue = hasBg ? ((Math.atan2(by, bx) * 180) / Math.PI + 360) % 360 : null;
  const hueDist = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  for (let i = 0; i < info.width * info.height; i++) {
    const h = px[i * 4], s = px[i * 4 + 1], l = px[i * 4 + 2], center = px[i * 4 + 3];
    if (l < 0.08 || l > 0.94 || s < 0.18) continue; // Weiß, Schwarz, Grau zählen nicht
    const likeBackground = bgHue !== null && hueDist(h, bgHue) < 28 ? 0.2 : 1;
    const w = s * s * (1 - Math.abs(l - 0.45)) * (0.1 + center * center) * likeBackground;
    const b = buckets[Math.floor(h / 15) % 24];
    const rad = (h * Math.PI) / 180;
    b.w += w; b.x += Math.cos(rad) * w; b.y += Math.sin(rad) * w; b.s += s * w;
  }
  const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
  if (best.w === 0) return null;

  let hue = (Math.atan2(best.y, best.x) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const sat = best.s / best.w;

  return {
    stage: hslToHex(hue, clamp(sat, 0.35, 0.7), 0.22),
    tint: hslToHex(hue, clamp(sat, 0.3, 0.55), 0.94),
    accent: hslToHex(hue, clamp(sat, 0.4, 0.75), 0.4),
  };
}

/** Farben eines Fotos; null bei Fehlern oder fehlender Farbe. Gleiche URL wird nur einmal berechnet. */
export function dishColors(imageUrl: string | null | undefined): Promise<DishColors | null> {
  if (!imageUrl) return Promise.resolve(null);
  const key = tinyUrl(imageUrl);
  let p = memo.get(key);
  if (!p) {
    p = compute(key).catch(() => null);
    memo.set(key, p);
  }
  return p;
}

/** Wie dishColors, aber nie länger als `ms` warten (der erste Render darf nicht hängen). */
export function dishColorsWithin(imageUrl: string | null | undefined, ms = 1500): Promise<DishColors | null> {
  return Promise.race([dishColors(imageUrl), new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}
