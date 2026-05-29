"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import Image from "next/image";

export default function VideoSection() {
  const t = useTranslations();
  const [allVideos, setAllVideos] = useState<VideoRecipe[]>([]);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 6;

  useEffect(() => {
    fetch("/api/videos?size=40&from=0")
      .then(r => r.json())
      .then(d => {
        const videos: VideoRecipe[] = d.videos || [];
        const today = new Date();
        let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const seededRandom = () => {
          seed = (seed * 1664525 + 1013904223) & 0xffffffff;
          return (seed >>> 0) / 0xffffffff;
        };
        const shuffled = [...videos];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setAllVideos(shuffled);
      });
  }, []);

  const videos = allVideos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const loadMore = () => {
    setLoadingMore(true);
    setPlaying(null);
    const next = page + 1;
    const maxPage = Math.floor((allVideos.length - 1) / PAGE_SIZE);
    setPage(next > maxPage ? 0 : next);
    setTimeout(() => setLoadingMore(false), 200);
  };

  if (videos.length === 0) return null;

  return (
    <section className="pb-12" style={{ background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          {t("videoSection.title")}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{t("videoSection.subtitle")}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
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
                      onClick={e => e.stopPropagation()}
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

        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {loadingMore ? t("videoSection.loading") : t("videoSection.loadMore")}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
