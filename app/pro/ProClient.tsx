"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const FREE_FEATURES = [
  "Recipes from 4 top sources",
  "Search & filter by diet, time, cuisine",
  "Save recipes (♡)",
  "1 Collection (up to 10 recipes)",
];

const PRO_FEATURES = [
  { icon: "📚", label: "Unlimited Collections", sub: "Organize your favorites exactly how you want" },
  { icon: "📅", label: "Weekly Meal Planner", sub: "Plan breakfast, lunch & dinner for the whole week" },
  { icon: "🛒", label: "Smart Shopping List", sub: "Auto-generated from your plan, sorted by category" },
  { icon: "🌍", label: "Share Plans & Collections", sub: "Send a link — anyone can view your collection" },
  { icon: "⚡", label: "Priority features", sub: "First access to everything we build next" },
];

export default function ProPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
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
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div
        className="py-16 px-4 text-center"
        style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            ✦ Culinse Pro
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Your kitchen,<br />fully organized.
          </h1>
          <p className="text-orange-100 text-lg mb-8 max-w-md mx-auto">
            Plan your week, build your shopping list, and organize every recipe you love — all in one place.
          </p>

          {isPro ? (
            <div className="inline-flex items-center gap-2 bg-white text-orange-500 font-bold px-8 py-3.5 rounded-full text-base">
              ✓ You&apos;re already Pro!
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-white text-orange-500 font-bold px-8 py-3.5 rounded-full text-base hover:bg-orange-50 transition-colors shadow-lg disabled:opacity-60"
              >
                {loading ? "Loading…" : "Start for €4.99 / month →"}
              </button>
              <p className="text-orange-200 text-xs">Cancel anytime · No contracts</p>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Comparison table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">

          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Free</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">€0</p>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="text-gray-300 flex-shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "2px solid #f97316" }}
          >
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              PRO
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <p className="text-2xl font-bold text-gray-900">€4.99</p>
              <span className="text-sm text-gray-500">/ month</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Everything in Free, plus:</p>
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-10">
          {isPro ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">You&apos;re on Culinse Pro 🎉</p>
              <button
                onClick={handlePortal}
                disabled={loading}
                className="px-6 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {loading ? "Loading…" : "Manage subscription →"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-bold text-base hover:opacity-90 transition-opacity shadow-md disabled:opacity-60"
                style={{ background: "#f97316" }}
              >
                {loading ? "Loading…" : "Upgrade to Pro →"}
              </button>
              <p className="text-xs text-gray-400">
                Secure payment via Stripe · Cancel anytime in your profile
              </p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">FAQ</h2>
          {[
            {
              q: "Can I cancel at any time?",
              a: "Yes, cancel anytime from your profile. You keep Pro access until the end of your billing period.",
            },
            {
              q: "Which payment methods are accepted?",
              a: "All major credit and debit cards via Stripe. Safe, encrypted, PCI compliant.",
            },
            {
              q: "What happens to my Collections if I cancel?",
              a: "Your collections stay saved. You just won't be able to create new ones beyond the free limit.",
            },
            {
              q: "Is there a free trial?",
              a: "Not yet — but with Collections free you can already try the core features before upgrading.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
              <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Questions?{" "}
          <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:underline">
            peter@hoelzer.xyz
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/impressum" className="hover:text-gray-900 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
