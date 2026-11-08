"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Link } from "@/lib/navigation";
import { Button, Chip, ChipRow, Icon, Notice, SectionHeader, Skeleton, type IconName } from "@/components/ui";
import { FREE_FOR_ALL } from "@/lib/freeMode";

const DIET_VALUES = ["", "vegetarian", "vegan", "ketogenic", "paleo", "gluten free", "whole30"];

const INTOLERANCE_VALUES = ["dairy", "egg", "gluten", "peanut", "tree nut", "soy", "seafood", "shellfish", "wheat", "sulfite"];

const TIME_VALUES = [0, 15, 30, 60];

const PRO_FEATURE_ICONS: IconName[] = ["book", "calendar", "cart", "globe", "star"];

export default function ProfilePage() {
  const t = useTranslations("profile");
  const dietOptions = t.raw("dietOptions") as { label: string; desc: string }[];
  const intoleranceOptions = t.raw("intoleranceOptions") as string[];
  const timeOptions = t.raw("timeOptions") as { label: string }[];
  const proFeatures = t.raw("proFeatures") as string[];

  const [isWelcome, setIsWelcome] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [diet, setDiet] = useState("");
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedState, setSavedState] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proExpiry, setProExpiry] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setIsWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
      if (!data.user) {
        const locale = window.location.pathname.split("/")[1] || "en";
        const supported = ["en", "de", "es", "fr", "it", "pl", "tr", "nl", "cs", "ru", "pt", "zh", "ja", "id", "vi", "bn"];
        const l = supported.includes(locale) ? locale : "en";
        window.location.href = `/${l}/login`;
        return;
      }
      setUser(data.user);

      const [{ data: prefs }, { data: profile }] = await Promise.all([
        supabase.from("user_preferences").select("*").eq("user_id", data.user.id).single(),
        supabase.from("profiles").select("is_pro, pro_expires_at").eq("id", data.user.id).single(),
      ]);

      if (prefs) {
        setDiet(prefs.diet || "");
        setIntolerances(prefs.intolerances || []);
        setMaxTime(prefs.max_time || 0);
      }
      if (profile) {
        setIsPro(FREE_FOR_ALL || (profile.is_pro ?? false));
        setProExpiry(profile.pro_expires_at ?? null);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    setBillingLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setBillingLoading(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setBillingLoading(false);
  };

  const toggleIntolerance = (value: string) => {
    setIntolerances(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      diet,
      intolerances,
      max_time: maxTime,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    setSavedState(true);
    setTimeout(() => setSavedState(false), 2500);
  };

  const completed = [diet !== "", intolerances.length > 0, maxTime > 0].filter(Boolean).length;

  const progressMsg = [
    t("progress0"),
    t("progress1"),
    t("progress2"),
    t("progress3"),
  ][completed];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const activeDietDesc = dietOptions[DIET_VALUES.indexOf(diet)]?.desc;
  const saveLabel = saving ? t("saving") : t("saveButton");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        {isWelcome && <Notice tone="success" className="mb-6">{t("welcomeBanner")}</Notice>}

        <SectionHeader
          as="h1"
          title={t("pageTitle")}
          subtitle={
            <>
              {user?.email}
              <span className="block text-sm text-ink-3 tabular">{completed}/3 · {progressMsg}</span>
            </>
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button onClick={handleSave} loading={saving} disabled={saving}>{saveLabel}</Button>
          <div aria-live="polite">{savedState && <Notice tone="success">{t("saved")}</Notice>}</div>
        </div>

        <div className="max-w-prose">
          {/* Abo */}
          <section aria-labelledby="plan-title" className="border-t border-line py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="plan-title" className="text-h3">{isPro ? t("planPro") : t("planFree")}</h2>
              <span className="text-sm font-semibold text-ink-2">{isPro ? t("active") : t("free")}</span>
            </div>
            {isPro && proExpiry && (
              <p className="mt-1 text-sm text-ink-3">
                {t("renews", { date: new Date(proExpiry).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) })}
              </p>
            )}

            <ul className="mt-4 mb-5 space-y-2">
              {proFeatures.map((label, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Icon name={PRO_FEATURE_ICONS[i] ?? "check"} size={20} className={isPro ? "text-green" : "text-ink-3"} />
                  <span className={`text-base ${isPro ? "text-ink" : "text-ink-2"}`}>{label}</span>
                  {!isPro && <Icon name="lock" size={16} className="ml-auto text-ink-3" label={t("free")} />}
                </li>
              ))}
            </ul>

            {isPro ? (
              <Button variant="secondary" onClick={handleManageBilling} loading={billingLoading}>
                {t("manageSubscription")}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleUpgrade} loading={billingLoading}>
                {t("upgradeButton")}
              </Button>
            )}
          </section>

          {/* Ernährung */}
          <section aria-labelledby="diet-title" className="border-t border-line py-8">
            <h2 id="diet-title" className="text-h3">{t("dietTitle")}</h2>
            <p className="mt-1 mb-4 text-base text-ink-2">{t("dietSub")}</p>
            <ChipRow>
              {dietOptions.map((opt, i) => (
                <Chip key={DIET_VALUES[i]} active={diet === DIET_VALUES[i]} onClick={() => setDiet(DIET_VALUES[i])}>
                  {opt.label}
                </Chip>
              ))}
            </ChipRow>
            {activeDietDesc && <p className="mt-3 text-sm text-ink-3">{activeDietDesc}</p>}
          </section>

          {/* Unverträglichkeiten */}
          <section aria-labelledby="allergen-title" className="border-t border-line py-8">
            <h2 id="allergen-title" className="text-h3">{t("allergenTitle")}</h2>
            <p className="mt-1 mb-4 text-base text-ink-2">
              {t("allergenSub")}
              {intolerances.length > 0 && <span className="ml-2 font-semibold text-ink">{t("nActive", { n: intolerances.length })}</span>}
            </p>
            <ChipRow>
              {intoleranceOptions.map((label, i) => (
                <Chip
                  key={INTOLERANCE_VALUES[i]}
                  active={intolerances.includes(INTOLERANCE_VALUES[i])}
                  onClick={() => toggleIntolerance(INTOLERANCE_VALUES[i])}
                >
                  {label}
                </Chip>
              ))}
            </ChipRow>
          </section>

          {/* Zeit */}
          <section aria-labelledby="time-title" className="border-t border-line py-8">
            <h2 id="time-title" className="text-h3">{t("timeTitle")}</h2>
            <p className="mt-1 mb-4 text-base text-ink-2">{t("timeSub")}</p>
            <ChipRow>
              {timeOptions.map((opt, i) => (
                <Chip key={TIME_VALUES[i]} active={maxTime === TIME_VALUES[i]} onClick={() => setMaxTime(TIME_VALUES[i])}>
                  {opt.label}
                </Chip>
              ))}
            </ChipRow>
          </section>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
            <Button onClick={handleSave} loading={saving} disabled={saving}>{saveLabel}</Button>
            <Link href="/" className="text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
              {t("back")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
