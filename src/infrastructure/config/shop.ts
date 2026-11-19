import type { ServiceType } from "@/domain/entities/Booking";
import type { ShopSchedule } from "@/domain/services/scheduling";

export const BARBER_WHATSAPP = "5215512345678";

export const HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export const SERVICES: readonly { id: ServiceType; name: string; durationMin: number }[] = [
  { id: "completo", name: "Servicio completo (Corte + Barba)", durationMin: 120 },
  { id: "barba", name: "Solo barba", durationMin: 60 },
  { id: "corte", name: "Solo corte", durationMin: 60 },
];

export const serviceName = (id: ServiceType) => SERVICES.find((s) => s.id === id)?.name ?? "";

export const SHOP_TIMEZONE = "America/Lima";

export const SHOP_SCHEDULE: ShopSchedule = {
  timeZone: SHOP_TIMEZONE,
  hours: HOURS,
  slotMinutes: 60,
  serviceDuration: Object.fromEntries(SERVICES.map((s) => [s.id, s.durationMin])) as Record<ServiceType, number>,
};
