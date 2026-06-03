"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

interface Props {
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function UpgradeModal({ onClose, title, message }: Props) {
  const t = useTranslations("modals");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">⭐</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {title ?? t("upgradeTitle")}
        </h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {message ?? t("upgradeMessage")}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/pro"
            className="w-full py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            onClick={onClose}
          >
            {t("seePlans")}
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t("maybeLater")}
          </button>
        </div>
      </div>
    </div>
  );
}
