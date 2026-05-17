"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-gray-900">
            culi<span style={{ color: "#f97316" }}>nse</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-orange-500 transition-colors">Discover</Link>
          <Link href="/about" className="hover:text-orange-500 transition-colors">About</Link>
          {user && <Link href="/wochenplaner" className="hover:text-orange-500 transition-colors">📅 Wochenplaner</Link>}
          {user && <Link href="/collections" className="hover:text-orange-500 transition-colors">📚 Collections</Link>}
          {user && <Link href="/saved" className="hover:text-orange-500 transition-colors">♥ Saved</Link>}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white hover:opacity-80 transition-opacity" style={{ background: "#f97316" }} title="My Profile">
                {user.email?.[0]?.toUpperCase() ?? "👤"}
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">🔍 Discover</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">👋 About</Link>
          {user && (
            <Link href="/wochenplaner" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">📅 Wochenplaner</Link>
          )}
          {user && (
            <Link href="/collections" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">📚 Collections</Link>
          )}
          {user && (
            <Link href="/saved" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">♥ Saved</Link>
          )}
          {user && (
            <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">👤 Profile</Link>
          )}
          <div className="h-px bg-gray-100" />
          {user ? (
            <button onClick={handleLogout} className="text-sm font-medium text-gray-500 py-2 text-left hover:text-gray-900 transition-colors">
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
