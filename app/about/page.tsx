import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

// This route is never served — middleware redirects /about → /en/about.
// force-dynamic prevents Next.js from prerendering it (which would fail
// because Navbar uses useTranslations but there's no NextIntlClientProvider here).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "Culinse was built by a head chef and Fleischermeister who was tired of searching a hundred sites for the perfect recipe.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero gradient header */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pt-14 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-200 mb-4 block">Our Story</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Built by a chef.<br />For everyone who cooks.
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-xl">
            Culinse was born out of a real frustration — spending 20 minutes visiting site after site, just to find one decent recipe for dinner.
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-24">

        {/* Story card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "#f97316" }}>
              P
            </div>
            <div>
              <p className="font-bold text-gray-900">Peter</p>
              <p className="text-sm text-gray-400">Head Chef · Master Butcher · Founder</p>
            </div>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed text-base">
            <p>
              I spent <strong>10 years as a head chef</strong> in restaurants across Germany. Before that, I trained as a butcher — and in 2024, I earned the title of <strong>Fleischermeister</strong> (German Master Butcher), the highest professional qualification in the craft. Food isn't something I do on the side. It's everything.
            </p>
            <p>
              But even with all that background, the everyday problem was the same: finding the right recipe meant juggling a dozen browser tabs, clicking past cookie banners, and scrolling through life stories before getting to the actual ingredients. For something that's supposed to be enjoyable, it was exhausting.
            </p>
            <p>
              I kept thinking — why doesn't a platform exist that just works? One place, great recipes, no noise. The way music discovery works, but for food. So I built it.
            </p>
            <p className="font-medium text-gray-900">
              That's Culinse.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { icon: "🍖", title: "Craft", desc: "Built by someone who has spent years behind the stove and the counter." },
            { icon: "❤️", title: "Passion", desc: "Food is more than fuel. Culinse is for people who actually love to cook." },
            { icon: "✨", title: "Simplicity", desc: "No ads, no subscriptions, no clutter. Just recipes you'll want to make." },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Vision card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">Where We're Going</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">The universal recipe platform</h2>
          <div className="space-y-4">
            {[
              { icon: "📅", title: "Weekly Meal Planner", desc: "Plan your whole week in minutes. Culinse picks recipes that match your diet, schedule, and what's already in your fridge." },
              { icon: "🛒", title: "Smart Shopping Lists", desc: "Auto-generate a shopping list from your weekly plan — or send it directly to your favorite grocery delivery service." },
              { icon: "📚", title: "Recipe Albums", desc: "Curate your own collections and share them with friends, family, or the world." },
              { icon: "🌍", title: "Everything in One Place", desc: "One platform. Every recipe. No more browser tabs. From quick weeknight dinners to ambitious weekend projects." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            Discover Recipes →
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            Questions or feedback?{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:text-orange-700 transition-colors">
              peter@hoelzer.xyz
            </a>
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/impressum" className="hover:text-gray-900 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">Datenschutz</Link>
          <a href="mailto:peter@hoelzer.xyz" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
