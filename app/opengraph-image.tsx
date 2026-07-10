import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ShokoShop – Custom T-Shirts, Hoodies & Wall Art";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/shokoshoplogo-email.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e70a9b 0%, #c40884 100%)",
        }}
      >
        <img src={logoSrc} alt="" width={140} height={140} style={{ marginBottom: 32 }} />
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: -1,
          }}
        >
          ShokoShop
        </div>
        <div style={{ fontSize: 32, color: "#fce8f5", marginTop: 16 }}>
          Custom T-Shirts, Hoodies &amp; Wall Art
        </div>
      </div>
    ),
    { ...size }
  );
}
