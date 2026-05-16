"use client";

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
