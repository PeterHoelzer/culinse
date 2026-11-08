"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { Button, SectionHeader } from "@/components/ui";
import { CULINSE_VIDEOS, type CulinseVideo } from "@/lib/videos";

/*
  Kochschule (DESIGN.md §5, §6): weißer Hintergrund, drei Spalten.
  Je Video ein Poster 16:9 mit Play-Button; erst der Klick blendet das
  <video controls> ein. Nichts lädt vor dem Klick (preload="none").
*/

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function VideoCard({ video, de, playLabel, featured = false }: { video: CulinseVideo; de: boolean; playLabel: string; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Wiedergabe erst nach dem Klick auf Play: kein Autoplay beim Laden.
  useEffect(() => {
    if (playing) videoRef.current?.play().catch(() => {});
  }, [playing]);

  return (
    <article className={featured ? "flex flex-col gap-3 md:col-span-2 md:row-span-2" : "flex flex-col gap-2"}>
      {playing ? (
        <video
          ref={videoRef}
          controls
          preload="none"
          playsInline
          poster={video.poster}
          className="aspect-video w-full rounded-2 bg-dark object-contain"
        >
          <source src={video.src} type="video/mp4" />
          {video.subtitles.map((s) => (
            <track key={s.lang} kind="subtitles" srcLang={s.lang} label={s.label} src={s.src} default={de ? s.lang === "de" : s.lang === "en"} />
          ))}
        </video>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-2 bg-surface-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.poster} alt="" width={1280} height={720} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <Button
            variant="icon"
            icon="play"
            iconFilled
            aria-label={`${playLabel}: ${de ? video.title.de : video.title.en}`}
            onClick={() => setPlaying(true)}
            className="absolute inset-0 m-auto"
          />
        </div>
      )}

      <p className="tabular mt-1 text-sm text-ink-3">Video · {formatDuration(video.durationSec)}</p>
      <h3 className={featured ? "text-h2-sm sm:text-h2" : "text-h3"}>{de ? video.title.de : video.title.en}</h3>
      <p className="text-base text-ink-2">{de ? video.description.de : video.description.en}</p>
      <Link
        href={`/blog/${de ? video.blogSlug.de : video.blogSlug.en}`}
        className="text-base font-semibold text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]"
      >
        {de ? "Zum Ratgeber" : "Read the guide"}
      </Link>
    </article>
  );
}

export default function VideoSection() {
  const t = useTranslations();
  const locale = useLocale();
  const de = locale === "de";
  const playLabel = t.has("videoSection.play") ? t("videoSection.play") : de ? "Video abspielen" : "Play video";

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeader title={t("videoSection.title")} subtitle={t("videoSection.subtitle")} />
      <div className="grid gap-8 md:grid-cols-3 md:grid-rows-2">
        {CULINSE_VIDEOS.map((v, i) => (
          <VideoCard key={v.slug} video={v} de={de} playLabel={playLabel} featured={i === 0} />
        ))}
      </div>
    </section>
  );
}
