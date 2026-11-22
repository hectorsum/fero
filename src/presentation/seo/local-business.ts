import { WEEKDAYS, type Availability } from "@/domain/entities/Availability";
import {
  BARBER_EMAIL,
  SERVICES,
  SHOP_DESCRIPTION,
  SHOP_NAME,
  SHOP_PHONE,
  SHOP_POSTAL_ADDRESS,
  SOCIALS,
} from "@/infrastructure/config/shop";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** schema.org no admite "24:00": el cierre a medianoche se expresa como 23:59. */
const schemaTime = (t: string) => (t === "24:00" ? "23:59" : t);

/** Agrupa los días que comparten franja: una entrada por franja con todos sus días. */
export function openingHoursSpecification(av: Availability) {
  const byRange = new Map<string, { opens: string; closes: string; days: string[] }>();
  for (const wd of WEEKDAYS) {
    const day = av.week[wd];
    if (!day.open) continue;
    for (const [from, to] of day.blocks) {
      const key = `${from}-${to}`;
      const entry = byRange.get(key) ?? { opens: from, closes: schemaTime(to), days: [] };
      entry.days.push(DAY_NAMES[wd]);
      byRange.set(key, entry);
    }
  }
  return [...byRange.values()]
    .sort((a, b) => a.opens.localeCompare(b.opens))
    .map((r) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: r.days, opens: r.opens, closes: r.closes }));
}

/** LocalBusiness para Google. Solo datos reales: sin geo ni precios (no los tenemos). */
export function localBusinessJsonLd({ availability, siteUrl }: { availability: Availability; siteUrl: string }) {
  const sameAs = SOCIALS.map((s) => s.url as string).filter((u) => u !== "");
  return {
    "@context": "https://schema.org",
    "@type": ["HairSalon", "TattooParlor"],
    "@id": `${siteUrl}/#business`,
    name: SHOP_NAME,
    description: SHOP_DESCRIPTION,
    image: `${siteUrl}/fero-logo.png`,
    logo: `${siteUrl}/fero-logo.png`,
    url: siteUrl,
    telephone: `+51 ${SHOP_PHONE}`,
    email: BARBER_EMAIL,
    address: { "@type": "PostalAddress", ...SHOP_POSTAL_ADDRESS },
    openingHoursSpecification: openingHoursSpecification(availability),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name },
      })),
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: siteUrl, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "Reservation", name: "Cita en FERO" },
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** JSON para un <script type="application/ld+json">: escapa "<" para que nadie pueda cerrar la etiqueta. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
