import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fuentes servidas desde el repo (subset latín, licencia OFL; origen: Fontsource).
// next/font/google las descarga durante el build y en Vercel esa descarga puede fallar
// ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'").
const lora = localFont({
  variable: "--font-body",
  src: "./fonts/lora-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
});

const playfair = localFont({
  variable: "--font-heading",
  src: "./fonts/playfair-display-latin-wght-normal.woff2",
  weight: "400 900",
  display: "swap",
});

const dmMono = localFont({
  variable: "--font-fero-mono",
  src: [
    { path: "./fonts/dm-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/dm-mono-latin-500-normal.woff2", weight: "500" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FERO — Barbershop · Tattoo Studio",
  description: "Agenda tu cita con Fernando Rojas «Fero» — corte, grooming y tatuaje.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${lora.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
