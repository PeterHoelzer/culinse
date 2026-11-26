"use client";

import { useEffect } from "react";
import SystemPage from "@/components/SystemPage";

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

  // Texte in der Sprache der Adresse, siehe components/SystemPage.tsx
  return <SystemPage kind="error" digest={error.digest} onRetry={reset} />;
}
