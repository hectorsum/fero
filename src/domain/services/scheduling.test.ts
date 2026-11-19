import { describe, expect, it } from "vitest";
import {
  availableSlots,
  isBookableDate,
  isClosedDay,
  isPastDate,
  overlaps,
  parseISODate,
  startOfDay,
  toISODate,
  type ShopSchedule,
} from "./scheduling";

const schedule: ShopSchedule = {
  hours: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
  slotMinutes: 60,
  serviceDuration: { completo: 120, barba: 60, corte: 60 },
};

// Lunes 16 nov 2026, 08:00 hora local
const NOW = new Date(2026, 10, 16, 8, 0);
const TUESDAY = "2026-11-17";

describe("reglas de calendario", () => {
  it("domingo cerrado", () => {
    expect(isClosedDay(new Date(2026, 10, 15))).toBe(true); // domingo
    expect(isClosedDay(new Date(2026, 10, 16))).toBe(false);
  });

  it("fecha pasada", () => {
    const today = startOfDay(NOW);
    expect(isPastDate(new Date(2026, 10, 15), today)).toBe(true);
    expect(isPastDate(new Date(2026, 10, 16), today)).toBe(false);
  });

  it("isBookableDate combina ambas", () => {
    const today = startOfDay(NOW);
    expect(isBookableDate(new Date(2026, 10, 16), today)).toBe(true);
    expect(isBookableDate(new Date(2026, 10, 22), today)).toBe(false); // domingo futuro
    expect(isBookableDate(new Date(2026, 10, 14), today)).toBe(false); // sábado pasado
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

describe("overlaps", () => {
  it("detecta solapamientos y respeta bordes", () => {
    expect(overlaps({ time: "09:00", durationMin: 120 }, { time: "10:00", durationMin: 60 })).toBe(true);
    expect(overlaps({ time: "09:00", durationMin: 60 }, { time: "10:00", durationMin: 60 })).toBe(false);
  });
});

describe("availableSlots", () => {
  const base = { schedule, date: TUESDAY, booked: [], now: NOW };

  it("servicio de 60 min: todos los horarios del local", () => {
    expect(availableSlots({ ...base, durationMin: 60 })).toEqual(schedule.hours);
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
    const now = new Date(2026, 10, 16, 14, 30);
    expect(availableSlots({ ...base, date: "2026-11-16", now, durationMin: 60 })).toEqual([
      "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    ]);
  });

  it("domingo, fecha pasada o inválida: sin horarios", () => {
    expect(availableSlots({ ...base, date: "2026-11-22", durationMin: 60 })).toEqual([]);
    expect(availableSlots({ ...base, date: "2026-11-14", durationMin: 60 })).toEqual([]);
    expect(availableSlots({ ...base, date: "nope", durationMin: 60 })).toEqual([]);
  });
});
