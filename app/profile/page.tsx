"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const DIET_OPTIONS = [
  { value: "", label: "No preference", emoji: "🍽" },
  { value: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { value: "vegan", label: "Vegan", emoji: "🌱" },
  { value: "ketogenic", label: "Keto", emoji: "🥑" },
  { value: "paleo", label: "Paleo", emoji: "🍖" },
  { value: "gluten free", label: "Gluten-free", emoji: "🌾" },
  { value: "whole30", label: "Whole30", emoji: "✅" },
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
  { value: 0, label: "No limit" },
  { value: 15, label: "≤ 15 min" },
  { value: 30, label: "≤ 30 min" },
  { value: 60, label: "≤ 60 min" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [diet, setDiet] = useState("");
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSavedState] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
      setUser(data.user);
      // Load existing preferences
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: prefs }) => {
          if (prefs) {
            setDiet(prefs.diet || "");
            setIntolerances(prefs.intolerances || []);
            setMaxTime(prefs.max_time || 0);
          }
          setLoading(false);
        });
    });
  }, []);

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
    setTimeout(() => setSavedState(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-orange-50">
            👤
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Food Profile</h1>
          <p className="text-gray-500 text-sm">
            Set your preferences once — Culinse automatically filters recipes for you.
          </p>
          {user && (
            <p className="text-xs text-gray-400 mt-1">{user.email}</p>
          )}
        </div>

        {/* Diet */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Diet</h2>
          <p className="text-sm text-gray-400 mb-4">We'll only show recipes that match your diet.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDiet(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  diet === opt.value
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className={`text-xs font-medium ${diet === opt.value ? "text-orange-600" : "text-gray-700"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Allergens */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Allergens & Intolerances</h2>
          <p className="text-sm text-gray-400 mb-4">Select everything you want to avoid. Recipes containing these will be filtered out.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INTOLERANCE_OPTIONS.map((opt) => {
              const active = intolerances.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleIntolerance(opt.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className={`text-sm font-medium ${active ? "text-red-600" : "text-gray-700"}`}>
                    {opt.label}
                  </span>
                  {active && <span className="ml-auto text-red-400 text-xs">✕</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Time */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Max. Cooking Time</h2>
          <p className="text-sm text-gray-400 mb-4">Only show recipes you can actually make.</p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMaxTime(opt.value)}
                className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                  maxTime === opt.value
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-100 text-gray-600 hover:border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3.5 rounded-full text-white font-semibold transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Preferences"}
          </button>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Back to recipes →
          </Link>
        </div>
      </main>
    </div>
  );
}
