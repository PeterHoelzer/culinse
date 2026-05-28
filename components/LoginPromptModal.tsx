"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

interface Props {
  onClose: () => void;
  redirectTo?: string;
}

export default function LoginPromptModal({ onClose, redirectTo }: Props) {
  const t = useTranslations("loginPrompt");
  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">♥</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("title")}</h2>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">{t("subtitle")}</p>

        <div className="flex flex-col gap-3">
          <Link
            href={loginHref as "/"}
            className="block w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#f97316" }}
            onClick={onClose}
          >
            {t("signup")}
          </Link>
          <Link
            href={loginHref as "/"}
            className="block w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            {t("login")}
          </Link>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
