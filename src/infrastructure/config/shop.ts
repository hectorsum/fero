export const BARBER_WHATSAPP = "5215512345678";

export const HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export const SERVICES = [
  { name: "Servicio completo (Corte + Barba)", durationMin: 120 },
  { name: "Solo barba", durationMin: 60 },
  { name: "Solo corte", durationMin: 60 },
] as const;
