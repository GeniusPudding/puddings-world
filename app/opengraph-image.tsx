import { ImageResponse } from "next/og";

export const alt = "puddingsworld — Pudding builds the world.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0b",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          color: "#f2f2f3",
        }}
      >
        <div
          style={{
            color: "#7c9cff",
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          puddingsworld
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 32,
            letterSpacing: -1,
            display: "flex",
          }}
        >
          Pudding builds
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
            color: "#a3a3ad",
            display: "flex",
          }}
        >
          the world.
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a3a3ad",
            marginTop: 56,
            display: "flex",
            gap: 16,
          }}
        >
          <span>AI · biosignal · simulation · audio · games</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
