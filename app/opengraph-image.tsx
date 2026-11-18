import { ImageResponse } from "next/og";

export const alt = "Blender to Web: Blender scenes on the web, with a 3D gallery and editor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0f1115", color: "#ffffff" }}>
        <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: -4 }}>Blender to Web</div>
        <div style={{ fontSize: 44, marginTop: 24, color: "#e87d0d", maxWidth: 980 }}>Blender scenes on the web, with a 3D gallery and editor.</div>
      </div>
    ),
    size,
  );
}
