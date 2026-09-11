import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shop NFC — Bitora";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#64748b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: "0.28em", textTransform: "uppercase", color: "#86868b", marginBottom: 18 }}>
          BITORA · SHOPNFC.BITORA.IT
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: "#f5f5f7", letterSpacing: "-3px", lineHeight: 0.95 }}>
          Tag, card e lettori NFC
        </div>
        <div style={{ marginTop: 24, fontSize: 24, color: "#a1a1a6" }}>
          Sticker · Tessere · Braccialetti · Lettori
        </div>
      </div>
    ),
    { ...size }
  );
}
