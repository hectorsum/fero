import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter } from "./MemoryRateLimiter";
import { allowBookingForContact, allowBookingFromIp, allowSlotsQuery, BOOKING_RATE_LIMITS, hashKey } from "./rate-limit";
import { TurnstileVerifier } from "./TurnstileVerifier";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MemoryRateLimiter", () => {
  it("permite hasta max y luego devuelve la espera; se reinicia con la ventana", async () => {
    let t = 0;
    const rl = new MemoryRateLimiter(() => t);
    expect(await rl.consume("k", 2, 60)).toBe(0);
    expect(await rl.consume("k", 2, 60)).toBe(0);
    t = 10_000;
    expect(await rl.consume("k", 2, 60)).toBe(50);
    expect(await rl.consume("otra", 2, 60)).toBe(0);
    t = 60_000;
    expect(await rl.consume("k", 2, 60)).toBe(0);
  });
});

describe("límites de reserva", () => {
  it("5 reservas por IP", async () => {
    const rl = new MemoryRateLimiter();
    for (let i = 0; i < BOOKING_RATE_LIMITS.createPerIp.max; i++) expect(await allowBookingFromIp(rl, "1.1.1.1")).toBe(true);
    expect(await allowBookingFromIp(rl, "1.1.1.1")).toBe(false);
    expect(await allowBookingFromIp(rl, "2.2.2.2")).toBe(true);
  });

  it("3 por teléfono (solo dígitos) y por correo (sin mayúsculas)", async () => {
    const rl = new MemoryRateLimiter();
    expect(await allowBookingForContact(rl, { phone: "999 888 777", email: "a@b.co" })).toBe(true);
    expect(await allowBookingForContact(rl, { phone: "999-888-777", email: "x@b.co" })).toBe(true);
    expect(await allowBookingForContact(rl, { phone: "(999)888777", email: "y@b.co" })).toBe(true);
    expect(await allowBookingForContact(rl, { phone: "999888777", email: "z@b.co" })).toBe(false);
    expect(await allowBookingForContact(rl, { phone: "111", email: "A@B.CO" })).toBe(true);
    expect(await allowBookingForContact(rl, { phone: "222", email: "a@b.co " })).toBe(true);
    expect(await allowBookingForContact(rl, { phone: "333", email: "a@B.co" })).toBe(false);
  });

  it("60 consultas de horarios por IP", async () => {
    const rl = new MemoryRateLimiter();
    for (let i = 0; i < 60; i++) await allowSlotsQuery(rl, "1.1.1.1");
    expect(await allowSlotsQuery(rl, "1.1.1.1")).toBe(false);
  });

  it("las claves van hasheadas (formato que exige la base)", async () => {
    const consume = vi.fn(async () => 0);
    await allowBookingFromIp({ consume }, "1.1.1.1");
    expect(consume).toHaveBeenCalledWith(hashKey("booking:ip:1.1.1.1"), 5, 3600);
    expect(hashKey("x")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("TurnstileVerifier", () => {
  const mockFetch = (impl: () => Promise<Response>) => {
    const f = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(impl);
    vi.stubGlobal("fetch", f);
    return f;
  };
  const ok = (success: boolean) => async () => Response.json({ success, "error-codes": success ? [] : ["invalid-input-response"] });

  it("envía secret, token e IP a siteverify", async () => {
    const f = mockFetch(ok(true));
    expect(await new TurnstileVerifier("sec", true).verify("tok", "1.2.3.4")).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = init.body as URLSearchParams;
    expect([body.get("secret"), body.get("response"), body.get("remoteip")]).toEqual(["sec", "tok", "1.2.3.4"]);
  });

  it("rechaza tokens inválidos o vacíos", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockFetch(ok(false));
    expect(await new TurnstileVerifier("sec", true).verify("tok", "1.2.3.4")).toBe(false);
    expect(await new TurnstileVerifier("sec", true).verify("", "1.2.3.4")).toBe(false);
  });

  it("falla cerrado si Cloudflare no responde", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetch(async () => Promise.reject(new Error("network")));
    expect(await new TurnstileVerifier("sec", true).verify("tok", "1.2.3.4")).toBe(false);
  });

  it("sin secret: rechaza en producción y deja pasar en desarrollo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const f = mockFetch(ok(true));
    expect(await new TurnstileVerifier(undefined, true).verify("tok", "ip")).toBe(false);
    expect(await new TurnstileVerifier(undefined, false).verify("tok", "ip")).toBe(true);
    expect(f).not.toHaveBeenCalled();
  });
});
