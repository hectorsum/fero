import type { BookedSlot, Booking } from "../entities/Booking";

/** Calendario externo del admin (p. ej. Google Calendar). */
export interface CalendarSync {
  /** Ocupación del calendario externo en la fecha local "YYYY-MM-DD". [] si no aplica. */
  busy(date: string): Promise<BookedSlot[]>;
  /** Crea el evento de una cita. Devuelve su id, o null si la sincronización está desactivada. */
  createEvent(booking: Booking): Promise<string | null>;
}
