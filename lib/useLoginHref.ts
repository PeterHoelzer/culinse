"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/lib/navigation";
import { loginHref } from "@/lib/loginRedirect";

/*
  Verweis auf die Anmeldung, der danach zur aktuellen Seite zurückführt.

  Im Seitencode steht nur "/login" (26.11.2026). Bis dahin stand dort
  "/login?redirectTo=<diese Seite>", auf jeder Seite also eine andere Adresse.
  Crawler, die robots.txt übergehen, riefen deshalb für jede Seite der Website
  eine eigene Anmeldeseite ab: rund 2.200 Abrufe am Tag, und in der
  Besucherzählung standen sie als "neue Besucher auf der Anmeldeseite" ganz oben.

  Das Ziel kommt jetzt erst beim Klick dazu. Wer den Verweis in einem neuen Tab
  öffnet, landet nach der Anmeldung auf der Startseite.

  Bewusst usePathname aus next/navigation: der Pfad soll die Sprache enthalten.
*/
export function useLoginLink(): { href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void } {
  const pathname = usePathname();
  const router = useRouter();

  return {
    href: "/login",
    onClick: (event) => {
      // Neuer Tab, neues Fenster, Herunterladen: dem Browser überlassen.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = loginHref(pathname);
      if (target === "/login") return;
      event.preventDefault();
      router.push(target as "/");
    },
  };
}
