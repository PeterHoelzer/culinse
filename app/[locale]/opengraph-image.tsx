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
          background: "#FAF7F2",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 48 }}>
          <span style={{ fontSize: 88, fontWeight: 700, color: "#23201C", letterSpacing: "-4px", lineHeight: 1 }}>culi</span>
          <span style={{ fontSize: 88, fontWeight: 700, color: "#BF4A14", letterSpacing: "-4px", lineHeight: 1 }}>nse</span>
        </div>

        <div style={{ fontSize: 56, fontWeight: 700, color: "#23201C", lineHeight: 1.2, letterSpacing: "-2px", marginBottom: 32 }}>
          One place for every recipe<br />you&apos;ll love.
        </div>

        <div style={{ fontSize: 28, color: "#5C564E", fontWeight: 400 }}>
          Millions of recipes · Free to use · No ad banners
        </div>
      </div>
    ),
    { ...size }
  );
}
