"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { loadSupabaseAfterPageLoad } from "@/lib/supabase/lazy";
import type { User } from "@supabase/supabase-js";
import SharedNavbar from "@/components/Navbar";
import NewsletterBanner from "@/components/NewsletterBanner";
import Hero from "./components/Hero";
import DiscoverSection from "./components/DiscoverSection";
import ForYouSection from "./components/ForYouSection";
import VideoSection from "./components/VideoSection";
import HowItWorks from "./components/HowItWorks";
import FamilySection from "./components/FamilySection";
import HomeFooter from "./components/HomeFooter";
import type { DishColors, Recipe } from "./components/home-types";

// Merge the given keys into the current URL query string without triggering a
// navigation. Empty/undefined values remove the key. Used so the user's search
// and filter selection survives navigating to a recipe and pressing "back".
function updateUrlParams(updates: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

function scrollToDiscover(smooth = true) {
  document
    .getElementById("discover")
    ?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
}

export default function Home({
  seoSection,
  initialRecipes,
  featured,
  heroColors,
}: {
  seoSection?: ReactNode;
  initialRecipes?: Recipe[];
  /** Rezept des Tages für den Hero; fällt auf die erste Discover-Karte zurück. */
  featured?: Recipe | null;
  /** Farben aus dem Foto des Tagesrezepts (serverseitig). */
  heroColors?: DishColors | null;
}) {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    loadSupabaseAfterPageLoad()
      .then((supabase) => {
        if (cancelled) return;
        supabase.auth.getUser().then(({ data }) => { if (!cancelled) setUser(data.user); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      // Lädt der Client nicht, gilt der Besucher als abgemeldet.
      .catch(() => { if (!cancelled) setUser(null); });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Restore search + category from the URL on mount (e.g. after pressing the
  // browser back button from a recipe page). Done in an effect to avoid any
  // server/client hydration mismatch.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    const cat = params.get("cat") ?? "All";
    // One-time restore from the URL on mount; rendering identical to the server
    // on first paint avoids a hydration mismatch, so the setState here is intentional.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (q) {
      setSearch(q);
      setActiveSearch(q);
    }
    if (cat && cat !== "All") setCategory(cat);
    /* eslint-enable react-hooks/set-state-in-effect */
    // If a specific recipe card was clicked, DiscoverSection scrolls precisely
    // back to it — so skip the generic "scroll to results" jump here.
    let hasPreciseReturn = false;
    try { hasPreciseReturn = !!sessionStorage.getItem("culinse:returnTo"); } catch {}
    if (!hasPreciseReturn && (q || (cat && cat !== "All"))) {
      // Let the layout settle before scrolling back down to the results.
      setTimeout(() => scrollToDiscover(false), 120);
    }
  }, []);

  const handleSearch = () => {
    setActiveSearch(search);
    setCategory("All");
    updateUrlParams({ q: search || undefined, cat: undefined });
    scrollToDiscover(true);
  };

  // Keep category changes (from the chips inside DiscoverSection) in the URL too.
  const handleSetCategory = useCallback((value: string) => {
    setCategory(value);
    updateUrlParams({ cat: value && value !== "All" ? value : undefined });
  }, []);

  return (
    <>
      <SharedNavbar />
      <main className="flex-1">
        <Hero search={search} setSearch={setSearch} onSearch={handleSearch} featured={featured ?? initialRecipes?.[0] ?? null} colors={heroColors ?? null} />
        <ForYouSection user={user} onLoaded={() => {}} />
        <DiscoverSection search={activeSearch} category={category} setCategory={handleSetCategory} user={user} initialRecipes={initialRecipes} />
        <FamilySection />
        <VideoSection />
        <HowItWorks />
        <NewsletterBanner />
        {seoSection}
      </main>
      <HomeFooter />
    </>
  );
}
