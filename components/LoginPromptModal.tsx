"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import { useLoginHref } from "@/lib/useLoginHref";

interface Props {
  onClose: () => void;
}

export default function LoginPromptModal({ onClose }: Props) {
  const t = useTranslations("loginPrompt");
  // Nach der Anmeldung zurück auf die Seite, auf der der Dialog aufging.
  const loginHref = useLoginHref();

  return (
    <Dialog open onClose={onClose} title={t("title")} size="sm">
      <p className="mb-6 text-base text-ink-2">{t("subtitle")}</p>
      <div className="flex flex-col gap-3">
        <Button href={loginHref} onClick={onClose} fullWidth>
          {t("signup")}
        </Button>
        <Button href={loginHref} variant="secondary" onClick={onClose} fullWidth>
          {t("login")}
        </Button>
        <Button variant="quiet" onClick={onClose} className="self-center">
          {t("cancel")}
        </Button>
      </div>
    </Dialog>
  );
}
