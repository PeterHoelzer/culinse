"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button, Icon } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

interface Props {
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function UpgradeModal({ onClose, title, message }: Props) {
  const t = useTranslations("modals");
  const de = useLocale() === "de";
  const text = (key: string, deStr: string, enStr: string) => (t.has(key) ? t(key) : de ? deStr : enStr);

  const features = [
    text("upgradeFeatureSave", "Rezepte unbegrenzt speichern", "Save unlimited recipes"),
    text("upgradeFeatureCollections", "Eigene Sammlungen ohne Limit", "Collections without a limit"),
    text("upgradeFeaturePlans", "Mehrere Wochenpläne", "Several weekly plans"),
  ];

  return (
    <Dialog open onClose={onClose} title={title ?? t("upgradeTitle")} size="sm">
      <p className="mb-5 text-base text-ink-2">{message ?? t("upgradeMessage")}</p>
      <p className="mb-5 font-serif text-display-sm tabular">{t("proFrom")}</p>
      <ul className="mb-6 flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-base">
            <Icon name="check" size={20} className="mt-0.5 shrink-0 text-green" />
            {f}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3">
        <Button href="/pro" onClick={onClose} fullWidth>
          {t("seePlans")}
        </Button>
        <Button variant="quiet" onClick={onClose} className="self-center">
          {t("maybeLater")}
        </Button>
      </div>
    </Dialog>
  );
}
