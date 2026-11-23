import { afterEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/domain/entities/Booking";
import { BARBER_EMAIL, BARBER_WHATSAPP, SHOP_ADDRESS } from "@/infrastructure/config/shop";
import { ResendBookingNotifier } from "./ResendBookingNotifier";
import { ResendCustomerNotifier } from "./ResendCustomerNotifier";
import { isResendTestSender, RESEND_TEST_FROM } from "./resend";
import { adminBookingEmail, customerWhatsappUrl } from "./templates/admin-booking";
import { customerConfirmationEmail, mapsUrl } from "./templates/customer-confirmation";
import { formatDate } from "./templates/shared";

const booking = (over: Partial<Booking> = {}): Booking => ({
  id: "b1",
  service: "corte",
  date: "2026-11-21",
  time: "10:00",
  durationMin: 60,
  contact: { name: "Ana Pérez", phone: "+51 999 888 777", email: "ana@example.com" },
  notes: "",
  createdAt: new Date(),
  ...over,
});

const evil = '<script>alert("x")</script>';

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status = 200) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(status === 200 ? '{"id":"e1"}' : "boom", { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const sent = (f: ReturnType<typeof mockFetch>) => {
  const [url, init] = f.mock.calls[0];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
};

describe("plantillas", () => {
  it("formatea la fecha local sin desfase", () => {
    expect(formatDate("2026-11-21")).toBe("sábado, 21 de noviembre");
  });

  it("admin: incluye los datos de la cita", async () => {
    const { subject, text } = await adminBookingEmail(booking({ notes: "Degradado" }));
    expect(subject).toContain("Ana Pérez");
    expect(text).toContain("Teléfono: +51 999 888 777");
    expect(text).toContain("Notas: Degradado");
  });

  it("cliente: fecha, hora, dirección, Maps y WhatsApp", async () => {
    const { subject, text, html } = await customerConfirmationEmail(booking());
    expect(subject).toBe("Tu cita en FERO — sábado, 21 de noviembre, 10:00");
    for (const out of [text, html]) {
      expect(out).toContain("sábado, 21 de noviembre");
      expect(out).toContain("10:00");
      expect(out).toContain(SHOP_ADDRESS);
      expect(out).toContain(`https://wa.me/${BARBER_WHATSAPP.replace(/\D/g, "")}`);
      expect(out).toContain("Si necesitas cancelar o reprogramar, avísanos por WhatsApp con anticipación");
    }
    expect(text).toContain(mapsUrl(SHOP_ADDRESS));
    expect(html).toContain('lang="es"');
    expect(html).toContain("https://fero.ink/email/logo.png");
    expect(html).toContain("https://fero.ink/email/banner.jpg");
    expect(mapsUrl("Av 1, Lima")).toBe("https://www.google.com/maps/search/?api=1&query=Av%201%2C%20Lima");
  });

  it("escapa HTML malicioso en nombre y notas", async () => {
    const b = booking({ notes: evil, contact: { name: evil, phone: "1", email: "a@b.co" } });
    for (const { html } of [await adminBookingEmail(b), await customerConfirmationEmail(b)]) {
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    }
  });

  it("asuntos sin saltos de línea", async () => {
    const b = booking({ contact: { name: "Ana\r\nBcc: x@y.z", phone: "1", email: "a@b.co" } });
    expect((await adminBookingEmail(b)).subject).not.toMatch(/[\r\n]/);
    expect((await customerConfirmationEmail(b)).subject).not.toMatch(/[\r\n]/);
  });
});

describe("WhatsApp del cliente (aviso al admin)", () => {
  it.each([
    ["924 230 225", "https://wa.me/51924230225"],
    ["+51 924 230 225", "https://wa.me/51924230225"],
    ["+52 55 1234 5678", "https://wa.me/525512345678"],
    ["12345", null],
  ])("%s → %s", (phone, url) => {
    expect(customerWhatsappUrl(phone)).toBe(url);
  });
});

describe("notificadores", () => {
  const env = { apiKey: "re_test", to: "admin@example.com", from: "FERO <citas@fero.ink>" };

  it("cliente: destinatario, reply_to, remitente e idempotencia", async () => {
    const f = mockFetch();
    await new ResendCustomerNotifier(env).bookingConfirmed(booking());
    const { url, headers, body } = sent(f);
    expect(url).toBe("https://api.resend.com/emails");
    expect(headers.Authorization).toBe("Bearer re_test");
    expect(headers["Idempotency-Key"]).toBe("booking-customer-b1");
    expect(body).toMatchObject({ from: env.from, to: ["ana@example.com"], reply_to: BARBER_EMAIL });
  });

  it("cliente: con el remitente de prueba no envía y avisa", async () => {
    const f = mockFetch();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await new ResendCustomerNotifier({ ...env, from: RESEND_TEST_FROM }).bookingConfirmed(booking());
    expect(f).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("admin: va a NOTIFY_EMAIL y responde al cliente", async () => {
    const f = mockFetch();
    await new ResendBookingNotifier(env).bookingCreated(booking());
    const { headers, body } = sent(f);
    expect(headers["Idempotency-Key"]).toBe("booking-b1");
    expect(body).toMatchObject({ to: ["admin@example.com"], reply_to: "ana@example.com" });
  });

  it("propaga errores de Resend", async () => {
    mockFetch(422);
    await expect(new ResendCustomerNotifier(env).bookingConfirmed(booking())).rejects.toThrow(/Resend 422/);
  });

  it("detecta el remitente de prueba", () => {
    expect(isResendTestSender(RESEND_TEST_FROM)).toBe(true);
    expect(isResendTestSender("onboarding@resend.dev")).toBe(true);
    expect(isResendTestSender("FERO <citas@fero.ink>")).toBe(false);
  });
});
