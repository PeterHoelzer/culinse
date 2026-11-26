"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { buttonClasses } from "@/components/ui/styles";
import { SYSTEM_TEXTS, type SystemTexts } from "@/lib/systemTexts";

// Fassung, die der Server ausliefert: Dort ist die Adresse nicht bekannt (Next.js
// rendert diese Seiten vorab unter /_not-found), deshalb zweisprachig wie zuvor.
const FALLBACK: SystemTexts = {
  notFound: "Seite nicht gefunden · Page not found",
  notFoundSub: "Diese Seite existiert nicht (mehr). This page does not exist (anymore).",
  backHome: "Zur Startseite · Back home",
  title: "Da ist etwas schiefgegangen · Something went wrong",
  retry: "Erneut versuchen · Try again",
  text: "Ein unerwarteter Fehler ist aufgetreten. An unexpected error occurred.",
  id: "Fehlernummer · Error number: {id}",
};

const subscribe = () => () => {};
const clientPath = () => window.location.pathname;
const serverPath = () => null;

/*
  Fehlerseite und „Seite nicht gefunden“ in der Sprache der Adresse (26.11.2026).
  Bewusst ohne next-intl: Diese Seiten erscheinen auch dann, wenn der
  Sprachkontext fehlt oder selbst der Fehler ist. Die Sprache kommt aus dem
  ersten Teil der Adresse (/de/…), die Texte aus lib/systemTexts.ts.

  Die Adresse wird erst im Browser gelesen (useSyncExternalStore): Der Server
  liefert die zweisprachige Fassung, der Browser tauscht sie nach dem Laden gegen
  die Sprache der Adresse. Mit usePathname lieferte der Server Englisch und der
  Browser Deutsch; React meldete dann einen Fehler beim Zusammenführen (#418).
*/
export default function SystemPage({
  kind,
  digest,
  onRetry,
}: {
  kind: "notFound" | "error";
  digest?: string;
  onRetry?: () => void;
}) {
  const path = useSyncExternalStore(subscribe, clientPath, serverPath);
  const segment = (path ?? "").split("/")[1] ?? "";
  const known = Object.prototype.hasOwnProperty.call(SYSTEM_TEXTS, segment);
  const s = path === null ? FALLBACK : SYSTEM_TEXTS[known ? segment : "en"];
  const home = known ? `/${segment}` : "/";
  const isError = kind === "error";

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <nav className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-content items-center px-4 sm:px-6">
          {/* Statische Wortmarke: kein Sprachkontext nötig */}
          <Link href={home} aria-label="Culinse" className="text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">
            culi<span className="text-brand">nse</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-prose flex-1 items-center px-4 py-12 sm:px-6">
        <EmptyState
          className="w-full"
          tone={isError ? "error" : undefined}
          icon={isError ? "alert" : "utensils"}
          title={
            <span role="heading" aria-level={1} className="block font-serif text-h1-sm sm:text-h1">
              {isError ? s.title : s.notFound}
            </span>
          }
          text={
            isError ? (
              <>
                {s.text}
                {digest && <span className="tabular mt-2 block text-caption text-ink-3">{s.id.replace("{id}", digest)}</span>}
              </>
            ) : (
              s.notFoundSub
            )
          }
          action={
            <div className="flex flex-wrap gap-3">
              {isError && onRetry && <Button onClick={onRetry}>{s.retry}</Button>}
              <Link href={home} className={buttonClasses(isError ? { variant: "secondary" } : {})}>
                {s.backHome}
              </Link>
            </div>
          }
        />
      </main>
    </div>
  );
}
