import { openSlotsForDate, type Availability, type Weekday } from "../entities/Availability";
import type { ServiceType } from "../entities/Booking";
import { toMinutes, type TimeSlot } from "../value-objects/TimeSlot";

export interface ShopSchedule {
  /** Zona horaria IANA del local, p. ej. "America/Lima". */
  timeZone: string;
  /** Duración de cada slot de la agenda (los horarios salen de la disponibilidad del admin). */
  slotMinutes: number;
  serviceDuration: Readonly<Record<ServiceType, number>>;
}

/** Fecha local a medianoche. */
export function startOfDay(d: Date): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

export const isPastDate = (date: Date, today: Date = startOfDay(new Date())) => date < today;

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parsea "YYYY-MM-DD" como fecha local; null si no es una fecha real. */
export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toISODate(d) === s ? d : null;
}

/** "Ahora" expresado en la hora local del local (independiente de la zona del servidor). */
export interface ShopNow {
  /** "YYYY-MM-DD" */
  date: string;
  /** Minutos desde medianoche. */
  minutes: number;
}

export function shopNow(instant: Date, timeZone: string): ShopNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

interface Interval {
  time: TimeSlot;
  durationMin: number;
}

export function overlaps(a: Interval, b: Interval): boolean {
  const aStart = toMinutes(a.time);
  const bStart = toMinutes(b.time);
  return aStart < bStart + b.durationMin && bStart < aStart + a.durationMin;
}

/**
 * Horarios de inicio disponibles para un servicio de `durationMin` en `date`:
 * el servicio debe caber en slots consecutivos abiertos ese día (`hours`), no solaparse
 * con citas existentes y, si la fecha es hoy, empezar después de `now`.
 */
export function availableSlots(params: {
  /** Slots abiertos de ese día (ver openSlotsForDate). */
  hours: readonly TimeSlot[];
  slotMinutes: number;
  date: string;
  durationMin: number;
  booked: readonly Interval[];
  now: ShopNow;
}): TimeSlot[] {
  const { hours, slotMinutes, date, durationMin, booked, now } = params;
  const day = parseISODate(date);
  if (!day || date < now.date) return [];

  const open = new Set(hours.map(toMinutes));
  const blocks = Math.ceil(durationMin / slotMinutes);
  const isToday = date === now.date;

  return hours.filter((time) => {
    const start = toMinutes(time);
    if (isToday && start <= now.minutes) return false;
    for (let k = 0; k < blocks; k++) {
      if (!open.has(start + k * slotMinutes)) return false;
    }
    return !booked.some((b) => overlaps({ time, durationMin }, b));
  });
}

/** Slots abiertos de una fecha "YYYY-MM-DD" según la disponibilidad configurada. */
export function openHoursForDate(av: Availability, date: string, slotMinutes: number): TimeSlot[] {
  const day = parseISODate(date);
  if (!day) return [];
  return openSlotsForDate(av, date, day.getDay() as Weekday, slotMinutes);
}

/** Desfase (ms) de `timeZone` respecto a UTC en el instante dado. */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const g = (t: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Instante UTC de una fecha "YYYY-MM-DD" + minutos desde medianoche, en la hora local de `timeZone`. */
export function zonedToUtc(date: string, minutes: number, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const first = guess - tzOffsetMs(new Date(guess), timeZone);
  // Segunda pasada por si el desfase cambia (horario de verano) entre la suposición y el resultado.
  return new Date(guess - tzOffsetMs(new Date(first), timeZone));
}

/**
 * Convierte intervalos ocupados (instantes UTC) a ocupación local de `date`, recortados al día.
 * Sirve para cruzar eventos de un calendario externo con la agenda.
 */
export function busyToDayIntervals(
  busy: readonly { start: Date; end: Date }[],
  date: string,
  timeZone: string,
): { date: string; time: TimeSlot; durationMin: number }[] {
  const dayStart = zonedToUtc(date, 0, timeZone).getTime();
  const dayEnd = zonedToUtc(date, 24 * 60, timeZone).getTime();
  const out: { date: string; time: TimeSlot; durationMin: number }[] = [];
  for (const b of busy) {
    const s = Math.max(b.start.getTime(), dayStart);
    const e = Math.min(b.end.getTime(), dayEnd);
    if (!(e > s)) continue;
    const startMin = Math.floor((s - dayStart) / 60000);
    const endMin = Math.ceil((e - dayStart) / 60000);
    out.push({ date, time: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`, durationMin: endMin - startMin });
  }
  return out;
}
