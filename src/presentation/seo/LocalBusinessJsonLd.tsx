import type { Availability } from "@/domain/entities/Availability";
import { localBusinessJsonLd, serializeJsonLd } from "./local-business";

export default function LocalBusinessJsonLd({ availability, siteUrl }: { availability: Availability; siteUrl: string }) {
  return (
    <script
      type="application/ld+json"
      // Contenido propio serializado con "<" escapado (ver serializeJsonLd).
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(localBusinessJsonLd({ availability, siteUrl })) }}
    />
  );
}
