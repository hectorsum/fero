import type { Metadata } from "next";
import { SHOP_DESCRIPTION, SHOP_NAME } from "@/infrastructure/config/shop";

export const DEFAULT_TITLE = "FERO — Barbershop · Tattoo Studio";

/**
 * Open Graph común. Next reemplaza `openGraph` entero cuando una página define el suyo,
 * así que cada página parte de aquí y añade su `url`. La imagen la aporta app/opengraph-image.tsx.
 */
export const OPEN_GRAPH = {
  type: "website",
  locale: "es_PE",
  siteName: SHOP_NAME,
  title: DEFAULT_TITLE,
  description: SHOP_DESCRIPTION,
} satisfies Metadata["openGraph"];
