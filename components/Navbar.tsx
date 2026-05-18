"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted || !data.user) return;
      setUser(data.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", data.user.id)
        .single();
      if (!mounted) return;
      setIsPro(profile?.is_pro ?? false);
    }).catch(() => { /* silently ignore — isPro stays false */ });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-gray-900">
            culi<span style={{ color: "#f97316" }}>nse</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
            Discover
          </Link>
          <Link href="/about" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
            About
          </Link>
          <Link href="/blog" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
            Blog
          </Link>

          {user && (
            <>
              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Wochenplaner */}
              {isPro ? (
                <Link
                  href="/meal-planner"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "white" }}
                >
                  📅 Meal Planner
                </Link>
              ) : (
                <Link
                  href="/pro"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border border-dashed border-orange-200 text-orange-400 hover:bg-orange-50 transition-all"
                >
                  🔒 Meal Planner
                </Link>
              )}

              {/* Collections */}
              {isPro ? (
                <Link
                  href="/collections"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "white" }}
                >
                  📚 Collections
                </Link>
              ) : (
                <Link
                  href="/pro"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border border-dashed border-orange-200 text-orange-400 hover:bg-orange-50 transition-all"
                >
                  🔒 Collections
                </Link>
              )}

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <Link href="/saved" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
                ♥ Saved
              </Link>
            </>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isPro && (
                <Link
                  href="/pro"
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-orange-300 text-orange-500 hover:bg-orange-50 transition-all"
                >
                  ✦ Upgrade
                </Link>
              )}
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white hover:opacity-80 transition-opacity"
                style={{ background: isPro ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" : "#9ca3af" }}
                title="My Profile"
              >
                {user.email?.[0]?.toUpperCase() ?? "👤"}
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
              <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#f97316" }}>
                Get Started →
              </Link>
            </>
          )}
        </div>

        {/* Mobile: right side */}
        <div className="flex md:hidden items-center gap-2">
          {!user && (
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#f97316" }}>
              Join
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 hover:text-orange-500 transition-colors">
            🔍 Discover
          </Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 hover:text-orange-500 transition-colors">
            👋 About
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 hover:text-orange-500 transition-colors">
            📝 Blog
          </Link>

          {user && (
            <>
              <div className="h-px bg-gray-100 my-1" />

              {/* Wochenplaner */}
              {isPro ? (
                <Link
                  href="/meal-planner"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                >
                  📅 Meal Planner
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Pro</span>
                </Link>
              ) : (
                <Link
                  href="/pro"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-orange-200 text-orange-400"
                >
                  🔒 Meal Planner
                  <span className="ml-auto text-xs text-orange-300">Upgrade →</span>
                </Link>
              )}

              {/* Collections */}
              {isPro ? (
                <Link
                  href="/collections"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                >
                  📚 Collections
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Pro</span>
                </Link>
              ) : (
                <Link
                  href="/pro"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-orange-200 text-orange-400"
                >
                  🔒 Collections
                  <span className="ml-auto text-xs text-orange-300">Upgrade →</span>
                </Link>
              )}

              <div className="h-px bg-gray-100 my-1" />

              <Link href="/saved" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 hover:text-orange-500 transition-colors">
                ♥ Saved
              </Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 hover:text-orange-500 transition-colors">
                👤 Profile {isPro && <span className="text-xs text-orange-400 ml-1">✦ Pro</span>}
              </Link>
            </>
          )}

          <div className="h-px bg-gray-100 my-1" />

          {user ? (
            <button onClick={handleLogout} className="text-sm font-medium text-gray-500 py-2.5 text-left hover:text-gray-900 transition-colors">
              Log out
            </button>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">Log in</Link>
          )}
        </div>
      )}
    </nav>
  );
}
