"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { CULINSE_VIDEOS } from "@/lib/videos";

// 12.10.2026: Die Coming-soon-Box ist Geschichte — hier laufen die ersten drei
// Folgen der Culinse-Kochschule (Supabase-Storage-MP4s, Audio Englisch,
// Untertitel de/en, Poster aus /public/videos). Datenquelle: lib/videos.ts.
export default function VideoSection() {
  const t = useTranslations();
  const locale = useLocale();
  const de = locale === "de";

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <section className="pb-12" style={{ background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          {t("videoSection.title")}
        </h2>
        <p className="text-sm text-gray-400 mb-8">{t("videoSection.subtitle")}</p>

        <div className="grid gap-6 md:grid-cols-3">
          {CULINSE_VIDEOS.map((v) => (
            <div
              key={v.slug}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col"
            >
              {/* preload="none": drei 1080p-Videos dürfen die Startseite nicht
                  ausbremsen — geladen wird erst beim Play (Poster liegt lokal). */}
              <video
                controls
                preload="none"
                playsInline
                poster={v.poster}
                className="w-full aspect-video object-contain bg-black"
              >
                <source src={v.src} type="video/mp4" />
                {v.subtitles.map((s) => (
                  <track
                    key={s.lang}
                    kind="subtitles"
                    srcLang={s.lang}
                    label={s.label}
                    src={s.src}
                    default={de ? s.lang === "de" : s.lang === "en"}
                  />
                ))}
              </video>
              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-semibold leading-snug">
                    {de ? v.title.de : v.title.en}
                  </p>
                  <span className="text-[11px] text-gray-400 border border-white/10 rounded-full px-2 py-0.5 flex-shrink-0 mt-0.5">
                    {fmt(v.durationSec)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">
                  {de ? v.description.de : v.description.en}
                </p>
                <Link
                  href={de ? `/de/blog/${v.blogSlug.de}` : `/en/blog/${v.blogSlug.en}`}
                  className="text-sm font-medium text-orange-400 hover:text-orange-300 mt-1"
                >
                  {de ? "Zum Ratgeber mit allen Details →" : "Read the full guide →"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
