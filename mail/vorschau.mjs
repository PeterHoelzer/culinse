#!/usr/bin/env node
// Vorschaubilder der Mails: je Mail ein Bogen mit vier Ansichten
// (Desktop hell, Desktop dunkel, Handy hell, Handy dunkel).
//
//   node mail/vorschau.mjs            alle Mails auf Deutsch
//   node mail/vorschau.mjs en ja      andere Sprachen
//   node mail/vorschau.mjs de recovery   nur eine Mail
//
// Ablauf: mail/pruefen.go füllt die Vorlagen wie der Anmeldedienst, ein
// Chrome ohne Fenster fotografiert sie. Bilder und Schrift kommen dabei aus
// public/mail statt von culinse.com, damit die Vorschau schon vor dem
// Ausliefern stimmt. Ergebnis: mail/vorschau/<mail>.<sprache>.jpg (nicht im Repo).
//
// Es läuft immer nur ein Chrome, und er wird am Ende beendet.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.dirname(HIER);
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MAILS = ["confirmation", "recovery", "magic_link", "email_change", "invite", "reauthentication"];

const args = process.argv.slice(2);
const nurMails = args.filter((a) => MAILS.includes(a));
const sprachen = args.filter((a) => !MAILS.includes(a));
if (!sprachen.length) sprachen.push("de");
const mails = nurMails.length ? nurMails : MAILS;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "culinse-mail-"));
const fertig = path.join(tmp, "fertig");
execFileSync("go", ["run", path.join(HIER, "pruefen.go"), fertig], { cwd: WURZEL, stdio: ["ignore", "ignore", "inherit"] });

// ── Chrome über das DevTools-Protokoll steuern (ohne zusätzliche Pakete).
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${path.join(tmp, "profil")}`,
  "--allow-file-access-from-files", "--hide-scrollbars", "--no-first-run", "--disable-extensions", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const beenden = () => {
  try { chrome.kill("SIGKILL"); } catch {}
  // Chrome schreibt beim Beenden noch kurz ins Profil; deshalb mit Wiederholung.
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
};
process.on("exit", beenden);

const wsUrl = await new Promise((ok, nein) => {
  let puffer = "";
  const zeit = setTimeout(() => nein(new Error("Chrome meldet sich nicht")), 20000);
  chrome.stderr.on("data", (d) => {
    puffer += d;
    const m = puffer.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(zeit); ok(m[1]); }
  });
});
const ws = new WebSocket(wsUrl);
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
let nr = 0;
const offen = new Map();
const warter = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && offen.has(m.id)) {
    const { ok, nein } = offen.get(m.id);
    offen.delete(m.id);
    if (m.error) nein(new Error(m.error.message));
    else ok(m.result);
  } else if (m.method) {
    for (let i = warter.length - 1; i >= 0; i--) if (warter[i].method === m.method) warter.splice(i, 1)[0].ok(m.params);
  }
});
const sende = (method, params = {}, sessionId) => new Promise((ok, nein) => {
  const id = ++nr;
  offen.set(id, { ok, nein });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const warteAuf = (method) => new Promise((ok) => warter.push({ method, ok }));

const { targetId } = await sende("Target.createTarget", { url: "about:blank" });
const { sessionId } = await sende("Target.attachToTarget", { targetId, flatten: true });
const seite = (method, params) => sende(method, params, sessionId);
await seite("Page.enable");

async function foto(datei, breite, dunkel) {
  await seite("Emulation.setDeviceMetricsOverride", { width: breite, height: 900, deviceScaleFactor: 2, mobile: breite < 500 });
  await seite("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dunkel ? "dark" : "light" }] });
  const geladen = warteAuf("Page.loadEventFired");
  await seite("Page.navigate", { url: pathToFileURL(datei).href });
  await geladen;
  await seite("Runtime.evaluate", { expression: "document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))", awaitPromise: true });
  const { result } = await seite("Runtime.evaluate", { expression: "Math.ceil(document.documentElement.scrollHeight)", returnByValue: true });
  const { data } = await seite("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: breite, height: result.value, scale: 1 } });
  return Buffer.from(data, "base64");
}

const ANSICHTEN = [
  { name: "Desktop, hell", breite: 720, dunkel: false },
  { name: "Desktop, dunkel", breite: 720, dunkel: true },
  { name: "Handy, hell", breite: 390, dunkel: false },
  { name: "Handy, dunkel", breite: 390, dunkel: true },
];
const ziel = path.join(HIER, "vorschau");
fs.mkdirSync(ziel, { recursive: true });
const bilderOrt = pathToFileURL(path.join(WURZEL, "public/mail")).href;

try {
  for (const sprache of sprachen) {
    for (const mail of mails) {
      const quelle = path.join(fertig, `${mail}.${sprache}.html`);
      if (!fs.existsSync(quelle)) throw new Error(`Keine Vorlage für ${mail} in ${sprache}`);
      const lokal = path.join(tmp, `${mail}.${sprache}.html`);
      fs.writeFileSync(lokal, fs.readFileSync(quelle, "utf8").replaceAll("https://culinse.com/mail", bilderOrt));
      const teile = [];
      for (const a of ANSICHTEN) teile.push({ ...a, bild: await foto(lokal, a.breite, a.dunkel) });

      // Bogen: vier Spalten, darüber je eine Beschriftung.
      const RAND = 48, KOPF = 76;
      const masse = await Promise.all(teile.map((t) => sharp(t.bild).metadata()));
      const hoehe = Math.max(...masse.map((m) => m.height)) + KOPF + RAND;
      let x = RAND;
      const lagen = [];
      teile.forEach((t, i) => {
        const b = masse[i].width;
        const schild = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${b}" height="${KOPF}"><text x="0" y="50" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="#3b3833">${t.name}</text></svg>`);
        lagen.push({ input: schild, left: x, top: 0 }, { input: t.bild, left: x, top: KOPF });
        x += b + RAND;
      });
      const datei = path.join(ziel, `${mail}.${sprache}.jpg`);
      await sharp({ create: { width: x, height: hoehe, channels: 3, background: "#cfcbc4" } }).composite(lagen).jpeg({ quality: 86 }).toFile(datei);
      console.log(path.relative(WURZEL, datei));
    }
  }
} finally {
  ws.close();
  beenden();
}
process.exit(0);
