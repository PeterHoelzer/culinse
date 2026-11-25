"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";

/*
  Knopf „Mit Apple anmelden“ (25.11.2026), gebaut nach Apples Regeln für einen
  eigenen Knopf (Human Interface Guidelines, „Sign in with Apple“, Abschnitt
  „Creating a custom Sign in with Apple button“). Was davon hier gilt:

  - Aussehen „weiß mit Rahmen“: für helle Flächen. Fläche weiß, Zeichen und
    Schrift schwarz, keine anderen Farben.
  - Titel nur in Apples Wortlaut je Sprache (messages, login.appleButton).
  - Schrift des Systems, Größe 43 % der Knopfhöhe (44 px hoch, 19 px Schrift).
  - Das Zeichen kommt aus public/apple-logo.svg. Die Datei ist so hoch wie der
    Knopf und bringt den Abstand zum Titel mit; nicht beschneiden.
  - Rechts und links vom Inhalt bleiben mindestens 8 % der Knopfbreite frei.
  - Nicht kleiner als die anderen Anmeldeknöpfe, mindestens 140 × 30 px.
  - Ecken wie die übrigen Knöpfe der Seite (das erlaubt Apple ausdrücklich).

  Lange Titel (Polnisch) werden wie bei Apples eigenem Knopf kleiner gesetzt
  statt umbrochen. Gemessen wird die echte Breite, weil die Systemschrift je
  Gerät anders läuft (San Francisco, Segoe, Roboto).

  Kein Skript und kein Bild von Apple: Die Anmeldung läuft als Weiterleitung
  über den Anmeldedienst (LoginClient.tsx), die Inhalts-Sicherheitsrichtlinie
  in next.config.ts bleibt, wie sie ist.
*/

const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_PX = 19;
const LOGO_PX = 20;
const MIN_MARGIN = 0.08;

interface Props {
  label: string;
  onClick: () => void;
}

export default function AppleSignInButton({ label, onClick }: Props) {
  const titleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const button = title?.parentElement;
    if (!title || !button) return;

    const fit = () => {
      const available = button.clientWidth * (1 - 2 * MIN_MARGIN) - LOGO_PX;
      if (available <= 0) return;
      let size = FONT_PX;
      title.style.fontSize = `${size}px`;
      // Mehrere Schritte: Die Systemschrift läuft in kleinen Größen etwas
      // weiter, die Breite schrumpft also nicht genau im Verhältnis.
      for (let step = 0; step < 4 && title.getBoundingClientRect().width > available; step++) {
        size = Math.floor(((size * available) / title.getBoundingClientRect().width) * 10) / 10;
        title.style.fontSize = `${size}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(button);
    return () => observer.disconnect();
  }, [label]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full min-w-[140px] items-center justify-center overflow-hidden rounded-1 border border-black bg-white text-black transition-colors duration-150 hover:bg-[#f5f5f5]"
    >
      <Image src="/apple-logo.svg" alt="" width={LOGO_PX} height={44} className="h-full w-auto shrink-0" />
      <span
        ref={titleRef}
        className="whitespace-nowrap font-medium leading-none"
        style={{ fontFamily: SYSTEM_FONT, fontSize: FONT_PX }}
      >
        {label}
      </span>
    </button>
  );
}
