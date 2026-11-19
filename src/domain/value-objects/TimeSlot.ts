/** Hora de inicio en formato "HH:MM" (24 h). */
export type TimeSlot = string;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isTimeSlot = (v: string): v is TimeSlot => TIME_RE.test(v);

export function toMinutes(t: TimeSlot): number {
  if (!isTimeSlot(t)) throw new Error(`Hora inválida: ${t}`);
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
