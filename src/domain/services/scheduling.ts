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
