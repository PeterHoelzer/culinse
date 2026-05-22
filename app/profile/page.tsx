"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const DIET_OPTIONS = [
  { value: "", label: "No preference", emoji: "🍽", desc: "Show me everything" },
  { value: "vegetarian", label: "Vegetarian", emoji: "🥦", desc: "No meat or fish" },
  { value: "vegan", label: "Vegan", emoji: "🌱", desc: "Plant-based only" },
  { value: "ketogenic", label: "Keto", emoji: "🥑", desc: "Low carb, high fat" },
  { value: "paleo", label: "Paleo", emoji: "🍖", desc: "Back to basics" },
  { value: "gluten free", label: "Gluten-free", emoji: "🌾", desc: "No gluten" },
  { value: "whole30", label: "Whole30", emoji: "✅", desc: "Clean eating" },
];

const INTOLERANCE_OPTIONS = [
  { value: "dairy", label: "Dairy", emoji: "🥛" },
  { value: "egg", label: "Eggs", emoji: "🥚" },
  { value: "gluten", label: "Gluten", emoji: "🍞" },
  { value: "peanut", label: "Peanuts", emoji: "🥜" },
  { value: "tree nut", label: "Tree Nuts", emoji: "🌰" },
  { value: "soy", label: "Soy", emoji: "🫘" },
  { value: "seafood", label: "Seafood", emoji: "🦐" },
  { value: "shellfish", label: "Shellfish", emoji: "🦞" },
  { value: "wheat", label: "Wheat", emoji: "🌾" },
  { value: "sulfite", label: "Sulfites", emoji: "🍷" },
];

const TIME_OPTIONS = [
  { value: 0, label: "No limit", emoji: "♾️" },
  { value: 15, label: "≤ 15 min", emoji: "⚡" },
  { value: 30, label: "≤ 30 min", emoji: "🕐" },
  { value: 60, label: "≤ 60 min", emoji: "🕑" },
];

const PRO_FEATURES = [
  { icon: "📚", label: "Unlimited Collections" },
  { icon: "📅", label: "Weekly Meal Planner" },
  { icon: "🛒", label: "Smart Shopping List" },
  { icon: "🌍", label: "Share Plans & Collections" },
  { icon: "⚡", label: "Priority new features" },
];

export default function ProfilePage() {
  const [isWelcome, setIsWelcome] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [diet, setDiet] = useState("");
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSavedState] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proExpiry, setProExpiry] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setIsWelcome(new URLSearchParams(window.location.search).get("welcome") === "1");
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
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
        setIsPro(profile.is_pro ?? false);
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

  // Completion score
  const completed = [diet !== "", intolerances.length > 0, maxTime > 0].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Welcome banner for new users */}
      {isWelcome && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-3 text-center">
          <p className="text-sm font-medium text-green-700">
            🎉 Welcome to Culinse! Set up your food profile to get personalized recipes.
          </p>
        </div>
      )}

      {/* Hero header */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pb-16 pt-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold text-white mb-4 border-4 border-white/30">
            {user?.email?.[0]?.toUpperCase() ?? "👤"}
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Your Food Profile</h1>
          <p className="text-orange-100 text-sm mb-4">{user?.email}</p>

          {/* Completion bar */}
          <div className="bg-white/20 rounded-full h-2 w-48 mb-1">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${(completed / 3) * 100}%` }}
            />
          </div>
          <p className="text-orange-100 text-xs">
            {completed === 0 && "Set your preferences to get personalized recipes"}
            {completed === 1 && "Good start — 2 more steps"}
            {completed === 2 && "Almost there — 1 more step"}
            {completed === 3 && "✓ Profile complete — For You is active!"}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-24">

        {/* Subscription */}
        <div className={`rounded-2xl shadow-sm border p-6 mb-4 ${isPro ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{isPro ? "⭐" : "🔓"}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isPro ? "Culinse Pro" : "Free Plan"}
                </h2>
                {isPro && proExpiry && (
                  <p className="text-xs text-gray-400">
                    Renews {new Date(proExpiry).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPro ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
              {isPro ? "✓ Active" : "Free"}
            </span>
          </div>

          <div className="space-y-2 mb-5">
            {PRO_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className={`text-sm ${isPro ? "text-gray-700" : "text-gray-400"}`}>{f.label}</span>
                {!isPro && <span className="ml-auto text-gray-300 text-xs">🔒</span>}
              </div>
            ))}
          </div>

          {isPro ? (
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="w-full py-3 rounded-full border-2 border-orange-300 text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-all disabled:opacity-60"
            >
              {billingLoading ? "Loading…" : "Manage subscription"}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              className="w-full py-3 rounded-full text-white font-semibold text-sm transition-all disabled:opacity-60 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              {billingLoading ? "Loading…" : "Upgrade to Pro — €4.99 / month"}
            </button>
          )}
        </div>

        {/* Diet */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">🥗</span>
            <h2 className="text-lg font-bold text-gray-900">Diet</h2>
            {diet && <span className="ml-auto text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Active</span>}
          </div>
          <p className="text-sm text-gray-400 mb-5">Only show recipes that match your lifestyle.</p>
          <div className="grid grid-cols-2 gap-3">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDiet(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  diet === opt.value
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 hover:border-orange-200 bg-gray-50"
                }`}
              >
                <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${diet === opt.value ? "text-orange-600" : "text-gray-800"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                {diet === opt.value && (
                  <span className="ml-auto text-orange-400 flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Allergens */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">🚫</span>
            <h2 className="text-lg font-bold text-gray-900">Allergens & Intolerances</h2>
            {intolerances.length > 0 && (
              <span className="ml-auto text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                {intolerances.length} active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-5">Tap to exclude ingredients from your feed.</p>
          <div className="grid grid-cols-2 gap-3">
            {INTOLERANCE_OPTIONS.map((opt) => {
              const active = intolerances.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleIntolerance(opt.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    active
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 hover:border-red-200 bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className={`text-sm font-medium flex-1 ${active ? "text-red-600" : "text-gray-700"}`}>
                    {opt.label}
                  </span>
                  {active && <span className="text-red-400 text-xs font-bold">✕</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">⏱</span>
            <h2 className="text-lg font-bold text-gray-900">Max. Cooking Time</h2>
            {maxTime > 0 && <span className="ml-auto text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Active</span>}
          </div>
          <p className="text-sm text-gray-400 mb-5">Only show recipes you can actually make.</p>
          <div className="grid grid-cols-2 gap-3">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMaxTime(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  maxTime === opt.value
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 hover:border-orange-200 bg-gray-50"
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className={`text-sm font-semibold ${maxTime === opt.value ? "text-orange-600" : "text-gray-700"}`}>
                  {opt.label}
                </span>
                {maxTime === opt.value && <span className="ml-auto text-orange-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 flex items-center gap-4 z-40">
          <div className="max-w-2xl mx-auto w-full flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 rounded-full text-white font-semibold transition-all disabled:opacity-60 hover:opacity-90 text-center"
              style={{ background: saved ? "#22c55e" : "#f97316" }}
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Preferences"}
            </button>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap">
              ← Back
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
