import { beforeEach, describe, expect, it } from "vitest";
import { BookingError } from "@/domain/entities/Booking";
import type { ShopSchedule } from "@/domain/services/scheduling";
import { InvalidContactInfoError } from "@/domain/value-objects/ContactInfo";
import { makeCreateBooking, type CreateBookingInput } from "../create-booking";
import { makeGetAvailableSlots } from "../get-available-slots";
import { InMemoryBookingRepository } from "./InMemoryBookingRepository";

const schedule: ShopSchedule = {
  hours: ["09:00", "10:00", "11:00", "14:00", "15:00"],
  slotMinutes: 60,
  serviceDuration: { completo: 120, barba: 60, corte: 60 },
};
const now = () => new Date(2026, 10, 16, 8, 0); // lunes
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
let createBooking: ReturnType<typeof makeCreateBooking>;
let getAvailableSlots: ReturnType<typeof makeGetAvailableSlots>;

beforeEach(() => {
  repo = new InMemoryBookingRepository();
  createBooking = makeCreateBooking({ repo, schedule, now });
  getAvailableSlots = makeGetAvailableSlots({ repo, schedule, now });
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

  it("valida la entrada", async () => {
    await rejectsWith(createBooking(input({ service: "tinte" })), "INVALID_SERVICE");
    await rejectsWith(createBooking(input({ date: "17/11/2026" })), "INVALID_DATE");
    await rejectsWith(createBooking(input({ time: "9am" })), "INVALID_TIME");
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

  it("servicio desconocido", async () => {
    await expect(getAvailableSlots({ date: DATE, service: "x" as never })).rejects.toBeInstanceOf(BookingError);
  });
});
