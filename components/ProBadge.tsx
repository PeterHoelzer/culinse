"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
interface Props {
  feature?: string;  // e.g. "Unlimited collections"
  className?: string;
}

export default function ProBadge({ feature, className = "" }: Props) {
  const [show, setShow] = useState(false);
  const t = useTranslations("modals");

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors cursor-default"
        aria-label={t("proFeature")}
      >
        ✦ Pro
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl pointer-events-none">
          <div className="font-semibold mb-1">
            {feature ?? t("proFeature")}
          </div>
          <div className="text-gray-400 mb-2">
            {t("proUnlock")}
          </div>
          <div className="text-orange-400 font-medium">
            {t("proFrom")}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
}
