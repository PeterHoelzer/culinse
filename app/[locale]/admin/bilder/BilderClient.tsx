"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { optimizedImageUrl } from "@/lib/imageUrl";

/**
 * Bilder-Werkstatt (14.09.2026): Übersicht aller Culinse-Gerichte mit
 * 2-Klick-Bildtausch. Deutsch und ohne i18n-Anbindung — bewusst, wie die
 * Review-Seite ein internes Werkzeug für Peter + Papa.
 */

interface Gericht {
  group: string;
  titleDe: string;
  titleEn: string;
  image: string | null;
  swapped: boolean;
}

type Phase = "loading" | "ok" | "forbidden" | "error";
type Tab = "alle" | "alt" | "neu";

// Higgsfield liefert teils große PNGs — vor dem Upload im Browser auf
// Webgröße bringen (max. 1600 px, JPEG). Schont Speicher und Ladezeiten.
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000 && file.type === "image/jpeg") return file;
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export default function BilderClient() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<Gericht[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("alle");
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pickGroup = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/recipe-images")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) return setPhase("forbidden");
        if (!res.ok) return setPhase("error");
        const data = await res.json();
        setItems(data.recipes ?? []);
        setPhase("ok");
      })
      .catch(() => setPhase("error"));
  }, []);

  const done = items.filter((i) => i.swapped).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (tab === "alt" && i.swapped) return false;
      if (tab === "neu" && !i.swapped) return false;
      if (!needle) return true;
      return (
        i.titleDe.toLowerCase().includes(needle) ||
        i.titleEn.toLowerCase().includes(needle)
      );
    });
  }, [items, q, tab]);

  function pick(group: string) {
    pickGroup.current = group;
    setUploadError("");
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const group = pickGroup.current;
    if (!file || !group) return;
    setBusy(group);
    try {
      const blob = await shrink(file);
      if (blob.size > 8 * 1024 * 1024) throw new Error("too_large");
      const form = new FormData();
      form.append("file", blob, "bild.jpg");
      form.append("group", group);
      const res = await fetch("/api/admin/recipe-images", { method: "POST", body: form });
      if (!res.ok) throw new Error("upload");
      const data = await res.json();
      setItems((prev) =>
        prev.map((i) =>
          i.group === group ? { ...i, image: data.imageUrl, swapped: true } : i
        )
      );
    } catch {
      setUploadError("Das Hochladen hat nicht geklappt. Bitte noch einmal versuchen — falls es wieder passiert, Peter Bescheid sagen.");
    } finally {
      setBusy(null);
    }
  }

  if (phase === "loading")
    return <main className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Lade Gerichte …</main>;
  if (phase === "forbidden")
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Kein Zugriff</h1>
        <p className="text-gray-500 text-sm">
          Bitte zuerst mit deinem Culinse-Konto anmelden. Diese Seite ist nur für
          Peter und seinen Vater freigeschaltet.
        </p>
      </main>
    );
  if (phase === "error")
    return <main className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Fehler beim Laden — Seite bitte neu laden.</main>;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Bilder-Werkstatt</h1>
      <p className="text-gray-500 text-sm mt-1">
        Bild in Higgsfield erstellen und herunterladen, hier beim Gericht auf
        „Neues Bild" klicken — das war&apos;s. Das neue Bild gilt sofort für Deutsch
        und Englisch gemeinsam. Am besten Querformat verwenden.
      </p>

      <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span>Fortschritt</span>
          <span>{done} von {items.length} getauscht</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gericht suchen …"
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <div className="flex gap-1 rounded-full bg-gray-100 p-1 text-xs font-semibold self-start">
          {([["alle", "Alle"], ["alt", "Noch alt"], ["neu", "Getauscht"]] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-full transition-colors ${tab === key ? "bg-white shadow text-orange-600" : "text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {uploadError && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{uploadError}</p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((g) => (
          <article key={g.group} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="relative h-44 bg-gray-100">
              {g.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizedImageUrl(g.image, 640) ?? g.image}
                  alt={g.titleDe || g.titleEn}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
              {g.swapped && (
                <span className="absolute top-2 right-2 rounded-full bg-green-600 text-white text-xs font-semibold px-2.5 py-1 shadow">
                  Getauscht ✓
                </span>
              )}
              {busy === g.group && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-semibold text-gray-700">
                  Lädt hoch …
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h2 className="font-semibold text-gray-900 leading-snug">{g.titleDe || g.titleEn}</h2>
              {g.titleEn && g.titleDe && (
                <p className="text-xs text-gray-400 mt-0.5">{g.titleEn}</p>
              )}
              <button
                onClick={() => pick(g.group)}
                disabled={busy !== null}
                className="mt-3 self-start px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Neues Bild
              </button>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-10 text-center text-gray-500 text-sm">Nichts gefunden.</p>
      )}
    </main>
  );
}
