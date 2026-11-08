"use client";

import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import { Button, Icon } from "@/components/ui";

export default function ProSuccessPage() {
  const t = useTranslations("proSuccess");
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-prose mx-auto px-4 py-16 sm:py-24">
        <Icon name="check" size={32} className="text-green mb-4" />
        <h1 className="text-h1-sm sm:text-h1 mb-3">{t("title")}</h1>
        <p className="text-body-lg text-ink-2 mb-8">{t("subtitle")}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href="/collections">{t("goCollections")}</Button>
          <Button href="/" variant="secondary">{t("discover")}</Button>
        </div>
      </main>
    </div>
  );
}
