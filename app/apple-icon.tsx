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
          background: "#BF4A14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 100,
            fontWeight: 700,
            color: "white",
            fontFamily: "Georgia, serif",
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
