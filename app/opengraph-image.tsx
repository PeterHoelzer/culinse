import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Culinse – Discover Recipes You'll Love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          padding: "80px 100px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: 630, background: "#f97316" }} />
        <div style={{ position: "absolute", right: 50, top: "25%", width: 400, height: 400, borderRadius: "50%", background: "#f97316", opacity: 0.07 }} />
        <div style={{ position: "absolute", right: 0, bottom: 40, width: 220, height: 220, borderRadius: "50%", background: "#f97316", opacity: 0.13 }} />

        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 48 }}>
          <span style={{ fontSize: 88, fontWeight: 900, color: "#111827", letterSpacing: "-4px", lineHeight: 1 }}>culi</span>
          <span style={{ fontSize: 88, fontWeight: 900, color: "#f97316", letterSpacing: "-4px", lineHeight: 1 }}>nse</span>
        </div>

        <div style={{ fontSize: 56, fontWeight: 700, color: "#111827", lineHeight: 1.2, letterSpacing: "-2px", marginBottom: 32 }}>
          One place for every recipe<br />you&apos;ll love.
        </div>

        <div style={{ fontSize: 28, color: "#9ca3af", fontWeight: 400, letterSpacing: "-0.3px" }}>
          Millions of recipes · Free · No subscription
        </div>
      </div>
    ),
    { ...size }
  );
}
