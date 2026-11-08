"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Button from "./Button";

/*
  Ein Dialog-Gerüst für alle Modals und den Einkaufslisten-Drawer (DESIGN.md §4, §7).
  Natives <dialog>: showModal() liefert Fokusfalle, Escape, inert-Hintergrund und
  Rückkehr des Fokus zum Auslöser. Backdrop-Klick trifft das <dialog> selbst
  (Panel-Inhalt liegt in einem inneren Container), kein klickbares <div>.
  - side: Drawer rechts, volle Höhe
  - size: Breite des zentrierten Panels (sm 24rem, md 32rem, lg 42rem)
*/

const SIZES = {
  sm: "w-[min(100%-2rem,24rem)]",
  md: "w-[min(100%-2rem,32rem)]",
  lg: "w-[min(100%-2rem,42rem)]",
} as const;

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  side?: boolean;
  size?: keyof typeof SIZES;
}

export default function Dialog({ open, onClose, title, children, side = false, size = "md" }: DialogProps) {
  const t = useTranslations("modals");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  const closeLabel = t.has("close") ? t("close") : "Schließen";

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // Fokus auf den ersten Inhalt (nicht auf das Schließen-Kreuz)
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const placement = side
    ? "ml-auto mr-0 my-0 h-full max-h-none w-[min(100%,28rem)] rounded-none " +
      "transition-transform duration-200 ease-out motion-reduce:transition-none starting:open:translate-x-full"
    : `m-auto max-h-[calc(100dvh-2rem)] rounded-2 ${SIZES[size]}`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Nur ein Klick, der auf dem Backdrop begann und endete, schließt
        if (e.target === e.currentTarget && pressedOnBackdrop.current) e.currentTarget.close();
        pressedOnBackdrop.current = false;
      }}
      className={[
        "bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40 open:flex open:flex-col",
        placement,
      ].join(" ")}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-h2-sm">
            {title}
          </h2>
          <Button
            variant="icon"
            size="sm"
            icon="x"
            aria-label={closeLabel}
            onClick={() => dialogRef.current?.close()}
            className="-mr-2 -mt-1 shrink-0"
          />
        </div>
        <div ref={contentRef}>{children}</div>
      </div>
    </dialog>
  );
}
