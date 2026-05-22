"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("login");
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

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) window.location.href = "/";
      else setMessage("confirm");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/";
    }
    setLoading(false);
  };

  if (message === "confirm") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <span className="text-2xl">🍳</span>
              <span className="text-xl font-bold text-gray-900">
                culi<span style={{ color: "#f97316" }}>nse</span>
              </span>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md text-center">
            <div className="text-6xl mb-6">📬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("checkInbox")}</h2>
            <p className="text-gray-500 text-sm mb-2">{t("sentTo")}</p>
            <p className="font-semibold text-gray-900 text-sm mb-6">{email}</p>
            <p className="text-gray-400 text-xs mb-8">{t("spamNote")}</p>
            <button onClick={() => setMessage("")} className="text-sm text-orange-500 hover:underline">
              {t("backToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              {t("logIn")}
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              {t("signUp")}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === "login" ? t("welcomeBack") : t("createAccount")}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {mode === "login" ? t("loginSub") : t("signupSub")}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("emailPlaceholder")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#f97316" } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("passwordLabel")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t("passwordPlaceholder")}
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {mode === "login" && (
              <div className="text-right -mt-2">
                <a href="/reset-password" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
                  {t("forgotPassword")}
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#f97316" }}
            >
              {loading ? t("loading") : mode === "login" ? t("loginButton") : t("createButton")}
            </button>
          </form>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{t("or")}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t("googleButton")}
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            {t("privacyNote")}{" "}
            <Link href="/datenschutz" className="underline hover:text-gray-600">{t("privacyLink")}</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
