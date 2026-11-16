#!/usr/bin/env node
// Kopiert einen Bildspeicher (Bucket) von einem Supabase-Projekt in ein anderes,
// hier: vom Supabase-Projekt auf den eigenen Server.
//
// Das Skript liest an der Quelle nur. Am Ziel legt es den Bucket mit denselben
// Einstellungen an und lädt jede Datei mit ihrem Dateityp und ihrer Cache-Angabe
// hoch. Vorhandene Dateien gleicher Größe überspringt es; ein abgebrochener Lauf
// lässt sich deshalb einfach wiederholen.
//
//   QUELLE_URL=https://[projekt].supabase.co QUELLE_KEY=[service_role] \
//   ZIEL_URL=https://daten.culinse.com       ZIEL_KEY=[service_role] \
//     node deploy/bilder-kopieren.mjs               kopieren
//     node deploy/bilder-kopieren.mjs --trocken     nur zählen, nichts hochladen
//     node deploy/bilder-kopieren.mjs --vergleich   nur beide Seiten vergleichen
//     node deploy/bilder-kopieren.mjs --alles       jede Datei kopieren, auch wenn das Ziel sie schon aufführt
//
// --alles ist beim ERSTEN Lauf nach dem Einspielen der Datenbank Pflicht: Der
// Datenbank-Export kann die Dateiliste des Bildspeichers mitbringen. Das Ziel
// führt die Dateien dann auf, obwohl sie noch nicht auf der Platte liegen.
//
// Optional: BUCKET (Standard recipe-media), GLEICHZEITIG (Standard 4).
import { createClient } from "@supabase/supabase-js";

const need = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`${name} fehlt`);
    process.exit(2);
  }
  return v;
};
const BUCKET = process.env.BUCKET || "recipe-media";
const GLEICHZEITIG = Number(process.env.GLEICHZEITIG || 4);
const trocken = process.argv.includes("--trocken");
const nurVergleich = process.argv.includes("--vergleich");
const alles = process.argv.includes("--alles");

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const quelle = createClient(need("QUELLE_URL"), need("QUELLE_KEY"), opts);
const ziel = createClient(need("ZIEL_URL"), need("ZIEL_KEY"), opts);

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

// Wiederholt bei Netzfehlern und wenn der Speicher bremst (429) oder kurz hakt (5xx).
async function mitWiederholung(name, fn, versuche = 6) {
  for (let i = 0; ; i++) {
    let fehler;
    try {
      const { data, error } = await fn();
      if (!error) return data;
      const status = Number(error.status ?? error.statusCode ?? 0);
      fehler = new Error(`${name}: ${error.message ?? error}`);
      // Alles andere (401, 403, 404, 413 …) wird durch Wiederholen nicht besser.
      if (!(status === 429 || status >= 500 || status === 0)) throw Object.assign(fehler, { endgueltig: true });
    } catch (err) {
      if (err.endgueltig) throw err;
      fehler = err;
    }
    if (i >= versuche - 1) throw fehler;
    await warte(2000 * (i + 1));
  }
}

// Alle Dateien eines Buckets, Ordner für Ordner (höchstens 1000 Einträge je Abruf).
async function alleDateien(client) {
  const dateien = new Map(); // Pfad -> { groesse, typ, cache }
  const ordner = [""];
  while (ordner.length) {
    const prefix = ordner.pop();
    for (let offset = 0; ; offset += 1000) {
      const eintraege = await mitWiederholung(`Liste ${prefix || "/"}`, () =>
        client.storage.from(BUCKET).list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
      );
      for (const e of eintraege) {
        const pfad = prefix ? `${prefix}/${e.name}` : e.name;
        // Ordner haben keine id und keine Metadaten.
        if (e.id === null || !e.metadata) ordner.push(pfad);
        else dateien.set(pfad, { groesse: Number(e.metadata.size ?? 0), typ: e.metadata.mimetype, cache: e.metadata.cacheControl });
      }
      if (eintraege.length < 1000) break;
    }
  }
  return dateien;
}

const summe = (m) => [...m.values()].reduce((a, d) => a + d.groesse, 0);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// "max-age=604800" -> "604800"; der Upload erwartet nur die Sekunden.
const cacheSekunden = (cache) => (/max-age=(\d+)/.exec(cache || "")?.[1]) ?? "3600";

async function bucketAnlegen() {
  const vorlage = await mitWiederholung("Bucket der Quelle", () => quelle.storage.getBucket(BUCKET));
  const { data: vorhanden } = await ziel.storage.getBucket(BUCKET);
  if (vorhanden) return;
  await mitWiederholung("Bucket am Ziel anlegen", () =>
    ziel.storage.createBucket(BUCKET, {
      public: vorlage.public,
      fileSizeLimit: vorlage.file_size_limit ?? undefined,
      allowedMimeTypes: vorlage.allowed_mime_types ?? undefined,
    }),
  );
  console.log(`Bucket ${BUCKET} am Ziel angelegt (öffentlich: ${vorlage.public}).`);
}

async function kopiere(pfad, info) {
  const blob = await mitWiederholung(`Laden ${pfad}`, () => quelle.storage.from(BUCKET).download(pfad));
  await mitWiederholung(`Hochladen ${pfad}`, () =>
    ziel.storage.from(BUCKET).upload(pfad, blob, {
      contentType: info.typ || blob.type || "application/octet-stream",
      cacheControl: cacheSekunden(info.cache),
      upsert: true,
    }),
  );
}

console.log(`Lese ${BUCKET} an der Quelle …`);
const von = await alleDateien(quelle);
console.log(`Quelle: ${von.size} Dateien, ${mb(summe(von))}`);

if (!trocken && !nurVergleich) await bucketAnlegen();
let nach = new Map();
try {
  nach = await alleDateien(ziel);
} catch (err) {
  if (!trocken) throw err;
  console.log("Ziel: Bucket noch nicht vorhanden.");
}
console.log(`Ziel:   ${nach.size} Dateien, ${mb(summe(nach))}`);

const offen = alles ? [...von] : [...von].filter(([pfad, info]) => nach.get(pfad)?.groesse !== info.groesse);
console.log(`Zu kopieren: ${offen.length} Dateien, ${mb(offen.reduce((a, [, d]) => a + d.groesse, 0))}`);

if (nurVergleich || trocken) {
  const zuviel = [...nach.keys()].filter((p) => !von.has(p));
  if (zuviel.length) console.log(`Nur am Ziel vorhanden: ${zuviel.length} Dateien (z. B. ${zuviel[0]})`);
  process.exit(offen.length ? 1 : 0);
}

let fertig = 0;
const fehler = [];
const schlange = offen.slice();
await Promise.all(
  Array.from({ length: GLEICHZEITIG }, async () => {
    for (let next = schlange.shift(); next; next = schlange.shift()) {
      const [pfad, info] = next;
      try {
        await kopiere(pfad, info);
      } catch (err) {
        fehler.push(`${pfad}: ${err.message}`);
      }
      if (++fertig % 200 === 0) console.log(`  ${fertig}/${offen.length}`);
    }
  }),
);

console.log(`Kopiert: ${fertig - fehler.length}, Fehler: ${fehler.length}`);
for (const f of fehler.slice(0, 20)) console.log(`  ${f}`);
const danach = await alleDateien(ziel);
const fehlt = [...von].filter(([pfad, info]) => danach.get(pfad)?.groesse !== info.groesse).length;
console.log(`Vergleich danach: Quelle ${von.size} Dateien / ${mb(summe(von))}, Ziel ${danach.size} Dateien / ${mb(summe(danach))}, abweichend ${fehlt}`);
process.exit(fehler.length || fehlt ? 1 : 0);
