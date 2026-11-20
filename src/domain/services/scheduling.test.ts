import { describe, expect, it } from "vitest";
import { defaultAvailability } from "../entities/Availability";
import {
  availableSlots,
  isPastDate,
  openHoursForDate,
  overlaps,
  parseISODate,
  shopNow,
  startOfDay,
  toISODate,
  busyToDayIntervals,
  zonedToUtc,
  type ShopSchedule,
} from "./scheduling";

const schedule: ShopSchedule = {
  timeZone: "America/Lima",
  slotMinutes: 60,
  serviceDuration: { completo: 120, barba: 60, corte: 60 },
};
const av = defaultAvailability(); // L–S 09–12 y 14–21, domingo cerrado
const HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

// Lunes 16 nov 2026, 08:00 hora local (para las reglas de calendario)
const NOW = new Date(2026, 10, 16, 8, 0);
// Mismo instante para el local en Lima
const SHOP_NOW = { date: "2026-11-16", minutes: 8 * 60 };
const TUESDAY = "2026-11-17";

describe("reglas de calendario", () => {
  it("fecha pasada", () => {
    const today = startOfDay(NOW);
    expect(isPastDate(new Date(2026, 10, 15), today)).toBe(true);
    expect(isPastDate(new Date(2026, 10, 16), today)).toBe(false);
  });

  it("openHoursForDate sigue el horario semanal (domingo cerrado por defecto)", () => {
    expect(openHoursForDate(av, TUESDAY, 60)).toEqual(HOURS);
    expect(openHoursForDate(av, "2026-11-22", 60)).toEqual([]);
    expect(openHoursForDate(av, "nope", 60)).toEqual([]);
  });
});

describe("fechas ISO", () => {
  it("ida y vuelta en hora local", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(parseISODate("2026-01-05")?.getTime()).toBe(new Date(2026, 0, 5).getTime());
  });

  it("rechaza formatos o fechas inexistentes", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("5/1/2026")).toBeNull();
  });
});

describe("shopNow", () => {
  it("convierte un instante a la fecha y hora del local, sin depender de la zona del servidor", () => {
    // 03:30 UTC del 17 = 22:30 del 16 en Lima (UTC-5)
    expect(shopNow(new Date("2026-11-17T03:30:00Z"), "America/Lima")).toEqual({ date: "2026-11-16", minutes: 22 * 60 + 30 });
    expect(shopNow(new Date("2026-11-17T00:00:00Z"), "America/Lima")).toEqual({ date: "2026-11-16", minutes: 19 * 60 });
  });
});

describe("overlaps", () => {
  it("detecta solapamientos y respeta bordes", () => {
    expect(overlaps({ time: "09:00", durationMin: 120 }, { time: "10:00", durationMin: 60 })).toBe(true);
    expect(overlaps({ time: "09:00", durationMin: 60 }, { time: "10:00", durationMin: 60 })).toBe(false);
  });
});

describe("availableSlots", () => {
  const base = { hours: HOURS, slotMinutes: schedule.slotMinutes, date: TUESDAY, booked: [], now: SHOP_NOW };

  it("servicio de 60 min: todos los horarios del local", () => {
    expect(availableSlots({ ...base, durationMin: 60 })).toEqual(HOURS);
  });

  it("servicio de 120 min: solo inicios con dos bloques consecutivos abiertos", () => {
    expect(availableSlots({ ...base, durationMin: 120 })).toEqual([
      "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    ]);
  });

  it("excluye horarios que se solapan con citas existentes", () => {
    const booked = [{ time: "15:00", durationMin: 120 }];
    expect(availableSlots({ ...base, durationMin: 60, booked })).not.toContain("15:00");
    expect(availableSlots({ ...base, durationMin: 60, booked })).not.toContain("16:00");
    expect(availableSlots({ ...base, durationMin: 120, booked })).not.toContain("14:00");
    expect(availableSlots({ ...base, durationMin: 120, booked })).toContain("17:00");
  });

  it("hoy: solo horarios posteriores a la hora actual", () => {
    const now = { date: "2026-11-16", minutes: 14 * 60 + 30 };
    expect(availableSlots({ ...base, date: "2026-11-16", now, durationMin: 60 })).toEqual([
      "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    ]);
  });

  it("día sin horas abiertas, fecha pasada o inválida: sin horarios", () => {
    expect(availableSlots({ ...base, hours: [], date: "2026-11-22", durationMin: 60 })).toEqual([]);
    expect(availableSlots({ ...base, date: "2026-11-14", durationMin: 60 })).toEqual([]);
    expect(availableSlots({ ...base, date: "nope", durationMin: 60 })).toEqual([]);
  });
});

describe("zonedToUtc / busyToDayIntervals", () => {
  it("convierte hora local a UTC (Lima UTC-5, Madrid con horario de verano)", () => {
    expect(zonedToUtc("2026-11-17", 9 * 60, "America/Lima").toISOString()).toBe("2026-11-17T14:00:00.000Z");
    expect(zonedToUtc("2026-07-01", 9 * 60, "Europe/Madrid").toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(zonedToUtc("2026-01-01", 9 * 60, "Europe/Madrid").toISOString()).toBe("2026-01-01T08:00:00.000Z");
  });

  it("recorta eventos al día y los pasa a minutos locales", () => {
    const busy = [
      { start: new Date("2026-11-17T15:30:00Z"), end: new Date("2026-11-17T16:15:00Z") }, // 10:30–11:15 Lima
      { start: new Date("2026-11-17T02:00:00Z"), end: new Date("2026-11-17T06:00:00Z") }, // 21:00 del 16 → 01:00
      { start: new Date("2026-11-18T06:00:00Z"), end: new Date("2026-11-18T07:00:00Z") }, // otro día
    ];
    expect(busyToDayIntervals(busy, "2026-11-17", "America/Lima")).toEqual([
      { date: "2026-11-17", time: "10:30", durationMin: 45 },
      { date: "2026-11-17", time: "00:00", durationMin: 60 },
    ]);
  });
});
