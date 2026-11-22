import { describe, expect, it } from "vitest";
import { defaultAvailability } from "@/domain/entities/Availability";
import { SERVICES } from "@/infrastructure/config/shop";
import { localBusinessJsonLd, openingHoursSpecification, serializeJsonLd } from "./local-business";

const SITE = "https://fero.ink";

describe("JSON-LD LocalBusiness", () => {
  it("es JSON válido con los datos del negocio", () => {
    const parsed = JSON.parse(serializeJsonLd(localBusinessJsonLd({ availability: defaultAvailability(), siteUrl: SITE })));
    expect(parsed["@type"]).toEqual(["HairSalon", "TattooParlor"]);
    expect(parsed.url).toBe(SITE);
    expect(parsed.address).toMatchObject({ "@type": "PostalAddress", addressLocality: "Miraflores", addressCountry: "PE" });
    expect(parsed.hasOfferCatalog.itemListElement).toHaveLength(SERVICES.length);
    expect(parsed.potentialAction).toMatchObject({ "@type": "ReserveAction", target: { urlTemplate: SITE } });
    // Sin URLs reales de redes, sin geo ni precio: no se inventan.
    expect(parsed).not.toHaveProperty("sameAs");
    expect(parsed).not.toHaveProperty("geo");
    expect(JSON.stringify(parsed)).not.toContain("price");
  });

  it("escapa < para no poder cerrar el <script>", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });

  it("refleja la disponibilidad semanal (agrupando días) e ignora excepciones", () => {
    const av = defaultAvailability();
    av.week[6] = { open: true, blocks: [["10:00", "14:00"]] };
    av.week[0] = { open: true, blocks: [["10:00", "24:00"]] };
    av.overrides["2026-12-25"] = { closed: true };
    expect(openingHoursSpecification(av)).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "12:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "10:00", closes: "23:59" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "10:00", closes: "14:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "14:00", closes: "21:00" },
    ]);
  });

  it("un día cerrado no aparece", () => {
    const days = openingHoursSpecification(defaultAvailability()).flatMap((s) => s.dayOfWeek);
    expect(days).not.toContain("Sunday");
  });
});
