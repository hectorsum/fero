import { isTimeSlot, type TimeSlot } from "../value-objects/TimeSlot";

/** 0 = domingo … 6 = sábado (como Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Franja [desde, hasta). "hasta" puede ser "24:00". */
export type TimeBlock = readonly [TimeSlot, TimeSlot];

export interface DaySchedule {
  open: boolean;
  blocks: TimeBlock[];
}

/** Excepción para una fecha concreta. */
export interface DayOverride {
  closed?: boolean;
  /** Inicios de slot bloqueados ese día. */
  blocked?: TimeSlot[];
}

export interface Availability {
  week: Record<Weekday, DaySchedule>;
  /** Clave "YYYY-MM-DD". */
  overrides: Record<string, DayOverride>;
}

export const MAX_BLOCKS_PER_DAY = 8;
export const MAX_OVERRIDES = 400;

const STD = (): TimeBlock[] => [
  ["09:00", "12:00"],
  ["14:00", "21:00"],
];

export function defaultAvailability(): Availability {
  return {
    week: { 0: { open: false, blocks: [] }, 1: { open: true, blocks: STD() }, 2: { open: true, blocks: STD() }, 3: { open: true, blocks: STD() }, 4: { open: true, blocks: STD() }, 5: { open: true, blocks: STD() }, 6: { open: true, blocks: STD() } },
    overrides: {},
  };
}

export class InvalidAvailabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvailabilityError";
  }
}

/** Minutos desde medianoche; acepta "24:00" solo si `allowEnd`. */
export function blockMinutes(t: string, allowEnd = false): number | null {
  if (allowEnd && t === "24:00") return 24 * 60;
  if (!isTimeSlot(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const toSlot = (m: number): TimeSlot => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Inicios de slot que genera el horario semanal de un día. */
export function weeklySlots(day: DaySchedule, slotMinutes: number): TimeSlot[] {
  if (!day.open) return [];
  const out = new Set<number>();
  for (const [a, b] of day.blocks) {
    const s = blockMinutes(a);
    const e = blockMinutes(b, true);
    if (s == null || e == null) continue;
    for (let m = s; m + slotMinutes <= e; m += slotMinutes) out.add(m);
  }
  return [...out].sort((x, y) => x - y).map(toSlot);
}

/** Slots abiertos de una fecha: horario semanal menos día cerrado / horas bloqueadas. */
export function openSlotsForDate(av: Availability, date: string, weekday: Weekday, slotMinutes: number): TimeSlot[] {
  const ov = av.overrides[date];
  if (ov?.closed) return [];
  const blocked = new Set(ov?.blocked ?? []);
  return weeklySlots(av.week[weekday], slotMinutes).filter((t) => !blocked.has(t));
}

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Valida y normaliza una disponibilidad de origen no confiable (cliente o base).
 * Descarta claves desconocidas; lanza InvalidAvailabilityError con un mensaje para el usuario.
 * Si se da `today` ("YYYY-MM-DD"), elimina excepciones de fechas pasadas.
 */
export function parseAvailability(raw: unknown, today?: string): Availability {
  if (!isObj(raw) || !isObj(raw.week)) throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
  const weekRaw = raw.week;
  const week = {} as Record<Weekday, DaySchedule>;

  for (const wd of WEEKDAYS) {
    const d = weekRaw[String(wd)];
    if (!isObj(d) || typeof d.open !== "boolean" || !Array.isArray(d.blocks)) {
      throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
    }
    if (d.blocks.length > MAX_BLOCKS_PER_DAY) throw new InvalidAvailabilityError(`Máximo ${MAX_BLOCKS_PER_DAY} horarios por día.`);
    const blocks: TimeBlock[] = d.blocks.map((b) => {
      if (!Array.isArray(b) || b.length !== 2 || typeof b[0] !== "string" || typeof b[1] !== "string") {
        throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
      }
      const s = blockMinutes(b[0]);
      const e = blockMinutes(b[1], true);
      if (s == null || e == null) throw new InvalidAvailabilityError("Revisa las horas: usa el formato 9:00 o 13:30.");
      if (s >= e) throw new InvalidAvailabilityError(`El horario ${b[0]} a ${b[1]} termina antes de empezar.`);
      return [b[0], b[1]] as const;
    });
    week[wd] = { open: d.open && blocks.length > 0, blocks };
  }

  const overrides: Record<string, DayOverride> = {};
  const ovRaw = raw.overrides ?? {};
  if (!isObj(ovRaw)) throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
  const keys = Object.keys(ovRaw);
  if (keys.length > MAX_OVERRIDES) throw new InvalidAvailabilityError("Demasiadas excepciones de fechas.");
  for (const k of keys) {
    if (!ISO_DATE_RE.test(k)) throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
    if (today && k < today) continue;
    const o = ovRaw[k];
    if (!isObj(o)) throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
    const closed = o.closed === true;
    const blockedRaw = o.blocked ?? [];
    if (!Array.isArray(blockedRaw) || blockedRaw.length > 48 || !blockedRaw.every((t) => typeof t === "string" && isTimeSlot(t))) {
      throw new InvalidAvailabilityError("Formato de disponibilidad inválido.");
    }
    const blocked = [...new Set(blockedRaw as string[])].sort();
    if (!closed && !blocked.length) continue;
    overrides[k] = { ...(closed ? { closed: true } : {}), ...(blocked.length ? { blocked } : {}) };
  }

  return { week, overrides };
}
