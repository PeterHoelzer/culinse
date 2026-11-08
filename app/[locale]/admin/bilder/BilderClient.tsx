"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { Button, Chip, EmptyState, Icon, Input, Notice, SectionHeader, Skeleton } from "@/components/ui";

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
    return (
      <main className="max-w-content mx-auto px-4 sm:px-6 py-12" aria-busy="true">
        <Skeleton className="h-24" />
      </main>
    );
  if (phase === "forbidden")
    return (
      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon="lock"
          title="Kein Zugriff"
          text="Bitte zuerst mit deinem Culinse-Konto anmelden. Diese Seite ist nur für Peter und seinen Vater freigeschaltet."
        />
      </main>
    );
  if (phase === "error")
    return (
      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <Notice tone="error">Fehler beim Laden. Seite bitte neu laden.</Notice>
      </main>
    );

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
      <SectionHeader
        as="h1"
        title="Bilder-Werkstatt"
        subtitle="Bild in Higgsfield erstellen und herunterladen, hier beim Gericht auf „Neues Bild“ klicken. Das neue Bild gilt sofort für Deutsch und Englisch gemeinsam. Am besten Querformat verwenden."
      />

      <div className="mt-6 border-y border-line py-4">
        <div className="flex items-center justify-between text-base font-semibold text-ink">
          <span>Fortschritt</span>
          <span className="tabular">{done} von {items.length} getauscht</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-1 bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
          aria-label="Fortschritt"
        >
          <div className="h-full bg-brand" style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          className="flex-1"
          label="Gericht suchen"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gericht suchen …"
          leadingIcon="search"
          autoComplete="off"
        />
        <div className="flex gap-2" role="group" aria-label="Filter">
          {([["alle", "Alle"], ["alt", "Noch alt"], ["neu", "Getauscht"]] as [Tab, string][]).map(([key, label]) => (
            <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {uploadError && <Notice tone="error" className="mt-4">{uploadError}</Notice>}

      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Bilddatei" onChange={onFile} />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((g) => (
          <article key={g.group} className="flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
              {g.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizedImageUrl(g.image, 640) ?? g.image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon name="utensils" size={32} className="text-line-strong" />
                </div>
              )}
              {busy === g.group && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-base font-semibold text-ink" role="status">
                  Lädt hoch …
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-1 flex-col">
              <p className="text-sm text-ink-3">{g.swapped ? "Getauscht" : "Noch altes Bild"}</p>
              <h2 className="text-h3">{g.titleDe || g.titleEn}</h2>
              {g.titleEn && g.titleDe && <p className="mt-0.5 text-sm text-ink-3">{g.titleEn}</p>}
              <Button className="mt-3 self-start" variant="secondary" size="sm" icon="image" onClick={() => pick(g.group)} disabled={busy !== null}>
                Neues Bild
              </Button>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && <p className="mt-10 text-base text-ink-2">Nichts gefunden.</p>}
    </main>
  );
}
