import { describe, expect, it, vi } from "vitest";
import type { Booking } from "@/domain/entities/Booking";
import type { CreateBookingInput } from "../create-booking";
import { makeSubmitBooking, MIN_ELAPSED_MS, type SubmitBookingInput } from "../submit-booking";

const input = (over: Partial<SubmitBookingInput> = {}): SubmitBookingInput => ({
  service: "corte",
  date: "2026-11-17",
  time: "09:00",
  name: "Ana",
  phone: "999 333 122",
  email: "ana@correo.com",
  notes: "",
  captchaToken: "tok",
  website: "",
  elapsedMs: 10_000,
  ...over,
});

function setup(opts: { ip?: boolean; captcha?: boolean; contact?: boolean } = {}) {
  const log: string[] = [];
  const deps = {
    limits: {
      ip: vi.fn(async () => (log.push("ip"), opts.ip ?? true)),
      contact: vi.fn(async () => (log.push("contact"), opts.contact ?? true)),
    },
    verifier: { verify: vi.fn(async () => (log.push("captcha"), opts.captcha ?? true)) },
    createBooking: vi.fn(async (i: CreateBookingInput) => (log.push("create"), { id: "b1", ...i }) as unknown as Booking),
  };
  return { log, deps, submit: makeSubmitBooking(deps) };
}
const ctx = { ip: "1.2.3.4" };

describe("submitBooking", () => {
  it("orden: IP → CAPTCHA → contacto → crear", async () => {
    const { log, submit, deps } = setup();
    expect(await submit(input(), ctx)).toMatchObject({ status: "created" });
    expect(log).toEqual(["ip", "captcha", "contact", "create"]);
    expect(deps.verifier.verify).toHaveBeenCalledWith("tok", "1.2.3.4");
  });

  it("honeypot relleno: responde como si nada y no hace nada más", async () => {
    const { log, submit } = setup();
    expect(await submit(input({ website: "http://spam" }), ctx)).toEqual({ status: "ignored" });
    expect(log).toEqual([]);
  });

  it.each([0, MIN_ELAPSED_MS - 1, NaN])("demasiado rápido (%s ms): SPAM sin consumir límites", async (elapsedMs) => {
    const { log, submit } = setup();
    await expect(submit(input({ elapsedMs }), ctx)).rejects.toMatchObject({ code: "SPAM" });
    expect(log).toEqual([]);
  });

  it("límite por IP antes del CAPTCHA", async () => {
    const { log, submit } = setup({ ip: false });
    await expect(submit(input(), ctx)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(log).toEqual(["ip"]);
  });

  it("CAPTCHA inválido no consume límites de contacto", async () => {
    const { log, submit } = setup({ captcha: false });
    await expect(submit(input(), ctx)).rejects.toMatchObject({ code: "CAPTCHA_FAILED" });
    expect(log).toEqual(["ip", "captcha"]);
  });

  it("entrada inválida se rechaza antes de los límites de contacto", async () => {
    const { log, submit } = setup();
    await expect(submit(input({ email: "no-es-correo" }), ctx)).rejects.toMatchObject({ name: "InvalidContactInfoError" });
    expect(log).toEqual(["ip", "captcha"]);
  });

  it("límite por teléfono/correo antes de crear", async () => {
    const { log, submit } = setup({ contact: false });
    await expect(submit(input(), ctx)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(log).toEqual(["ip", "captcha", "contact"]);
  });
});
