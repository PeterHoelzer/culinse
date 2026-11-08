"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <nav className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-content items-center px-4 sm:px-6">
          {/* Statische Wortmarke: Fehlerseite darf nicht vom Sprachkontext abhängen */}
          <Link href="/" aria-label="Culinse" className="text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">
            culi<span className="text-brand">nse</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-prose flex-1 items-center px-4 py-12 sm:px-6">
        <EmptyState
          className="w-full"
          tone="error"
          icon="alert"
          title={<span role="heading" aria-level={1} className="block font-serif text-h1-sm sm:text-h1">Something went wrong</span>}
          text={
            <>
              An unexpected error occurred. Please try again.
              {error.digest && <span className="tabular mt-2 block text-caption text-ink-3">Error ID: {error.digest}</span>}
            </>
          }
          action={
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset}>Try again</Button>
              <Link href="/" className={buttonClasses({ variant: "secondary" })}>
                Back to home
              </Link>
            </div>
          }
        />
      </main>
    </div>
  );
}
