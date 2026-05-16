import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl mb-6">🍳</div>
        <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-xl text-gray-500 mb-2">This page doesn't exist.</p>
        <p className="text-gray-400 mb-10">Looks like this recipe got lost in the kitchen.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#f97316" }}
        >
          Back to Culinse →
        </Link>
      </div>
    </div>
  );
}
