import type { BookedSlot, Booking } from "@/domain/entities/Booking";
import type { CalendarSync } from "@/domain/repositories/CalendarSync";
import { busyToDayIntervals, zonedToUtc } from "@/domain/services/scheduling";
import { toMinutes } from "@/domain/value-objects/TimeSlot";
import { serviceName } from "@/infrastructure/config/shop";
import type { GoogleCalendarConnectionRepo, GoogleConnection } from "./GoogleCalendarConnection";
import { accessTokenFor, GoogleAuthError } from "./oauth";

const API = "https://www.googleapis.com/calendar/v3";

/** Fecha-hora local "YYYY-MM-DDTHH:MM:00" (Google la interpreta con `timeZone`). */
const localDateTime = (date: string, minutes: number) => {
  const d = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 0, minutes));
  return d.toISOString().slice(0, 19);
};

export class GoogleCalendarSync implements CalendarSync {
  private conn: Promise<GoogleConnection | null> | null = null;

  constructor(
    private readonly repo: GoogleCalendarConnectionRepo,
    private readonly timeZone: string,
  ) {}

  private connection() {
    return (this.conn ??= this.repo.get());
  }

  private async call(c: GoogleConnection, path: string, init: RequestInit): Promise<Record<string, unknown>> {
    try {
      const token = await accessTokenFor(c.refreshToken);
      const res = await fetch(`${API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${JSON.stringify(json.error ?? json).slice(0, 300)}`);
      if (c.lastError) await this.repo.setError(null);
      return json;
    } catch (e) {
      // invalid_grant = el usuario revocó el acceso o el token expiró: hay que reconectar.
      const msg =
        e instanceof GoogleAuthError && e.code === "invalid_grant"
          ? "Google rechazó el acceso. Vuelve a conectar tu calendario."
          : "No pudimos comunicarnos con Google Calendar.";
      await this.repo.setError(msg).catch(() => undefined);
      throw e;
    }
  }

  async busy(date: string): Promise<BookedSlot[]> {
    const c = await this.connection();
    if (!c?.respectBusy) return [];
    const json = await this.call(c, "/freeBusy", {
      method: "POST",
      body: JSON.stringify({
        timeMin: zonedToUtc(date, 0, this.timeZone).toISOString(),
        timeMax: zonedToUtc(date, 24 * 60, this.timeZone).toISOString(),
        timeZone: this.timeZone,
        items: [{ id: c.calendarId }],
      }),
    });
    const cals = json.calendars as Record<string, { busy?: { start: string; end: string }[] }> | undefined;
    const busy = (cals?.[c.calendarId]?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
    return busyToDayIntervals(busy, date, this.timeZone);
  }

  async createEvent(b: Booking): Promise<string | null> {
    const c = await this.connection();
    if (!c?.syncEvents) return null;
    const start = toMinutes(b.time);
    const service = serviceName(b.service);
    const json = await this.call(c, `/calendars/${encodeURIComponent(c.calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify({
        summary: `${service} — ${b.contact.name}`,
        description: [
          `Servicio: ${service}`,
          `Cliente: ${b.contact.name}`,
          `Teléfono: ${b.contact.phone}`,
          `Correo: ${b.contact.email}`,
          ...(b.notes ? [`Notas: ${b.notes}`] : []),
          "",
          "Agendado desde la web de FERO.",
        ].join("\n"),
        start: { dateTime: localDateTime(b.date, start), timeZone: this.timeZone },
        end: { dateTime: localDateTime(b.date, start + b.durationMin), timeZone: this.timeZone },
        // Sin invitados: no se le envía correo de Google al cliente.
        reminders: { useDefault: true },
        extendedProperties: { private: { feroBookingId: b.id } },
      }),
    });
    return typeof json.id === "string" ? json.id : null;
  }
}
