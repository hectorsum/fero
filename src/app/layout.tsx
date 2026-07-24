import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-fero-display",
  subsets: ["latin"],
  weight: ["800"],
});

const dmMono = DM_Mono({
  variable: "--font-fero-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="es" className={`${cormorant.variable} ${lora.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
