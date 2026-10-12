// Eigene Koch-Videos ("Culinse Kochschule", 12.10.2026) — zentrale Datenquelle
// für die Video-Sektion auf der Startseite, /api/videos und die Blog-Embeds.
// Die MP4s liegen im öffentlichen Supabase-Bucket recipe-media/videos/
// (faststart, H.264/AAC, 1080p, Audio Englisch); Poster und WebVTT-Untertitel
// (de/en) liegen same-origin unter /public/videos.

export interface CulinseVideo {
  slug: string;
  title: { de: string; en: string };
  description: { de: string; en: string };
  /** Volle MP4-URL (Supabase Storage, public, Range-Requests fähig). */
  src: string;
  /** Poster-Pfad unter /public. */
  poster: string;
  subtitles: { lang: "de" | "en"; src: string; label: string }[];
  durationSec: number;
  /** ISO-8601-Dauer für VideoObject-JSON-LD. */
  durationIso: string;
  uploadDate: string;
  /** Zugehöriger Blog-Artikel (lokalisierte Slugs, siehe blog-slug-map). */
  blogSlug: { de: string; en: string };
}

const STORAGE_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "") +
  "/storage/v1/object/public/recipe-media/videos/";

export const CULINSE_VIDEOS: CulinseVideo[] = [
  {
    slug: "messer-schaerfen-schneidbretter",
    title: {
      de: "Messer, Schärfen und Schneidbretter",
      en: "Knives, Sharpening and Cutting Boards",
    },
    description: {
      de: "Welche Messer du wirklich brauchst, was sie kosten dürfen — und wie du sie dauerhaft scharf hältst.",
      en: "Which knives you actually need, what they should cost — and how to keep them sharp for good.",
    },
    src: STORAGE_BASE + "messer-schaerfen-schneidbretter.mp4",
    poster: "/videos/messer-schaerfen-schneidbretter.jpg",
    subtitles: [
      { lang: "de", src: "/videos/messer-schaerfen-schneidbretter-de.vtt", label: "Deutsch" },
      { lang: "en", src: "/videos/messer-schaerfen-schneidbretter-en.vtt", label: "English" },
    ],
    durationSec: 383,
    durationIso: "PT6M23S",
    uploadDate: "2026-10-12",
    blogSlug: {
      de: "messer-schaerfen-schneidebretter-kaufberatung",
      en: "kitchen-knives-sharpening-cutting-boards-guide",
    },
  },
  {
    slug: "richtig-schneiden",
    title: {
      de: "Richtig schneiden",
      en: "Knife Skills: Cutting Done Right",
    },
    description: {
      de: "Kropfgriff, Krallengriff und die klassischen Schnitte von Julienne bis Brunoise — sicher und schnell.",
      en: "The pinch grip, the claw, and the classic cuts from julienne to brunoise — safe and fast.",
    },
    src: STORAGE_BASE + "richtig-schneiden.mp4",
    poster: "/videos/richtig-schneiden.jpg",
    subtitles: [
      { lang: "de", src: "/videos/richtig-schneiden-de.vtt", label: "Deutsch" },
      { lang: "en", src: "/videos/richtig-schneiden-en.vtt", label: "English" },
    ],
    durationSec: 369,
    durationIso: "PT6M9S",
    uploadDate: "2026-10-12",
    blogSlug: {
      de: "schneiden-lernen-messerhaltung-schnitttechniken",
      en: "knife-skills-how-to-cut-like-a-chef",
    },
  },
  {
    slug: "rindersteaks-auf-den-punkt",
    title: {
      de: "Rindersteaks einfach auf den Punkt",
      en: "Beef Steaks, Done to the Point",
    },
    description: {
      de: "Fünf Garstufen, die Dicke-Regel und drei Methoden — vom dünnen Hüftsteak bis zum ganzen Roastbeef.",
      en: "Five doneness levels, the thickness rule and three methods — from a thin sirloin to a whole roast beef.",
    },
    src: STORAGE_BASE + "rindersteaks-auf-den-punkt.mp4",
    poster: "/videos/rindersteaks-auf-den-punkt.jpg",
    subtitles: [
      { lang: "de", src: "/videos/rindersteaks-auf-den-punkt-de.vtt", label: "Deutsch" },
      { lang: "en", src: "/videos/rindersteaks-auf-den-punkt-en.vtt", label: "English" },
    ],
    durationSec: 303,
    durationIso: "PT5M3S",
    uploadDate: "2026-10-12",
    blogSlug: {
      de: "steak-braten-kerntemperatur-garstufen",
      en: "steak-doneness-temperatures-guide",
    },
  },
];

export function getVideoBySlug(slug: string): CulinseVideo | undefined {
  return CULINSE_VIDEOS.find((v) => v.slug === slug);
}
