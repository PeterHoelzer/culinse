"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FREE_FOR_ALL } from "@/lib/freeMode";
import { Button, Chip, Icon, Notice } from "@/components/ui";

export default function ProPage() {
  const t = useTranslations("pro");
  const freeFeatures = t.raw("freeFeatures") as string[];
  const proFeatures = t.raw("proFeatures") as { icon: string; label: string; sub: string }[];
  const faqItems = t.raw("faqItems") as { q: string; a: string }[];

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", data.user.id)
          .single();
        setIsPro(profile?.is_pro ?? false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    if (!user) { window.location.href = "/login?next=/pro"; return; }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  };

  const handlePortal = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  };

  const primaryLabel = plan === "annual" ? t("annualStartButton") : t("startButton");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-16 pb-24">
        {/* Hero */}
        <header className="max-w-prose">
          <p className="text-sm text-ink-3 mb-3">Culinse Pro</p>
          <h1 className="text-display-sm md:text-display mb-5">
            {t("heroTitle").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-body-lg text-ink-2 mb-8">{t("heroSubtitle")}</p>

          {FREE_FOR_ALL ? (
            <Notice tone="success">{t("freeForAllBadge")}</Notice>
          ) : isPro ? (
            <Notice tone="success">{t("alreadyPro")}</Notice>
          ) : (
            <div className="flex flex-col items-start gap-4">
              {/* Plan toggle */}
              <div role="group" aria-label={`${t("monthlyLabel")} / ${t("annualLabel")}`} className="flex flex-wrap gap-2">
                <Chip active={plan === "monthly"} onClick={() => setPlan("monthly")}>
                  {t("monthlyLabel")}
                </Chip>
                <Chip active={plan === "annual"} onClick={() => setPlan("annual")}>
                  {t("annualLabel")}, {t("annualSave")}
                </Chip>
              </div>

              <Button onClick={handleUpgrade} loading={loading}>
                {primaryLabel}
              </Button>
              <p className="text-caption text-ink-3">{t("cancelNote")}</p>
            </div>
          )}
        </header>

        {/* Tarife */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 max-w-4xl">
          {/* Free */}
          <section aria-labelledby="plan-free" className="border border-line rounded-2 p-8">
            <h2 id="plan-free" className="text-h3 mb-2">{t("freeLabel")}</h2>
            <p className="font-serif text-display-sm tabular mb-6">€0</p>
            <ul className="space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-base text-ink">
                  <Icon name="check" size={20} className="text-green shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* Pro */}
          <section aria-labelledby="plan-pro" className="border-2 border-brand rounded-2 p-8">
            <h2 id="plan-pro" className="text-h3 mb-2">{t("proLabel")}</h2>
            <p className="font-serif text-display-sm tabular">
              {plan === "annual" ? t("annualPrice") : t("monthlyPrice")}
            </p>
            {plan === "annual" && (
              <p className="text-sm text-green font-semibold tabular mt-1">{t("annualTotal")}</p>
            )}
            <p className="text-sm text-ink-3 mt-1 mb-6">
              {plan === "annual" ? t("billedAnnually") : t("billedMonthly")}
            </p>
            <ul className="space-y-4">
              {proFeatures.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <Icon name="check" size={20} className="text-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-base font-semibold text-ink">{f.label}</p>
                    <p className="text-sm text-ink-2">{f.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTA */}
        <div className="max-w-prose mt-10">
          {FREE_FOR_ALL ? (
            <p className="text-body-lg text-ink-2">{t("freeForAllNote")}</p>
          ) : isPro ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-base text-ink-2">{t("activeNote")}</p>
              <Button variant="secondary" onClick={handlePortal} loading={loading}>
                {t("manageButton")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <Button onClick={handleUpgrade} loading={loading}>
                {primaryLabel}
              </Button>
              <p className="text-caption text-ink-3">{t("cancelNote")}</p>
              <p className="text-caption text-ink-3">
                {t("legalNote")}{" "}
                <Link href="/agb" className="underline underline-offset-[3px] hover:text-brand">{t("agbLabel")}</Link>
                {" "}{t("legalAnd")}{" "}
                <Link href="/widerruf" className="underline underline-offset-[3px] hover:text-brand">{t("widerrufLabel")}</Link>.
              </p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="max-w-prose">
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{t("faqTitle")}</h2>
          <div className="border-b border-line">
            {faqItems.map(({ q, a }) => (
              <details key={q} className="border-t border-line py-4">
                <summary className="cursor-pointer font-serif text-h3 text-ink">{q}</summary>
                <p className="text-body-lg text-ink-2 mt-3">{a}</p>
              </details>
            ))}
          </div>

          <p className="text-base text-ink-2 mt-8">
            {t("questions")}{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">
              peter@hoelzer.xyz
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-8 px-4">
        <div className="max-w-content mx-auto sm:px-6 lg:px-10 flex flex-wrap gap-6 text-sm text-ink-3">
          <Link href="/impressum" className="hover:text-ink hover:underline underline-offset-[3px]">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-ink hover:underline underline-offset-[3px]">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
