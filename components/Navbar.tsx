"use client";

import { useState, useEffect, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadSupabase, loadSupabaseAfterPageLoad } from "@/lib/supabase/lazy";
import type { User } from "@supabase/supabase-js";
import { Link, usePathname, useRouter } from "@/lib/navigation";
import { routing } from "@/i18n/routing";
import { Button, Icon, Wordmark } from "@/components/ui";
import ProBadge from "@/components/ProBadge";

const navLink = "text-sm font-semibold text-ink hover:underline underline-offset-[3px]";
const menuLink = "flex items-center gap-2 py-3 text-base font-semibold text-ink hover:underline underline-offset-[3px]";

function LocaleSwitcher({ label }: { label: string }) {
  const pathname = usePathname(); // Pfad OHNE Sprachpräfix, z. B. "/about"
  const locale = useLocale();
  const router = useRouter();

  // Seit Welle 1 des Sprachausbaus (14.09.2026) sieben Sprachen. Liste kommt
  // aus i18n/routing.ts, neue Sprachen erscheinen hier automatisch.
  return (
    <label className="relative inline-flex items-center text-ink">
      <Icon name="globe" size={18} className="pointer-events-none absolute left-2.5" />
      <select
        value={locale}
        onChange={(e) => router.replace(pathname as "/", { locale: e.target.value })}
        aria-label={label}
        className="h-10 cursor-pointer rounded-1 border border-line-strong bg-surface pl-8 pr-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const menuLabel = t.has("menu") ? t("menu") : locale === "de" ? "Menü" : "Menu";
  const languageLabel = t.has("language") ? t("language") : locale === "de" ? "Sprache" : "Language";

  useEffect(() => {
    let mounted = true;
    loadSupabaseAfterPageLoad().then(async (supabase) => {
      const { data } = await supabase.auth.getUser();
      if (!mounted || !data.user) return;
      setUser(data.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", data.user.id)
        .single();
      if (!mounted) return;
      setIsPro(profile?.is_pro ?? false);
    }).catch(() => { /* still ignorieren: isPro bleibt false */ });
    return () => { mounted = false; };
  }, []);

  // Escape schließt das mobile Menü
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    const supabase = await loadSupabase();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  const close = () => setMenuOpen(false);
  // Ohne Anmeldung zeigt die Leiste ab md alles Nötige, eingeloggt erst ab lg
  const menuVisibility = user ? "lg:hidden" : "md:hidden";

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark className="shrink-0" />

        {/* Desktop-Navigation ab md */}
        <div className="hidden items-center gap-5 whitespace-nowrap md:flex">
          <Link href="/" className={navLink}>{t("discover")}</Link>
          <Link href="/blog" className={navLink}>{t("blog")}</Link>
          <Link href="/grocery-list-calculator" className={navLink}>{t("calculator")}</Link>

          {user && (
            <div className="hidden items-center gap-5 lg:flex">
              <span className="h-5 w-px bg-line" aria-hidden="true" />
              {isPro ? (
                <span className="inline-flex items-center gap-1.5">
                  <Link href="/meal-planner" className={navLink}>{t("mealPlanner")}</Link>
                  <ProBadge plain />
                </span>
              ) : (
                <Link href="/pro" className={`${navLink} inline-flex items-center gap-1.5`}>
                  <Icon name="lock" size={16} />
                  {t("mealPlanner")}
                </Link>
              )}
              {isPro ? (
                <span className="inline-flex items-center gap-1.5">
                  <Link href="/collections" className={navLink}>{t("collections")}</Link>
                  <ProBadge plain />
                </span>
              ) : (
                <Link href="/pro" className={`${navLink} inline-flex items-center gap-1.5`}>
                  <Icon name="lock" size={16} />
                  {t("collections")}
                </Link>
              )}
              <Link href="/my-recipes" className={navLink}>{t("myRecipesShort")}</Link>
              <Link href="/saved" className={navLink}>{t("saved")}</Link>
            </div>
          )}
        </div>

        {/* Rechte Seite */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher label={languageLabel} />

          <div className="hidden items-center gap-4 whitespace-nowrap md:flex">
            {user ? (
              <>
                <Button variant="icon" size="sm" icon="user" href="/profile" aria-label={t("profile")} title={t("profile")} />
                <button type="button" onClick={handleLogout} className={`${navLink} hidden lg:inline`}>
                  {t("logout")}
                </button>
              </>
            ) : (
              <Button size="sm" href="/login">{t("login")}</Button>
            )}
          </div>

          <Button
            variant="icon"
            size="sm"
            icon={menuOpen ? "x" : "menu"}
            aria-label={menuLabel}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
            className={user ? "lg:hidden" : "md:hidden"}
          />
        </div>
      </div>

      {/* Mobiles Menü */}
      {menuOpen && (
        <div id={menuId} className={`${menuVisibility} border-t border-line bg-surface shadow-float`}>
          <div className="mx-auto flex max-w-content flex-col px-4 py-2 sm:px-6">
            <Link href="/" onClick={close} className={`${menuLink} md:hidden`}>{t("discover")}</Link>
            <Link href="/about" onClick={close} className={menuLink}>{t("about")}</Link>
            <Link href="/blog" onClick={close} className={`${menuLink} md:hidden`}>{t("blog")}</Link>
            <Link href="/grocery-list-calculator" onClick={close} className={`${menuLink} md:hidden`}>{t("calculator")}</Link>

            {user && (
              <>
                <div className="my-1 h-px bg-line" />
                {isPro ? (
                  <span className="flex items-center gap-2">
                    <Link href="/meal-planner" onClick={close} className={menuLink}>{t("mealPlanner")}</Link>
                    <ProBadge plain />
                  </span>
                ) : (
                  <Link href="/pro" onClick={close} className={menuLink}>
                    <Icon name="lock" size={16} />
                    {t("mealPlanner")}
                  </Link>
                )}
                {isPro ? (
                  <span className="flex items-center gap-2">
                    <Link href="/collections" onClick={close} className={menuLink}>{t("collections")}</Link>
                    <ProBadge plain />
                  </span>
                ) : (
                  <Link href="/pro" onClick={close} className={menuLink}>
                    <Icon name="lock" size={16} />
                    {t("collections")}
                  </Link>
                )}
                <div className="my-1 h-px bg-line" />
                <Link href="/my-recipes" onClick={close} className={menuLink}>{t("myRecipes")}</Link>
                <Link href="/saved" onClick={close} className={menuLink}>{t("saved")}</Link>
                <Link href="/profile" onClick={close} className={menuLink}>
                  {t("profile")}
                  {isPro && <ProBadge plain />}
                </Link>
              </>
            )}

            <div className="my-1 h-px bg-line" />
            {user ? (
              <button type="button" onClick={handleLogout} className={`${menuLink} text-left`}>
                {t("logout")}
              </button>
            ) : (
              <Link href="/login" onClick={close} className={menuLink}>{t("login")}</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
