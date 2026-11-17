"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Notice, Wordmark } from "@/components/ui";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const t = useTranslations("passwordPages");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t("mismatch")); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); } else { setDone(true); }
    setLoading(false);
  };

  const mismatch = confirm.length > 0 && password !== confirm ? t("mismatch") : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="max-w-content mx-auto flex h-16 items-center px-4 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="max-w-content mx-auto w-full flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-md">
          {done ? (
            <div>
              <h1 className="text-h1-sm sm:text-h1">{t("doneTitle")}</h1>
              <Notice tone="success" className="mt-4 mb-6">{t("doneText")}</Notice>
              <Button href="/login">{t("toLogin")}</Button>
            </div>
          ) : (
            <>
              <h1 className="text-h1-sm sm:text-h1">{t("newTitle")}</h1>
              <p className="mt-2 mb-6 text-body-lg text-ink-2">{t("newIntro")}</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label={t("newLabel")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  hint={t("newHint")}
                />
                <Input
                  label={t("confirmLabel")}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  error={mismatch}
                />
                {error && !mismatch && <Notice tone="error">{error}</Notice>}
                <div>
                  <Button type="submit" loading={loading}>{t("updateButton")}</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
