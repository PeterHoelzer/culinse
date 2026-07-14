import Link from "next/link";
import type { ReactNode } from "react";

// Renders blog body text with inline Markdown-style links: [Ankertext](/pfad).
// Nur INTERNE Pfade (beginnend mit "/") werden zu <Link>. Alles andere (externe
// URLs, javascript:, leere Ziele) wird als reiner Ankertext ausgegeben — so kann
// über die Content-Strings kein fremder oder gefährlicher Link eingeschleust
// werden. Contextual In-Body-Links sind der stärkste interne SEO-Hebel (viel
// mehr Gewicht als wiederholte Footer-Linkblöcke), siehe SEO-Masterplan §3.
const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function renderRichText(text: string): ReactNode {
  if (!text.includes("](/")) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    // Zusätzliche Absicherung: nur genau ein interner Pfad, keine
    // Protokoll-relativen "//host"-Ziele.
    if (href.startsWith("/") && !href.startsWith("//")) {
      nodes.push(
        <Link
          key={key++}
          href={href}
          className="text-orange-600 font-medium underline decoration-orange-200 underline-offset-2 hover:decoration-orange-500 transition-colors"
        >
          {label}
        </Link>
      );
    } else {
      nodes.push(label);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
