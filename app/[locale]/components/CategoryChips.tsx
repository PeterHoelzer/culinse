"use client";

import { useTranslations } from "next-intl";
import { EN_CATEGORIES } from "./home-types";

export default function CategoryChips({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  const t = useTranslations();
  const categories = t.raw("categories") as string[];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat, i) => {
        const enVal = EN_CATEGORIES[i] ?? cat;
        return (
          <button
            key={enVal}
            onClick={() => setActive(enVal)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              active === enVal
                ? "text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
            }`}
            style={active === enVal ? { background: "#f97316", borderColor: "#f97316" } : {}}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
