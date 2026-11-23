import type { Booking } from "@/domain/entities/Booking";
import { zonedToUtc } from "@/domain/services/scheduling";
import { toMinutes } from "@/domain/value-objects/TimeSlot";

export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

/** Evento de una cita. Fecha y hora se guardan en hora local del local: se pasan a UTC. */
export function bookingEvent(b: Booking, opts: { timeZone: string; title: string; description: string; location: string }): CalendarEvent {
  const startMin = toMinutes(b.time);
  return {
    uid: `booking-${b.id}@fero.ink`,
    title: opts.title,
    description: opts.description,
    location: opts.location,
    start: zonedToUtc(b.date, startMin, opts.timeZone),
    end: zonedToUtc(b.date, startMin + b.durationMin, opts.timeZone),
  };
}

/** 20261125T230000Z */
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Enlace "Agregar a Google Calendar" con el evento ya rellenado (no requiere permisos). */
export function googleCalendarUrl(e: CalendarEvent): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${utcStamp(e.start)}/${utcStamp(e.end)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Escapa texto según RFC 5545 (\\ ; , y saltos de línea). */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Pliega líneas de más de 75 octetos (RFC 5545 §3.1) sin partir caracteres UTF-8. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/** Archivo .ics (iCalendar) con un evento: Apple Calendar, Outlook y Gmail lo agregan con un toque. */
export function icsFile(e: CalendarEvent, now: Date = new Date()): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FERO//Citas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(e.description)}`,
    `LOCATION:${icsText(e.location)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(e.title)}`,
    "TRIGGER:-PT2H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}
