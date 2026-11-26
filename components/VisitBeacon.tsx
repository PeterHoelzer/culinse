"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isLoginForUncounted } from "@/lib/uncountedPaths";

/*
  Besucherzählung, Browser-Teil (25.11.2026): meldet jeden Seitenaufruf mit
  einer kurzen Nachricht an /api/besuch. Nötig, weil die Seiten aus dem Speicher
  von Cloudflare kommen und der Server die Aufrufe sonst nicht sieht.

  Setzt kein Cookie und legt nichts im Browser ab. Gesendet werden nur die
  Adresse der Seite, beim ersten Aufruf die Herkunft (Rechnername der
  verweisenden Seite, ?utm_source=) und ob es die erste Seite des Besuchs ist.

  Gezählt wird erst nach einem Lebenszeichen (26.11.2026): Maus, Rad, Taste
  oder Finger, sonst nach zehn Sekunden auf der sichtbaren Seite. In den ersten
  zwei Tagen waren 102 von 127 "Besuchern" Crawler, die sich als gewöhnlicher
  Chrome ausgeben, JavaScript ausführen, eine Seite laden und wieder gehen.
  An der Browserkennung sind sie nicht zu erkennen (lib/visits.ts), an ihrem
  Verhalten schon. Was der Besucher tut, wird nicht gesendet und nicht
  gespeichert; es entscheidet nur, ob die Meldung überhaupt abgeht.
*/

// Lebenszeichen. Bewusst ohne "scroll": Das löst auch ein Skript aus, und der
// Browser selbst, wenn er die alte Stelle der Seite wiederherstellt.
const SIGNS = ["pointerdown", "pointermove", "wheel", "keydown", "touchstart"] as const;
const LISTEN = { passive: true, capture: true } as const;
// Wer so lange bleibt, ohne etwas zu tun, liest vermutlich.
const WAIT_MS = 10_000;

// In diesem Tab schon ein Lebenszeichen gesehen? Gilt über Seitenwechsel hinweg.
let alive = false;

// Über Seitenwechsel hinweg: Was wurde zuletzt gemeldet, und war schon etwas da?
let lastPath = "";
let lastTime = 0;
let firstDone = false;

function report(path: string) {
  const now = Date.now();
  // Doppelte Meldung derselben Seite direkt hintereinander (z. B. Entwicklungsmodus) auslassen.
  if (path === lastPath && now - lastTime < 1500) return;
  lastPath = path;
  lastTime = now;

  const first = !firstDone;
  firstDone = true;

  const data: { p: string; r?: string; u?: string; e?: 1 } = { p: path };
  if (first) {
    let external = false;
    try {
      external = !!document.referrer && new URL(document.referrer).host !== location.host;
    } catch {}
    if (external) data.r = new URL(document.referrer).origin;
    const utm = new URLSearchParams(location.search).get("utm_source");
    if (utm) data.u = utm.slice(0, 60);
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // Erste Seite eines Besuchs: frisch geöffnet (nicht neu geladen, nicht „zurück“) und nicht von uns selbst.
    if ((!nav || nav.type === "navigate") && (external || !document.referrer)) data.e = 1;
  }

  const body = JSON.stringify(data);
  try {
    if (navigator.sendBeacon?.("/api/besuch", body)) return;
  } catch {}
  fetch("/api/besuch", { method: "POST", body, keepalive: true }).catch(() => {});
}

export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || navigator.webdriver) return;
    // Anmeldeseite auf dem Weg in die Verwaltung: zählt so wenig wie die Verwaltung selbst.
    if (isLoginForUncounted(pathname, location.search)) return;

    let timer: number | undefined;
    let counted = false;

    function stop() {
      window.clearTimeout(timer);
      SIGNS.forEach((name) => window.removeEventListener(name, onSign, LISTEN));
      document.removeEventListener("visibilitychange", onVisibility);
    }
    function count() {
      if (counted) return;
      counted = true;
      stop();
      report(pathname);
    }
    function onSign() {
      alive = true;
      if (document.visibilityState === "visible") count();
    }
    // Nur zählen, wenn die Seite wirklich zu sehen ist (kein Vorladen im
    // Hintergrund). Die zehn Sekunden laufen nur, solange sie zu sehen ist.
    function onVisibility() {
      window.clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      if (alive) count();
      else timer = window.setTimeout(count, WAIT_MS);
    }

    SIGNS.forEach((name) => window.addEventListener(name, onSign, LISTEN));
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return stop;
  }, [pathname]);

  return null;
}
