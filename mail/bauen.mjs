#!/usr/bin/env node
// Baut die Mail-Vorlagen des Anmeldedienstes (GoTrue auf dem eigenen Server).
//
//   node mail/bauen.mjs
//
// Quellen:  mail/texte/<sprache>.json  Texte je Sprache (Deutsch zuerst schreiben)
//           mail/gerichte.json         Foto, Farbe und Name des Gerichts je Mail
// Ergebnis: mail/vorlagen/<mail>.html  eine Vorlage je Mail, alle 16 Sprachen darin
//           mail/vorlagen/mailer.env   Betreffzeilen und Adressen der Vorlagen
//           mail/text/<sprache>/<mail>.txt  reine Textfassung (siehe LIESMICH.md)
//
// Die Vorlagen sind Go-Vorlagen (html/template). Die Sprache kommt aus dem Konto
// (user_metadata.locale, gesetzt bei der Registrierung) und bei der Passwort-Mail
// aus der Rücksprung-Adresse. Fehlt beides, gilt Englisch wie auf der Website.
//
// Was html/template nicht kann und deshalb hier fehlt: HTML-Kommentare (werden
// entfernt, also keine Outlook-Sonderwege) und eigene Funktionen.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.dirname(HIER);
const SEITE = "https://culinse.com";
const BILDER = `${SEITE}/mail`;
const VORLAGEN_HOST = "http://mailvorlagen"; // Dienst supabase-mailvorlagen im internen Netz
// Gültigkeit von Link und Code in Stunden: GOTRUE_MAILER_OTP_EXP (nicht gesetzt = 86400 s).
const STUNDEN = "24";

// Sprachen aus i18n/routing.ts, damit beide Listen nie auseinanderlaufen.
const routing = fs.readFileSync(path.join(WURZEL, "i18n/routing.ts"), "utf8");
const SPRACHEN = JSON.parse(routing.match(/locales:\s*(\[[^\]]+\])/)[1]);
const STANDARD = routing.match(/defaultLocale:\s*"([a-z]+)"/)[1];

// Mails des Anmeldedienstes. `art`: link (Knopf), code (Zahl zum Abtippen).
const MAILS = {
  confirmation: { art: "link", env: "CONFIRMATION" },
  recovery: { art: "link", env: "RECOVERY", spracheAusRuecksprung: "update-password" },
  magic_link: { art: "link", env: "MAGIC_LINK" },
  email_change: { art: "link", env: "EMAIL_CHANGE", adressen: true },
  invite: { art: "link", env: "INVITE" },
  reauthentication: { art: "code", env: "REAUTHENTICATION" },
};

const lies = (datei) => JSON.parse(fs.readFileSync(path.join(HIER, datei), "utf8"));
const texte = Object.fromEntries(SPRACHEN.map((s) => [s, lies(`texte/${s}.json`)]));
const gerichte = lies("gerichte.json");

// ── Prüfen: gleiche Schlüssel in allen Sprachen, keine Zeichen, die eine Go-
// Zeichenkette, die env-Datei oder das HTML stören.
const VERBOTEN = /["\\`$<>{}\n\r]/;
const fehler = [];
const muster = texte.de;
for (const s of SPRACHEN) {
  for (const [gruppe, eintraege] of Object.entries(muster)) {
    for (const schluessel of Object.keys(eintraege)) {
      const wert = texte[s]?.[gruppe]?.[schluessel];
      if (typeof wert !== "string" || !wert.trim()) fehler.push(`${s}: ${gruppe}.${schluessel} fehlt`);
      else if (VERBOTEN.test(wert)) fehler.push(`${s}: ${gruppe}.${schluessel} enthält ein verbotenes Zeichen`);
    }
    for (const schluessel of Object.keys(texte[s]?.[gruppe] ?? {})) {
      if (!(schluessel in eintraege)) fehler.push(`${s}: ${gruppe}.${schluessel} gibt es im Deutschen nicht`);
    }
  }
}
for (const [mail, g] of Object.entries(gerichte)) {
  for (const s of SPRACHEN) {
    if (!g.namen[s] || VERBOTEN.test(g.namen[s])) fehler.push(`gerichte.json: ${mail}.namen.${s} fehlt oder enthält ein verbotenes Zeichen`);
  }
}
if (fehler.length) {
  console.error(fehler.join("\n"));
  process.exit(1);
}

// ── Go-Vorlage: Sprache bestimmen, Texte in Variablen legen.
const go = (s) => JSON.stringify(s); // JSON-Zeichenkette ist eine gültige Go-Zeichenkette
const TEXT_SCHLUESSEL = ["betreff", "vorschau", "zeile", "titel", "text", "knopf", "hinweis"];
const GEMEINSAM = Object.keys(muster.gemeinsam);

function variablen(mail, sprache) {
  const t = texte[sprache];
  const v = { sprache, gericht: gerichte[mail].namen[sprache] };
  for (const k of TEXT_SCHLUESSEL) if (t[mail][k] !== undefined) v[k] = t[mail][k];
  for (const k of GEMEINSAM) v[k] = t.gemeinsam[k];
  return v;
}

function kopfDerVorlage(mail) {
  const def = MAILS[mail];
  const andere = SPRACHEN.filter((s) => s !== STANDARD);
  const z = [];
  z.push(`{{- /* Erzeugt von mail/bauen.mjs. Nicht von Hand ändern: Texte stehen in mail/texte/. */ -}}`);
  z.push(`{{- $l := "" -}}`);
  z.push(`{{- if .Data }}{{ $l = printf "%v" (index .Data "locale") }}{{ end -}}`);
  if (def.spracheAusRuecksprung) {
    // Die Seite, auf der die Mail angefordert wurde, kennt die Sprache am besten.
    for (const s of SPRACHEN) {
      z.push(`{{- if eq .RedirectTo ${go(`${SEITE}/${s}/${def.spracheAusRuecksprung}`)} }}{{ $l = ${go(s)} }}{{ end -}}`);
    }
  }
  const setze = (v, erst) => Object.entries(v).map(([k, w]) => `{{ $${k} ${erst ? ":=" : "="} ${go(w)} }}`).join("");
  z.push(`{{- ${setze(variablen(mail, STANDARD), true).slice(3)}`.replace(/\}\}$/, "-}}"));
  andere.forEach((s, i) => {
    z.push(`{{- ${i === 0 ? "if" : "else if"} eq $l ${go(s)} }}${setze(variablen(mail, s), false)}`);
  });
  z.push(`{{- end -}}`);
  return z.join("\n");
}

// ── Aussehen (DESIGN.md §1, §2, §4, §11). Farben der Website als feste Werte,
// weil Mailprogramme keine Variablen kennen.
const F = {
  flaeche: "#ffffff",
  weich: "#faf7f2",
  tinte: "#23201c",
  tinte2: "#5c564e",
  tinte3: "#6f685e",
  linie: "#e6e0d6",
  marke: "#bf4a14",
  // dunkler Modus
  dFlaeche: "#1f1c19",
  dWeich: "#2b2723",
  dTinte: "#f2ede6",
  dTinte2: "#cfc8be",
  dLinie: "#3d3832",
  dMarke: "#f3a074",
};
const SANS = `system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;
const SERIF = `Fraunces,Georgia,'Times New Roman',serif`;
const FRAUNCES = `font-variation-settings:'SOFT' 30,'WONK' 1;font-optical-sizing:auto;`;

const fontFace = (datei, bereich) =>
  `@font-face{font-family:Fraunces;font-style:normal;font-weight:600;font-display:swap;src:url("${BILDER}/${datei}") format("woff2");unicode-range:${bereich}}`;

function html(mail) {
  const def = MAILS[mail];
  const g = gerichte[mail];
  const tabelle = `role="presentation" cellpadding="0" cellspacing="0" border="0"`;

  const knopf = `
              <table ${tabelle}>
                <tr>
                  <td bgcolor="#ffffff" style="background:#ffffff;border-radius:4px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:600;color:${g.stage};text-decoration:none;border-radius:4px;">{{ $knopf }}</a>
                  </td>
                </tr>
              </table>`;

  const code = `
              <table ${tabelle}>
                <tr>
                  <td bgcolor="#ffffff" style="background:#ffffff;border-radius:8px;padding:14px 24px 12px 30px;font-family:${SERIF};${FRAUNCES}font-size:40px;line-height:44px;font-weight:600;letter-spacing:6px;color:${g.stage};">{{ .Token }}</td>
                </tr>
              </table>`;

  const adressen = `
              <table ${tabelle} style="margin:0 0 26px;">
                <tr>
                  <td style="padding:0 12px 4px 0;font-family:${SANS};font-size:15px;line-height:22px;color:${g.tint};">{{ $bisher }}</td>
                  <td class="adresse" style="padding:0 0 4px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;color:#ffffff;word-break:break-all;">{{ .Email }}</td>
                </tr>
                <tr>
                  <td style="padding:0 12px 0 0;font-family:${SANS};font-size:15px;line-height:22px;color:${g.tint};">{{ $neu }}</td>
                  <td class="adresse" style="padding:0;font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;color:#ffffff;word-break:break-all;">{{ .NewEmail }}</td>
                </tr>
              </table>`;

  const zahl = (wert, einheit) => `
                  <td valign="top" style="padding:0 36px 0 0;">
                    <div style="font-family:${SERIF};${FRAUNCES}font-size:44px;line-height:46px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">${wert}</div>
                    <div style="font-family:${SANS};font-size:14px;line-height:20px;color:${g.tint};">${einheit}</div>
                  </td>`;

  const linkAlsText =
    def.art === "link"
      ? `
        <tr>
          <td class="rand" style="padding:30px 0 0;">
            <p class="tinte" style="margin:0 0 8px;font-family:${SANS};font-size:16px;line-height:25px;color:${F.tinte};">{{ $knopf_geht_nicht }}</p>
            <p style="margin:0;font-family:${SANS};font-size:14px;line-height:21px;word-break:break-all;"><a class="marke" href="{{ .ConfirmationURL }}" target="_blank" style="color:${F.marke};text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
          </td>
        </tr>`
      : "";

  return `${kopfDerVorlage(mail)}
<!DOCTYPE html>
<html lang="{{ $sprache }}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<title>{{ $betreff }}</title>
<style>
body{margin:0;padding:0;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:separate}
img{border:0;outline:none;text-decoration:none}
.adresse a{color:#ffffff !important;text-decoration:none !important}
@media only screen and (max-width:640px){
.aussen{padding:0 0 40px !important}
.rand{padding-left:22px !important;padding-right:22px !important}
.buehne{padding:28px 22px 32px !important;border-radius:0 !important}
.foto{border-radius:0 !important}
.titel{font-size:32px !important;line-height:35px !important}
.einleitung{font-size:17px !important;line-height:26px !important}
}
</style>
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
${fontFace("fraunces-latin.woff2", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")}
${fontFace("fraunces-latin-ext.woff2", "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF")}
${fontFace("fraunces-vietnamese.woff2", "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303,U+0309,U+0323,U+1EA0-1EF9,U+20AB")}
@media (prefers-color-scheme:dark){
.seite{background:${F.dFlaeche} !important}
.tinte{color:${F.dTinte} !important}
.tinte2{color:${F.dTinte2} !important}
.marke{color:${F.dMarke} !important}
.kasten{background:${F.dWeich} !important}
.strich{border-top-color:${F.dLinie} !important}
}
</style>
</head>
<body class="seite" style="margin:0;padding:0;background:${F.flaeche};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${F.flaeche};">{{ $vorschau }}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
<table ${tabelle} width="100%" class="seite" bgcolor="${F.flaeche}" style="background:${F.flaeche};">
  <tr>
    <td class="aussen" align="center" style="padding:0 20px 48px;">
      <table ${tabelle} width="600" style="width:100%;max-width:600px;">
        <tr>
          <td class="rand" style="padding:28px 0 22px;">
            <a class="tinte" href="${SEITE}/{{ $sprache }}" target="_blank" style="font-family:${SANS};font-size:24px;line-height:24px;font-weight:700;letter-spacing:-0.02em;color:${F.tinte};text-decoration:none;">culi<span class="marke" style="color:${F.marke};">nse</span></a>
          </td>
        </tr>
        <tr>
          <td bgcolor="${g.stage}" style="background:${g.stage};border-radius:8px 8px 0 0;" class="foto">
            <img class="foto" src="${BILDER}/${g.foto}" width="600" height="335" alt="{{ $gericht }}" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:8px 8px 0 0;font-family:${SANS};font-size:14px;color:#ffffff;">
          </td>
        </tr>
        <tr>
          <td class="buehne" bgcolor="${g.stage}" style="background:${g.stage};padding:36px 40px 38px;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 10px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${g.tint};">{{ $zeile }}</p>
            <h1 class="titel" style="margin:0 0 16px;font-family:${SERIF};${FRAUNCES}font-size:44px;line-height:47px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;text-wrap:balance;">{{ $titel }}</h1>
            <p class="einleitung" style="margin:0 0 26px;font-family:${SANS};font-size:18px;line-height:28px;color:#ffffff;">{{ $text }}</p>${def.adressen ? adressen : ""}${def.art === "code" ? code : knopf}
            <table ${tabelle} style="margin:32px 0 0;">
              <tr>${zahl(STUNDEN, "{{ $einheit_stunden }}")}${zahl("1&times;", "{{ $einheit_einmal }}")}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="rand tinte2" style="padding:10px 0 0;font-family:${SANS};font-size:13px;line-height:18px;color:${F.tinte3};">{{ $im_bild }} {{ $gericht }} &middot; {{ $ki_foto }}</td>
        </tr>${linkAlsText}
        <tr>
          <td class="rand" style="padding:26px 0 0;">
            <table ${tabelle} width="100%">
              <tr>
                <td class="kasten tinte2" bgcolor="${F.weich}" style="background:${F.weich};border-radius:8px;padding:16px 20px;font-family:${SANS};font-size:15px;line-height:23px;color:${F.tinte2};">{{ $hinweis }}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="rand" style="padding:30px 0 0;">
            <table ${tabelle} width="100%">
              <tr>
                <td class="strich tinte2" style="border-top:1px solid ${F.linie};padding:18px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${F.tinte3};">
                  {{ $grund }}<br>
                  <a class="tinte2" href="${SEITE}/{{ $sprache }}/impressum" target="_blank" style="color:${F.tinte3};text-decoration:underline;">{{ $impressum }}</a> &nbsp;&middot;&nbsp; <a class="tinte2" href="${SEITE}/{{ $sprache }}/datenschutz" target="_blank" style="color:${F.tinte3};text-decoration:underline;">{{ $datenschutz }}</a> &nbsp;&middot;&nbsp; <a class="tinte2" href="${SEITE}/{{ $sprache }}" target="_blank" style="color:${F.tinte3};text-decoration:underline;">culinse.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}

// ── Reine Textfassung, je Sprache eine Datei (Platzhalter wie in der HTML-Fassung).
function textfassung(mail, sprache) {
  const def = MAILS[mail];
  const v = variablen(mail, sprache);
  const z = [v.titel, "", v.text, ""];
  if (def.adressen) z.push(`${v.bisher}: {{ .Email }}`, `${v.neu}: {{ .NewEmail }}`, "");
  if (def.art === "code") z.push("{{ .Token }}", "", v.gueltig_code);
  else z.push(`${v.knopf}:`, "{{ .ConfirmationURL }}", "", v.gueltig_link);
  z.push("", v.hinweis, "", "-- ", "Culinse", v.grund, `${v.impressum}: ${SEITE}/${sprache}/impressum`, `${v.datenschutz}: ${SEITE}/${sprache}/datenschutz`, "");
  return z.join("\n");
}

// ── Betreff als Go-Vorlage in einer Zeile. Ohne Variablen ($) und ohne doppelte
// Anführungszeichen, damit die env-Datei von docker compose nichts umdeutet.
function betreff(mail) {
  const def = MAILS[mail];
  const andere = SPRACHEN.filter((s) => s !== STANDARD);
  const zweige = [];
  if (def.spracheAusRuecksprung) {
    for (const s of SPRACHEN) zweige.push([`eq .RedirectTo \`${SEITE}/${s}/${def.spracheAusRuecksprung}\``, texte[s][mail].betreff]);
  }
  for (const s of andere) zweige.push([`eq (printf \`%v\` .Data.locale) \`${s}\``, texte[s][mail].betreff]);
  const kette = zweige.map(([bedingung, text], i) => `{{ ${i === 0 ? "if" : "else if"} ${bedingung} }}${text}`).join("");
  return `${kette}{{ else }}${texte[STANDARD][mail].betreff}{{ end }}`;
}

// ── Schreiben
const schreibe = (datei, inhalt) => {
  const ziel = path.join(HIER, datei);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, inhalt);
};

const env = [
  "# Erzeugt von mail/bauen.mjs. Nicht von Hand ändern.",
  "# Einstellungen des Anmeldedienstes (supabase-auth): Vorlagen und Betreffzeilen.",
  "# Kommt auf dem Server nach /opt/supabase/mailer-culinse.env, siehe mail/LIESMICH.md.",
];
for (const [mail, def] of Object.entries(MAILS)) {
  const seite = html(mail);
  schreibe(`vorlagen/${mail}.html`, seite);
  for (const s of SPRACHEN) schreibe(`text/${s}/${mail}.txt`, textfassung(mail, s));
  env.push(`GOTRUE_MAILER_TEMPLATES_${def.env}=${VORLAGEN_HOST}/${mail}.html`);
  env.push(`GOTRUE_MAILER_SUBJECTS_${def.env}="${betreff(mail)}"`);
  console.log(`${mail}.html  ${(Buffer.byteLength(seite) / 1024).toFixed(1)} KB`);
}
schreibe("vorlagen/mailer.env", env.join("\n") + "\n");
console.log(`${Object.keys(MAILS).length} Vorlagen, ${SPRACHEN.length} Sprachen, Standard ${STANDARD}`);
