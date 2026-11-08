import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          background: "#BF4A14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "white",
            fontFamily: "Georgia, serif",
            letterSpacing: "-1px",
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
