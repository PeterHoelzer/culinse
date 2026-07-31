import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Culinse Wochenplan";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// C11: OG-Bild der geteilten Woche — der Preis ist die Botschaft
// („Meine Woche für 26,50 €").
export default async function OGImage(
  { params }: { params: Promise<{ locale: string; shareId: string }> }
) {
  const { locale, shareId } = await params;
  const de = locale === "de";

  let estTotal: number | null = null;
  let count = 0;
  let titles: string[] = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/recipe-media/shares/${shareId}.json`
    );
    if (res.ok) {
      const s = (await res.json()) as {
        estTotal?: number | null;
        totalRecipes?: number;
        days?: { title: string }[];
      };
      estTotal = s.estTotal ?? null;
      count = s.totalRecipes ?? 0;
      titles = (s.days ?? []).slice(0, 4).map((d) => d.title);
    }
  } catch {
    /* Fallback-Design unten */
  }

  const price =
    estTotal != null
      ? de
        ? `${estTotal.toFixed(2).replace(".", ",")} €`
        : `€${estTotal.toFixed(2)}`
      : null;
  const headline = price
    ? de
      ? `Meine Woche für ${price}`
      : `My week for ${price}`
    : de
    ? "Mein Wochenplan"
    : "My meal plan";
  const sub = de
    ? `${count > 0 ? `${count} Gerichte · ` : ""}Wochenplan mit Einkaufsliste & Preisschätzung`
    : `${count > 0 ? `${count} meals · ` : ""}Meal plan with shopping list & price estimate`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "70px 90px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: 630, background: "#f97316" }} />
        <div style={{ position: "absolute", right: 50, top: "20%", width: 380, height: 380, borderRadius: "50%", background: "#f97316", opacity: 0.07 }} />
        <div style={{ position: "absolute", right: 0, bottom: 30, width: 200, height: 200, borderRadius: "50%", background: "#f97316", opacity: 0.13 }} />

        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 36 }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#111827", letterSpacing: "-2px", lineHeight: 1 }}>culi</span>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#f97316", letterSpacing: "-2px", lineHeight: 1 }}>nse</span>
        </div>

        <div style={{ fontSize: 76, fontWeight: 800, color: "#111827", lineHeight: 1.1, letterSpacing: "-3px", marginBottom: 28, display: "flex" }}>
          {headline}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
          {titles.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 30, color: "#374151", marginBottom: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f97316", marginRight: 16 }} />
              {t.length > 52 ? `${t.slice(0, 52)}…` : t}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 26, color: "#9ca3af", fontWeight: 400 }}>{sub} · culinse.com</div>
      </div>
    ),
    size
  );
}
