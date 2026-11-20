import { beforeEach, describe, expect, it } from "vitest";
import { defaultAvailability, type Availability } from "@/domain/entities/Availability";
import { BookingError } from "@/domain/entities/Booking";
import type { AvailabilityRepository } from "@/domain/repositories/AvailabilityRepository";
import type { CalendarSync } from "@/domain/repositories/CalendarSync";
import type { ShopSchedule } from "@/domain/services/scheduling";
import { InvalidContactInfoError } from "@/domain/value-objects/ContactInfo";
import { makeCreateBooking, type CreateBookingInput } from "../create-booking";
import { makeGetAvailableSlots } from "../get-available-slots";
import { InMemoryBookingRepository } from "./InMemoryBookingRepository";

const HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00"];
/** L–S 09–12 y 14–16; domingo cerrado. */
function makeAvailability(): Availability {
  const av = defaultAvailability();
  for (const wd of [1, 2, 3, 4, 5, 6] as const) av.week[wd] = { open: true, blocks: [["09:00", "12:00"], ["14:00", "16:00"]] };
  return av;
}
class InMemoryAvailabilityRepository implements AvailabilityRepository {
  constructor(public av: Availability) {}
  async get() {
    return this.av;
  }
  async save(av: Availability) {
    this.av = av;
  }
}

const schedule: ShopSchedule = {
  timeZone: "America/Lima",
  slotMinutes: 60,
  serviceDuration: { completo: 120, barba: 60, corte: 60 },
};
const now = () => new Date("2026-11-16T13:00:00Z"); // lunes 08:00 en Lima
const DATE = "2026-11-17";

const input = (over: Partial<CreateBookingInput> = {}): CreateBookingInput => ({
  service: "corte",
  date: DATE,
  time: "09:00",
  name: " Ana ",
  phone: "999 333 122",
  email: "ana@correo.com",
  notes: "  fade bajo ",
  ...over,
});

let repo: InMemoryBookingRepository;
let availability: InMemoryAvailabilityRepository;
let createBooking: ReturnType<typeof makeCreateBooking>;
let getAvailableSlots: ReturnType<typeof makeGetAvailableSlots>;

beforeEach(() => {
  repo = new InMemoryBookingRepository();
  availability = new InMemoryAvailabilityRepository(makeAvailability());
  createBooking = makeCreateBooking({ repo, availability, schedule, now });
  getAvailableSlots = makeGetAvailableSlots({ repo, availability, schedule, now });
});

const rejectsWith = (p: Promise<unknown>, code: string) => expect(p).rejects.toMatchObject({ name: "BookingError", code });

describe("CreateBooking", () => {
  it("guarda la cita normalizada con la duración del servicio", async () => {
    const b = await createBooking(input({ service: "completo" }));
    expect(b).toMatchObject({
      id: expect.any(String),
      service: "completo",
      date: DATE,
      time: "09:00",
      durationMin: 120,
      contact: { name: "Ana", phone: "999 333 122", email: "ana@correo.com" },
      notes: "fade bajo",
    });
    expect(repo.items).toHaveLength(1);
  });

  it("rechaza un horario ya ocupado (incluido por solapamiento)", async () => {
    await createBooking(input({ service: "completo", time: "09:00" }));
    await rejectsWith(createBooking(input({ time: "10:00" })), "SLOT_UNAVAILABLE");
    expect(repo.items).toHaveLength(1);
  });

  it("rechaza un servicio que no cabe en el horario del local", async () => {
    await rejectsWith(createBooking(input({ service: "completo", time: "11:00" })), "SLOT_UNAVAILABLE");
  });

  it("rechaza domingo y fechas pasadas", async () => {
    await rejectsWith(createBooking(input({ date: "2026-11-22" })), "SLOT_UNAVAILABLE");
    await rejectsWith(createBooking(input({ date: "2026-11-14" })), "SLOT_UNAVAILABLE");
  });

  it("respeta días cerrados y horas bloqueadas por el admin", async () => {
    availability.av.overrides[DATE] = { blocked: ["09:00"] };
    await rejectsWith(createBooking(input({ time: "09:00" })), "SLOT_UNAVAILABLE");
    availability.av.overrides[DATE] = { closed: true };
    await rejectsWith(createBooking(input({ time: "10:00" })), "SLOT_UNAVAILABLE");
  });

  it("permite domingo si el admin lo abre", async () => {
    availability.av.week[0] = { open: true, blocks: [["10:00", "12:00"]] };
    await expect(createBooking(input({ date: "2026-11-22", time: "10:00" }))).resolves.toMatchObject({ date: "2026-11-22" });
  });

  it("valida la entrada", async () => {
    await rejectsWith(createBooking(input({ service: "tinte" })), "INVALID_SERVICE");
    await rejectsWith(createBooking(input({ date: "17/11/2026" })), "INVALID_DATE");
    await rejectsWith(createBooking(input({ time: "9am" })), "INVALID_TIME");
    await rejectsWith(createBooking(input({ notes: "x".repeat(1001) })), "INVALID_NOTES");
    await expect(createBooking(input({ email: "x" }))).rejects.toBeInstanceOf(InvalidContactInfoError);
    expect(repo.items).toHaveLength(0);
  });
});

describe("GetAvailableSlots", () => {
  it("resta las citas del día considerando la duración del servicio", async () => {
    await createBooking(input({ time: "14:00" }));
    expect(await getAvailableSlots({ date: DATE, service: "corte" })).toEqual(["09:00", "10:00", "11:00", "15:00"]);
    expect(await getAvailableSlots({ date: DATE, service: "completo" })).toEqual(["09:00", "10:00"]);
  });

  it("no mezcla citas de otros días", async () => {
    await createBooking(input({ date: "2026-11-18", time: "09:00" }));
    expect(await getAvailableSlots({ date: DATE, service: "corte" })).toContain("09:00");
  });

  it("servicio o fecha inválidos", async () => {
    await expect(getAvailableSlots({ date: DATE, service: "x" as never })).rejects.toBeInstanceOf(BookingError);
    await rejectsWith(getAvailableSlots({ date: "2026-13-01", service: "corte" }), "INVALID_DATE");
  });

  it("usa la hora del local (Lima, UTC-5), no la del servidor", async () => {
    // 19:30 UTC = 14:30 en Lima: queda 15:00 hoy (en UTC no quedaría nada)
    const afternoon = makeGetAvailableSlots({ repo, availability, schedule, now: () => new Date("2026-11-16T19:30:00Z") });
    expect(await afternoon({ date: "2026-11-16", service: "corte" })).toEqual(["15:00"]);
    // 02:00 UTC del 17 = 21:00 del 16 en Lima: el 17 todavía es mañana y está completo
    const night = makeGetAvailableSlots({ repo, availability, schedule, now: () => new Date("2026-11-17T02:00:00Z") });
    expect(await night({ date: "2026-11-17", service: "corte" })).toEqual(HOURS);
  });
});

describe("Calendario externo (Google)", () => {
  const calendar = (busy: { time: string; durationMin: number }[], fail = false): CalendarSync => ({
    busy: async (date) => {
      if (fail) throw new Error("google caído");
      return busy.map((b) => ({ date, ...b }));
    },
    createEvent: async () => null,
  });

  it("no ofrece horas ocupadas en el calendario externo", async () => {
    const get = makeGetAvailableSlots({ repo, availability, schedule, now, calendar: calendar([{ time: "09:30", durationMin: 60 }]) });
    expect(await get({ date: DATE, service: "corte" })).toEqual(["11:00", "14:00", "15:00"]);
  });

  it("rechaza reservar sobre un evento externo", async () => {
    const create = makeCreateBooking({ repo, availability, schedule, now, calendar: calendar([{ time: "14:00", durationMin: 60 }]) });
    await rejectsWith(create(input({ time: "14:00" })), "SLOT_UNAVAILABLE");
  });

  it("si el calendario externo falla, la agenda sigue funcionando", async () => {
    const get = makeGetAvailableSlots({ repo, availability, schedule, now, calendar: calendar([], true) });
    expect(await get({ date: DATE, service: "corte" })).toEqual(HOURS);
  });
});
