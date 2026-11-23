import type { ServiceType } from "@/domain/entities/Booking";
import type { ShopSchedule } from "@/domain/services/scheduling";

export const BARBER_WHATSAPP = "922041346";
export const BARBER_EMAIL = "feroink@gmail.com";
export const SHOP_ADDRESS = "Calle Enrique Barron 377, Barranco";
export const SHOP_PHONE = "922041346";
/** Dirección postal estructurada (datos estructurados / SEO). */
export const SHOP_POSTAL_ADDRESS = {
  streetAddress: "Calle Enrique Barron 377",
  addressLocality: "Barranco",
  addressRegion: "Lima",
  addressCountry: "PE",
} as const;
export const SHOP_NAME = "Fero";
export const SHOP_DESCRIPTION = "Agenda tu cita con Fernando Rojas «Fero»: corte, barba, grooming y tatuaje en Barranco, Lima.";

/** Redes sociales. `url` vacío = aún no la conocemos: se muestra igual pero no va a los datos estructurados. */
export const SOCIALS = [
  { id: "instagram", name: "Instagram", handle: "@ferotattoo", url: "https://www.instagram.com/ferotattoo/" },
  { id: "tiktok", name: "TikTok", handle: "@feroink", url: "" },
  { id: "facebook", name: "Facebook", handle: "Fero Barbershop & Tattoo", url: "" },
] as const satisfies readonly { id: string; name: string; handle: string; url: string }[];

/**
 * URL pública del sitio, sin "/" final. Función (no constante) porque shop.ts también se usa en el
 * navegador y allí no existen estas variables. En Vercel, sin SITE_URL, usa el dominio de producción.
 */
export function siteUrl(): string {
  const env = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = env || (vercel ? `https://${vercel}` : process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  if (!url) throw new Error("Falta SITE_URL (ver .env.example).");
  return url.replace(/\/+$/, "");
}

export const SERVICES: readonly { id: ServiceType; name: string; durationMin: number }[] = [
  { id: "completo", name: "Servicio completo (Corte + Barba)", durationMin: 120 },
  { id: "barba", name: "Solo barba", durationMin: 60 },
  { id: "corte", name: "Solo corte", durationMin: 60 },
];

export const serviceName = (id: ServiceType) => SERVICES.find((s) => s.id === id)?.name ?? "";

export const SHOP_TIMEZONE = "America/Lima";

export const SHOP_SCHEDULE: ShopSchedule = {
  timeZone: SHOP_TIMEZONE,
  slotMinutes: 60,
  serviceDuration: Object.fromEntries(SERVICES.map((s) => [s.id, s.durationMin])) as Record<ServiceType, number>,
};

export const TATTOO_STYLES = ["Tradicional", "Fine line", "Blackwork", "Realismo", "Lettering", "Otro"] as const;
export const TATTOO_SIZES = ["Pequeño (<5cm)", "Mediano (5–10cm)", "Grande (10–20cm)", "Extra grande (>20cm)"] as const;
