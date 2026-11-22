import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SHOP_DESCRIPTION, siteUrl } from "@/infrastructure/config/shop";
import { DEFAULT_TITLE, OPEN_GRAPH } from "@/presentation/seo/metadata";
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
  metadataBase: new URL(siteUrl()),
  title: { default: DEFAULT_TITLE, template: "%s — FERO" },
  description: SHOP_DESCRIPTION,
  // El canonical va en cada página: si estuviera aquí, todas heredarían el de la portada.
  openGraph: OPEN_GRAPH,
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SHOP_DESCRIPTION },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/fero-logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#1d1d1d",
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
