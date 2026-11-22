import type { ServiceType } from "@/domain/entities/Booking";
import type { ShopSchedule } from "@/domain/services/scheduling";

export const BARBER_WHATSAPP = "5215512345678";
export const BARBER_EMAIL = "fero@gmail.com";
export const SHOP_ADDRESS = "Av Republica de Panama 5920, Miraflores";
export const SHOP_PHONE = "999 333 222";

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
