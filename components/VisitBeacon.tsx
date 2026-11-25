"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/*
  Besucherzählung, Browser-Teil (25.11.2026): meldet jeden Seitenaufruf mit
  einer kurzen Nachricht an /api/besuch. Nötig, weil die Seiten aus dem Speicher
  von Cloudflare kommen und der Server die Aufrufe sonst nicht sieht.

  Setzt kein Cookie und legt nichts im Browser ab. Gesendet werden nur die
  Adresse der Seite, beim ersten Aufruf die Herkunft (Rechnername der
  verweisenden Seite, ?utm_source=) und ob es die erste Seite des Besuchs ist.
*/

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
    // Erst zählen, wenn die Seite wirklich zu sehen ist (kein Vorladen im Hintergrund).
    if (document.visibilityState === "visible") {
      report(pathname);
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") report(pathname);
    };
    document.addEventListener("visibilitychange", onVisible, { once: true });
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname]);

  return null;
}
