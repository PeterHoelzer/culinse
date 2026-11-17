"use client";

import { usePathname } from "next/navigation";
import { loginHref } from "@/lib/loginRedirect";

/**
 * Verweis auf die Anmeldung, der nach der Anmeldung zur aktuellen Seite zurückführt.
 * Bewusst usePathname aus next/navigation: der Pfad soll die Sprache enthalten.
 */
export function useLoginHref(): string {
  return loginHref(usePathname());
}
