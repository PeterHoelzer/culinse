"use client";

import type { MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import { useLoginLink } from "@/lib/useLoginHref";

interface Props {
  onClose: () => void;
}

export default function LoginPromptModal({ onClose }: Props) {
  const t = useTranslations("loginPrompt");
  // Nach der Anmeldung zurück auf die Seite, auf der der Dialog aufging.
  const login = useLoginLink();
  const toLogin = (event: MouseEvent<HTMLAnchorElement>) => {
    onClose();
    login.onClick(event);
  };

  return (
    <Dialog open onClose={onClose} title={t("title")} size="sm">
      <p className="mb-6 text-base text-ink-2">{t("subtitle")}</p>
      <div className="flex flex-col gap-3">
        <Button href={login.href} onClick={toLogin} fullWidth>
          {t("signup")}
        </Button>
        <Button href={login.href} variant="secondary" onClick={toLogin} fullWidth>
          {t("login")}
        </Button>
        <Button variant="quiet" onClick={onClose} className="self-center">
          {t("cancel")}
        </Button>
      </div>
    </Dialog>
  );
}
