import { describe, expect, it } from "vitest";
import type { Booking } from "@/domain/entities/Booking";
import { bookingEvent, googleCalendarUrl, icsFile } from "./calendar";

const booking: Booking = {
  id: "b1",
  service: "completo",
  date: "2026-11-25",
  time: "18:00",
  durationMin: 120,
  contact: { name: "Ana", phone: "1", email: "a@b.co" },
  notes: "",
  createdAt: new Date(),
};
const event = bookingEvent(booking, {
  timeZone: "America/Lima",
  title: "Corte, barba; y más",
  description: "Línea 1\nLínea 2",
  location: "Av Republica de Panama 5920, Miraflores, Lima",
});

describe("calendario del cliente", () => {
  it("convierte la hora de Lima (UTC-5) a UTC", () => {
    expect(event.start.toISOString()).toBe("2026-11-25T23:00:00.000Z");
    expect(event.end.toISOString()).toBe("2026-11-26T01:00:00.000Z");
  });

  it("enlace de Google Calendar con fechas en UTC", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20261125T230000Z/20261126T010000Z");
    expect(url.searchParams.get("location")).toContain("Miraflores");
  });

  it(".ics válido: CRLF, escapes RFC 5545, alarma y líneas de ≤75 octetos", () => {
    const ics = icsFile(event, new Date("2026-11-23T10:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:booking-b1@fero.ink");
    expect(ics).toContain("DTSTART:20261125T230000Z");
    expect(ics).toContain("DTEND:20261126T010000Z");
    expect(ics).toContain("SUMMARY:Corte\\, barba\; y más");
    expect(ics).toContain("DESCRIPTION:Línea 1\\nLínea 2");
    expect(ics).toContain("TRIGGER:-PT2H");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });

  it("pliega líneas largas y se pueden desplegar sin perder texto", () => {
    const long = { ...event, description: "ñ".repeat(100) };
    const unfolded = icsFile(long).replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${"ñ".repeat(100)}`);
  });
});
