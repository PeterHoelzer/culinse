"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";

export default function ProSuccessPage() {
  const t = useTranslations("proSuccess");
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          {t("subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#f97316" }}
          >
            {t("goCollections")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {t("discover")}
          </Link>
        </div>
      </div>
    </div>
  );
}
