"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Input, Notice, buttonClasses } from "@/components/ui";

/*
  Newsletter (DESIGN.md §1, §5): die einzige getönte Fläche der Startseite,
  kein Dunkel, kein Emoji. Sichtbares Label am E-Mail-Feld, Erfolg und
  Fehler als Notice.
*/
export default function NewsletterBanner() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const de = locale === "de";
  const pdfHref = de ? "/downloads/culinse-7-tage-meal-prep-plan.pdf" : "/downloads/culinse-7-day-meal-prep-plan.pdf";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "already">("idle");

  const emailLabel = t.has("emailLabel") ? t("emailLabel") : de ? "E-Mail-Adresse" : "Email address";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.already ? "already" : "success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const done = status === "success" || status === "already";

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2 border border-line bg-surface p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-12">
          <div className="flex flex-col gap-3">
            <h2 className="text-h2-sm sm:text-h2">{t("title")}</h2>
            <p className="max-w-prose text-base text-ink-2">{t("subtitle")}</p>
          </div>

          {done ? (
            <div className="flex flex-col items-start gap-4">
              <Notice tone="success">{status === "already" ? t("already") : t("success")}</Notice>
              <a href={pdfHref} download className={buttonClasses({ variant: "secondary" })}>
                {t("download")}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  label={emailLabel}
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("placeholder")}
                  required
                  className="flex-1"
                />
                <Button type="submit" loading={status === "sending"} className="shrink-0">
                  {t("button")}
                </Button>
              </div>
              {status === "error" && <Notice tone="error">{t("error")}</Notice>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
