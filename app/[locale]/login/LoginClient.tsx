"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/lib/navigation";
import { Button, Icon, Input, Notice, Wordmark } from "@/components/ui";

export default function LoginClient() {
  const t = useTranslations("login");
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Die Middleware setzt redirectTo MIT Locale-Präfix (z. B. /de/admin/review).
    // router (next-intl) stellt die Locale beim Push selbst wieder voran —
    // ohne Strip entstünde /de/de/… (404). Deshalb Präfix hier entfernen.
    // Nur interne Pfade zulassen: "https://…" und "//host" (protokoll-relativ)
    // wären sonst ein Open Redirect auf fremde Seiten nach dem Login.
    const rawRedirect = new URLSearchParams(window.location.search).get("redirectTo");
    const isInternalPath = rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//");
    const redirectTo = isInternalPath
      ? rawRedirect!.replace(/^\/(en|de|es|fr|it|pl|tr)(?=\/|$)/, "") || "/"
      : null;

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) router.push("/onboarding");
      else setMessage("confirm");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push(redirectTo || "/");
    }
    setLoading(false);
  };

  const header = (
    <header className="border-b border-line px-4 py-4">
      <div className="max-w-content mx-auto sm:px-6 lg:px-10">
        <Wordmark />
      </div>
    </header>
  );

  if (message === "confirm") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {header}
        <main className="flex-1 px-4 py-12">
          <div className="border border-line rounded-2 p-8 sm:p-10 w-full max-w-md mx-auto">
            <Icon name="mail" size={32} className="text-ink-3 mb-4" />
            <h1 className="text-h2-sm sm:text-h2 mb-3">{t("checkInbox")}</h1>
            <p className="text-base text-ink-2 mb-1">{t("sentTo")}</p>
            <p className="text-base font-semibold text-ink mb-6">{email}</p>
            <p className="text-sm text-ink-3 mb-6">{t("spamNote")}</p>
            <Button variant="quiet" onClick={() => setMessage("")}>
              {t("backToLogin")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `flex-1 h-11 border-b-2 text-base font-semibold transition-colors ${
      active ? "border-brand text-ink" : "border-line text-ink-3 hover:text-ink"
    }`;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {header}

      <main className="flex-1 px-4 py-12">
        <div className="border border-line rounded-2 p-8 sm:p-10 w-full max-w-md mx-auto">
          {/* Tabs */}
          <div role="tablist" aria-label={`${t("logIn")} / ${t("signUp")}`} className="flex mb-8">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => setMode("login")}
              className={tabClass(mode === "login")}
            >
              {t("logIn")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => setMode("signup")}
              className={tabClass(mode === "signup")}
            >
              {t("signUp")}
            </button>
          </div>

          <h1 className="text-h2-sm sm:text-h2 mb-1">
            {mode === "login" ? t("welcomeBack") : t("createAccount")}
          </h1>
          <p className="text-base text-ink-2 mb-6">
            {mode === "login" ? t("loginSub") : t("signupSub")}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label={t("emailLabel")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
            />

            <Input
              type="password"
              label={t("passwordLabel")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t("passwordPlaceholder")}
            />

            {error && <Notice tone="error">{error}</Notice>}

            {mode === "login" && (
              <div className="-mt-1">
                <Link href="/reset-password" className="text-sm text-brand underline underline-offset-[3px] hover:text-brand-hover">
                  {t("forgotPassword")}
                </Link>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              {mode === "login" ? t("loginButton") : t("createButton")}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-caption text-ink-3">{t("or")}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t("googleButton")}
          </Button>

          <p className="text-caption text-ink-3 mt-6">
            {t("privacyNote")}{" "}
            <Link href="/datenschutz" className="underline underline-offset-[3px] hover:text-ink">{t("privacyLink")}</Link>
            {t("privacySuffix")}.
          </p>
        </div>
      </main>
    </div>
  );
}
