"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ProSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Culinse Pro!
        </h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          Your subscription is active. You now have access to unlimited
          Collections, the Weekly Planner, and Smart Shopping Lists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#f97316" }}
          >
            📚 Go to Collections
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Discover Recipes
          </Link>
        </div>
      </div>
    </div>
  );
}
