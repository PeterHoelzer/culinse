"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/navigation";
import { VideoRecipe } from "./home-types";

// Themen-Chips — q-Werte sind englisch (Tasty-API), Labels lokalisiert.
const TAGS = [
  { q: "", de: "✨ Für heute", en: "✨ For today" },
  { q: "pasta", de: "🍝 Pasta", en: "🍝 Pasta" },
  { q: "chicken", de: "🍗 Hähnchen", en: "🍗 Chicken" },
  { q: "dessert", de: "🍰 Dessert", en: "🍰 Dessert" },
  { q: "healthy", de: "🥗 Gesund", en: "🥗 Healthy" },
  { q: "asian", de: "🍜 Asiatisch", en: "🍜 Asian" },
];

const BATCH = 40;
const PAGE_SIZE = 6;

// Tages-Seed: bestimmt das tägliche Katalog-Fenster UND die Mischung darin.
function daySeed() {
  const t = new Date();
  return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
}

export default function VideoSection() {
  const t = useTranslations();
  const locale = useLocale();
  const de = locale === "de";

  const [allVideos, setAllVideos] = useState<VideoRecipe[]>([]);
  const [page, setPage] = useState(0);
  const [nextFrom, setNextFrom] = useState(0);
  const [tag, setTag] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  const shuffle = (videos: VideoRecipe[]) => {
    let seed = daySeed();
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    const out = [...videos];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const fetchBatch = useCallback(async (q: string, from: number): Promise<VideoRecipe[]> => {
    const params = new URLSearchParams({ size: String(BATCH), from: String(from) });
    if (q) params.set("query", q);
    const res = await fetch(`/api/videos?${params}`);
    const d = await res.json();
    return d.videos || [];
  }, []);

  // Initial-Load: Ohne Thema startet das Fenster an einem TÄGLICH anderen
  // Offset im Tasty-Katalog — vorher war from=0 hardcoded, sodass jahrein,
  // jahraus dieselben Rezepte rotierten.
  const loadFresh = useCallback(async (q: string) => {
    setLoading(true);
    setPlaying(null);
    setExhausted(false);
    const from = q ? 0 : (daySeed() % 24) * 40; // tägliches 40er-Fenster (0–920)
    let videos = await fetchBatch(q, from);
    if (videos.length === 0 && from > 0) videos = await fetchBatch(q, 0); // Fallback ans Katalog-Ende
    setAllVideos(shuffle(videos));
    setNextFrom(from + BATCH);
    setPage(0);
    setLoading(false);
  }, [fetchBatch]);

  useEffect(() => {
    loadFresh("");
  }, [loadFresh]);

  const selectTag = (q: string) => {
    if (q === tag) return;
    setTag(q);
    loadFresh(q);
  };

  const videos = allVideos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // „Mehr laden": erst durch den geladenen Vorrat blättern, dann WIRKLICH
  // frische Videos aus dem Katalog nachladen (vorher: ewiger 12er-Loop).
  const loadMore = async () => {
    setPlaying(null);
    const maxPage = Math.floor((allVideos.length - 1) / PAGE_SIZE);
    if (page < maxPage) {
      setPage(page + 1);
      return;
    }
    if (exhausted) {
      setPage(0);
      return;
    }
    setLoading(true);
    const fresh = await fetchBatch(tag, nextFrom);
    const known = new Set(allVideos.map((v) => v.id));
    const newOnes = fresh.filter((v) => !known.has(v.id));
    if (newOnes.length === 0) {
      setExhausted(true);
      setPage(0);
    } else {
      setAllVideos((prev) => [...prev, ...newOnes]);
      setNextFrom(nextFrom + BATCH);
      setPage(page + 1);
    }
    setLoading(false);
  };

  if (allVideos.length === 0 && !loading) return null;

  return (
    <section className="pb-12" style={{ background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          {t("videoSection.title")}
        </h2>
        <p className="text-sm text-gray-400 mb-5">{t("videoSection.subtitle")}</p>

        {/* Themen-Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {TAGS.map((tg) => (
            <button
              key={tg.q}
              onClick={() => selectTag(tg.q)}
              className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                tag === tg.q
                  ? "text-white border-orange-500"
                  : "bg-white/5 text-gray-300 border-white/15 hover:border-orange-400/60"
              }`}
              style={tag === tg.q ? { background: "#f97316" } : {}}
            >
              {de ? tg.de : tg.en}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {loading && videos.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse" style={{ aspectRatio: "9/16" }} />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {videos.map((v) => (
              <div
                key={v.id}
                className="flex-shrink-0 w-44 sm:w-auto relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ aspectRatio: "9/16" }}
                onClick={() => setPlaying(playing === v.id ? null : v.id)}
              >
                {playing === v.id ? (
                  <video
                    src={v.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                    playsInline
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.image}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                    {v.time && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
                        ⏱ {v.time}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">{v.title}</p>
                      <Link
                        href={`/recipe/${v.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {t("videoSection.fullRecipe")}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {loading ? t("videoSection.loading") : t("videoSection.loadMore")}
          </button>
        </div>
      </div>
    </section>
  );
}
