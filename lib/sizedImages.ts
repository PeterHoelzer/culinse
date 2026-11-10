import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIZED_WIDTHS, sizedPath } from "./imageUrl";

/*
  Erzeugt die festen, verkleinerten Fassungen eines Rezeptbilds und legt sie im
  Bildspeicher ab (siehe lib/imageUrl.ts). Nur auf dem Server verwenden.

  Die Fassungen sind immer JPEG und behalten den Dateinamen des Originals,
  damit sich die Adresse ohne Nachschlagen aus der Originaladresse ergibt.
*/
export async function uploadSizedVariants(db: SupabaseClient, path: string, original: Buffer): Promise<void> {
  for (const width of SIZED_WIDTHS) {
    // Wie die frühere Render-API mit resize=contain: längste Seite höchstens
    // `width`, Seitenverhältnis bleibt, kleinere Bilder werden nicht vergrößert.
    const out = await sharp(original)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    const { error } = await db.storage
      .from("recipe-media")
      .upload(sizedPath(path, width), out, { contentType: "image/jpeg", upsert: true, cacheControl: "604800" });
    if (error) throw new Error(`sized ${width}: ${error.message}`);
  }
}
