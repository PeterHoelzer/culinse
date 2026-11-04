// Exportiert die App-Store-Texte aller Copper-City-Sprachen als JSON
// (Grundlage für die Excel-Tabelle zum Eintragen in App Store Connect).
// Aufruf: npx tsx scripts/copper-city-store-texts.ts > marketing-assets/copper-city/store-texts.json
import { copperCityLocales, privacyPath, supportPath } from "../lib/copper-city";

const rows = copperCityLocales.map((l) => ({
  code: l.code,
  languageName: l.support.languageName,
  supportUrl: `https://culinse.com${supportPath(l.code)}`,
  privacyUrl: `https://culinse.com${privacyPath(l.code)}`,
  ...l.store,
}));

process.stdout.write(JSON.stringify(rows, null, 2));
