import type { ContactInfo } from "../value-objects/ContactInfo";
import type { TimeSlot } from "../value-objects/TimeSlot";

export type BookingMode = "corte" | "tatuaje";

export const SERVICE_TYPES = ["completo", "barba", "corte"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const isServiceType = (v: string): v is ServiceType => (SERVICE_TYPES as readonly string[]).includes(v);

export interface Booking {
  id: string;
  service: ServiceType;
  /** Fecha local "YYYY-MM-DD". */
  date: string;
  time: TimeSlot;
  durationMin: number;
  contact: ContactInfo;
  notes: string;
  createdAt: Date;
}

export type NewBooking = Omit<Booking, "id" | "createdAt">;

/** Ocupación de un horario, sin datos personales. */
export type BookedSlot = Pick<Booking, "date" | "time" | "durationMin">;

export const MAX_NOTES_LENGTH = 1000;

/** Citas confirmadas futuras que puede tener a la vez un mismo teléfono o correo. */
export const MAX_ACTIVE_BOOKINGS_PER_CONTACT = 2;

export type BookingErrorCode =
  | "INVALID_SERVICE"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "INVALID_NOTES"
  | "SLOT_UNAVAILABLE"
  | "TOO_MANY_ACTIVE_BOOKINGS";

export class BookingError extends Error {
  constructor(readonly code: BookingErrorCode, message: string = code) {
    super(message);
    this.name = "BookingError";
  }
}
