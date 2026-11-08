"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  feature?: string; // z. B. "Unlimited collections"
  className?: string;
  /** Nur das Tag, ohne Tooltip und ohne Fokus (z. B. neben Navigationslinks) */
  plain?: boolean;
}

const tagClasses = "inline-flex items-center rounded-1 bg-brand-soft px-1.5 py-0.5 text-caption font-semibold text-brand";

export default function ProBadge({ feature, className = "", plain = false }: Props) {
  const [show, setShow] = useState(false);
  const t = useTranslations("modals");

  if (plain) {
    return <span className={`${tagClasses} ${className}`}>Pro</span>;
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className={`${tagClasses} cursor-default transition-colors hover:bg-line`}
        aria-label={t("proFeature")}
      >
        Pro
      </button>

      {show && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-2 bg-dark px-3 py-2.5 text-caption text-white shadow-float"
        >
          <div className="mb-1 font-semibold">{feature ?? t("proFeature")}</div>
          <div className="mb-2 text-dark-text">{t("proUnlock")}</div>
          <div className="font-semibold text-brand-on-dark">{t("proFrom")}</div>
        </div>
      )}
    </span>
  );
}
