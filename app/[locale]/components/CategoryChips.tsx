"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Chip, ChipRow } from "@/components/ui";
import { EN_CATEGORIES } from "./home-types";

/*
  Die eine sichtbare Chip-Reihe (DESIGN.md §5). `leading` und `trailing`
  nehmen weitere Chips in dieselbe Reihe auf (z. B. „Filter“, „Für dich“),
  damit nicht eine zweite Reihe entsteht.
*/
export default function CategoryChips({
  active,
  setActive,
  leading,
  trailing,
}: {
  active: string;
  setActive: (v: string) => void;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const t = useTranslations();
  const categories = t.raw("categories") as string[];

  return (
    <ChipRow>
      {leading}
      {categories.map((cat, i) => {
        const enVal = EN_CATEGORIES[i] ?? cat;
        return (
          <Chip key={enVal} active={active === enVal} onClick={() => setActive(enVal)}>
            {cat}
          </Chip>
        );
      })}
      {trailing}
    </ChipRow>
  );
}
