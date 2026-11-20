import { describe, expect, it } from "vitest";
import { defaultAvailability, InvalidAvailabilityError, openSlotsForDate, parseAvailability, weeklySlots } from "./Availability";

describe("weeklySlots", () => {
  it("genera inicios de 60 min dentro de cada franja", () => {
    expect(weeklySlots({ open: true, blocks: [["09:00", "12:00"], ["13:30", "16:00"]] }, 60)).toEqual([
      "09:00", "10:00", "11:00", "13:30", "14:30",
    ]);
  });
  it("acepta 24:00 como fin y omite días cerrados", () => {
    expect(weeklySlots({ open: true, blocks: [["22:00", "24:00"]] }, 60)).toEqual(["22:00", "23:00"]);
    expect(weeklySlots({ open: false, blocks: [["09:00", "12:00"]] }, 60)).toEqual([]);
  });
});

describe("openSlotsForDate", () => {
  const av = defaultAvailability();
  it("resta horas bloqueadas y respeta el día cerrado", () => {
    av.overrides["2026-11-17"] = { blocked: ["10:00"] };
    expect(openSlotsForDate(av, "2026-11-17", 2, 60)).not.toContain("10:00");
    av.overrides["2026-11-18"] = { closed: true };
    expect(openSlotsForDate(av, "2026-11-18", 3, 60)).toEqual([]);
  });
});

describe("parseAvailability", () => {
  it("acepta la disponibilidad por defecto", () => {
    expect(parseAvailability(defaultAvailability())).toEqual(defaultAvailability());
  });

  it("descarta claves desconocidas, excepciones vacías y fechas pasadas; ordena y deduplica", () => {
    const raw = {
      ...defaultAvailability(),
      evil: "<script>",
      overrides: {
        "2026-11-10": { closed: true },
        "2026-11-20": { blocked: ["11:00", "09:00", "09:00"], extra: 1 },
        "2026-11-21": {},
      },
    };
    expect(parseAvailability(raw, "2026-11-16")).toEqual({
      week: defaultAvailability().week,
      overrides: { "2026-11-20": { blocked: ["09:00", "11:00"] } },
    });
  });

  it("un día abierto sin franjas queda cerrado", () => {
    const raw = defaultAvailability();
    raw.week[1] = { open: true, blocks: [] };
    expect(parseAvailability(raw).week[1].open).toBe(false);
  });

  it.each([
    ["no objeto", null],
    ["hora inválida", { ...defaultAvailability(), week: { ...defaultAvailability().week, 1: { open: true, blocks: [["9am", "12:00"]] } } }],
    ["fin antes del inicio", { ...defaultAvailability(), week: { ...defaultAvailability().week, 1: { open: true, blocks: [["12:00", "09:00"]] } } }],
    ["inicio 24:00", { ...defaultAvailability(), week: { ...defaultAvailability().week, 1: { open: true, blocks: [["24:00", "24:00"]] } } }],
    ["día faltante", { week: { 1: { open: true, blocks: [] } }, overrides: {} }],
    ["fecha mal formada", { ...defaultAvailability(), overrides: { "2026-1-1": { closed: true } } }],
    ["hora bloqueada inválida", { ...defaultAvailability(), overrides: { "2026-12-01": { blocked: ["25:00"] } } }],
    ["demasiadas franjas", { ...defaultAvailability(), week: { ...defaultAvailability().week, 1: { open: true, blocks: Array(9).fill(["09:00", "10:00"]) } } }],
  ])("rechaza: %s", (_, raw) => {
    expect(() => parseAvailability(raw)).toThrow(InvalidAvailabilityError);
  });
});
