/*
  Rezepttitel für die Bühne (DESIGN.md §11): Viele Titel tragen eine Erklärung
  hinter einem Gedankenstrich oder in Klammern ("Soda Farls — ćwiartki chleba
  sodowego z patelni"). Der Hauptteil wird groß gesetzt, die Erklärung als
  zweite, kleinere Zeile. Die Schriftgröße richtet sich nach der Länge, damit
  auch lange Titel und breite Schriften (Kyrillisch) in die Bühne passen.
*/
export function splitTitle(title: string): { main: string; sub: string | null } {
  const dash = title.match(/^(.{3,}?)\s+[—–-]\s+(.{3,})$/);
  if (dash) return { main: dash[1].trim(), sub: dash[2].trim() };
  const paren = title.match(/^(.{3,}?)\s*[(（](.{3,})[)）]\s*$/);
  if (paren) return { main: paren[1].trim(), sub: paren[2].trim() };
  return { main: title, sub: null };
}

/** CSS font-size für den Hauptteil; `scale` 1 = Startseite, 0.8 = Rezeptseite. */
export function stageTitleSize(main: string, scale = 1): string {
  // CJK-Zeichen sind etwa doppelt so breit wie lateinische
  const n = Array.from(main).reduce((sum, ch) => sum + (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
  const [min, vw, max] = n <= 16 ? [2.5, 6.2, 5.75] : n <= 28 ? [2.25, 4.6, 4.25] : n <= 48 ? [2, 3.6, 3.25] : [1.75, 2.9, 2.5];
  return `clamp(${(min * Math.max(scale, 0.9)).toFixed(2)}rem, ${(vw * scale).toFixed(2)}vw, ${(max * scale).toFixed(2)}rem)`;
}
