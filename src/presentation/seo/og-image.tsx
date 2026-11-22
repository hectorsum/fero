import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "FERO — Barbershop · Tattoo Studio en Miraflores, Lima";

/**
 * Imagen para compartir (PNG 1200×630; WhatsApp e Instagram no leen bien AVIF).
 * Usa la fuente por defecto de next/og: las de la marca están en woff2, que next/og no admite.
 */
export async function renderOgImage() {
  const logo = await readFile(join(process.cwd(), "public/fero-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "#1d1d1d",
          color: "#eeeae0",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
        <img src={logoSrc} width={300} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: 6 }}>FERO</div>
          <div style={{ fontSize: 40, color: "#b8d42c" }}>Barbershop · Tattoo Studio</div>
          <div style={{ fontSize: 30, color: "#a6a298" }}>Miraflores, Lima — agenda tu cita online</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
