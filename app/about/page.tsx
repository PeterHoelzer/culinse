import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Culinse was built by a chef and butcher master who was tired of searching 100 sites for the perfect recipe.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">

        {/* Hero */}
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">Our Story</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Never wonder what to cook again.
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Culinse was born out of a simple frustration — spending way too long visiting site after site, just to find one good recipe for dinner.
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-1 rounded-full mb-16" style={{ background: "#f97316" }} />

        {/* Story */}
        <div className="space-y-8 text-gray-700 leading-relaxed text-base">
          <p>
            The person behind Culinse isn't just a developer — he's a trained <strong>Fleischermeister</strong> and spent years working as a head chef. Food isn't a hobby. It's a profession, a craft, and a passion.
          </p>
          <p>
            But even with all that experience, the problem was the same: finding the right recipe meant visiting dozens of websites, dealing with cookie banners, endless ads, and walls of text before even getting to the ingredients. It made no sense.
          </p>
          <p>
            The idea was simple. What if you could discover recipes the way you discover music — effortlessly, personalized, and all in one place? No subscriptions, no noise. Just great food.
          </p>
          <p>
            That's Culinse. Built by a chef, for everyone who loves to cook.
          </p>
        </div>

        {/* Values */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "🍖", title: "Craft", desc: "Built by someone who has spent years behind the stove and the counter." },
            { icon: "❤️", title: "Passion", desc: "Food is more than fuel. Culinse is for people who actually love to cook." },
            { icon: "✨", title: "Simplicity", desc: "No ads, no subscriptions, no clutter. Just recipes you'll actually want to make." },
          ].map((v) => (
            <div key={v.title} className="bg-orange-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            Discover Recipes →
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 mt-8">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/impressum" className="hover:text-gray-900 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">Datenschutz</Link>
          <a href="mailto:peter@hoelzer.xyz" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
