import { describe, expect, it } from "vitest";
import type { Booking } from "@/domain/entities/Booking";
import { bookingEmail, formatDate } from "./ResendBookingNotifier";

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
} as Booking);

describe("bookingEmail", () => {
  it("formatea la fecha local sin desfase", () => {
    expect(formatDate("2026-11-21")).toBe("sábado, 21 de noviembre");
  });

  it("incluye los datos de la cita", () => {
    const { subject, text } = bookingEmail(booking({ notes: "Degradado" }));
    expect(subject).toContain("Ana Pérez");
    expect(subject).toContain("10:00");
    expect(text).toContain("Teléfono: +51 999 888 777");
    expect(text).toContain("Notas: Degradado");
  });

  it("escapa HTML de los datos del cliente", () => {
    const { html } = bookingEmail(booking({ notes: '<script>alert("x")</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("no permite saltos de línea en el asunto", () => {
    const { subject } = bookingEmail(booking({ contact: { name: "Ana\r\nBcc: x@y.z", phone: "1", email: "a@b.c" } } as Partial<Booking>));
    expect(subject).not.toMatch(/[\r\n]/);
  });
});
