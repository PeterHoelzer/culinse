"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation is off → logged in immediately
        window.location.href = "/";
      } else {
        setMessage("Check your email to confirm your account!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
          {/* Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              Sign up
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {mode === "login"
              ? "Log in to save recipes and get your personal feed."
              : "Free forever. No credit card required."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#f97316" } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 6 characters"
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#f97316" }}
            >
              {loading
                ? "Loading…"
                : mode === "login"
                ? "Log in →"
                : "Create account →"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            By continuing, you agree to our{" "}
            <Link href="/datenschutz" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
