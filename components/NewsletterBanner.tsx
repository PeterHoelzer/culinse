"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function NewsletterBanner() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "already">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");

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
  };

  return (
    <section className="bg-gray-900 py-14 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="text-3xl mb-4">✉️</div>
        <h2 className="text-2xl font-bold text-white mb-2">{t("title")}</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">{t("subtitle")}</p>

        {status === "success" || status === "already" ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-4">
            <p className="text-green-400 font-semibold text-sm">
              {status === "already" ? t("already") : t("success")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#f97316" }}
            >
              {status === "sending" ? t("sending") : t("button")}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-red-400 text-xs mt-3">{t("error")}</p>
        )}
      </div>
    </section>
  );
}
