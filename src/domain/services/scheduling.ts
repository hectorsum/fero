import type { ServiceType } from "../entities/Booking";
import { toMinutes, type TimeSlot } from "../value-objects/TimeSlot";

export interface ShopSchedule {
  /** Inicios de bloque en los que el local atiende. */
  hours: readonly TimeSlot[];
  /** Duración de cada bloque de `hours`. */
  slotMinutes: number;
  serviceDuration: Readonly<Record<ServiceType, number>>;
}

/** Fecha local a medianoche. */
export function startOfDay(d: Date): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

/** El local cierra los domingos. */
export const isClosedDay = (date: Date) => date.getDay() === 0;

export const isPastDate = (date: Date, today: Date = startOfDay(new Date())) => date < today;

export const isBookableDate = (date: Date, today: Date = startOfDay(new Date())) =>
  !isClosedDay(date) && !isPastDate(date, today);

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parsea "YYYY-MM-DD" como fecha local; null si no es una fecha real. */
export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toISODate(d) === s ? d : null;
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
 * el servicio debe caber en bloques consecutivos del horario del local, no solaparse
 * con citas existentes y, si la fecha es hoy, empezar después de `now`.
 */
export function availableSlots(params: {
  schedule: ShopSchedule;
  date: string;
  durationMin: number;
  booked: readonly Interval[];
  now?: Date;
}): TimeSlot[] {
  const { schedule, date, durationMin, booked, now = new Date() } = params;
  const day = parseISODate(date);
  if (!day || !isBookableDate(day, startOfDay(now))) return [];

  const open = new Set(schedule.hours.map(toMinutes));
  const blocks = Math.ceil(durationMin / schedule.slotMinutes);
  const isToday = toISODate(now) === date;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return schedule.hours.filter((time) => {
    const start = toMinutes(time);
    if (isToday && start <= nowMin) return false;
    for (let k = 0; k < blocks; k++) {
      if (!open.has(start + k * schedule.slotMinutes)) return false;
    }
    return !booked.some((b) => overlaps({ time, durationMin }, b));
  });
}
