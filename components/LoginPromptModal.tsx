"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

interface Props {
  onClose: () => void;
  redirectTo?: string;
}

export default function LoginPromptModal({ onClose, redirectTo }: Props) {
  const t = useTranslations("loginPrompt");
  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";

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
