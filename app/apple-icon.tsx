import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "40px",
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 90, lineHeight: 1 }}>🍳</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.5px",
            fontFamily: "sans-serif",
          }}
        >
          culinse
        </div>
      </div>
    ),
    { ...size }
  );
}
