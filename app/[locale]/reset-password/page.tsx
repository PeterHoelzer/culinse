"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/lib/navigation";
import { Button, Input, Notice, Wordmark } from "@/components/ui";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations("passwordPages");
  const tLogin = useTranslations("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Mit Sprache: Daran erkennt die Mail-Vorlage, in welcher Sprache sie
      // schreiben soll (mail/bauen.mjs, spracheAusRuecksprung). Ohne Sprache
      // leitete die Seite ohnehin auf dieselbe Adresse weiter.
      redirectTo: `${window.location.origin}/${locale}/update-password`,
    });
    if (error) { setError(error.message); } else { setSent(true); }
    setLoading(false);
  };

  const linkClass = "text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]";

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="max-w-content mx-auto flex h-16 items-center px-4 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="max-w-content mx-auto w-full flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-md">
          {sent ? (
            <div>
              <h1 className="text-h1-sm sm:text-h1">{t("sentTitle")}</h1>
              <Notice tone="success" className="mt-4 mb-6">
                {t.rich("sentText", { email, strong: (chunks) => <strong>{chunks}</strong> })}
              </Notice>
              <Link href="/login" className={linkClass}>{tLogin("backToLogin")}</Link>
            </div>
          ) : (
            <>
              <h1 className="text-h1-sm sm:text-h1">{t("resetTitle")}</h1>
              <p className="mt-2 mb-6 text-body-lg text-ink-2">{t("resetIntro")}</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label={tLogin("emailLabel")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder={tLogin("emailPlaceholder")}
                />
                {error && <Notice tone="error">{error}</Notice>}
                <div>
                  <Button type="submit" loading={loading}>{t("sendLink")}</Button>
                </div>
              </form>
              <p className="mt-6">
                <Link href="/login" className={linkClass}>{tLogin("backToLogin")}</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
